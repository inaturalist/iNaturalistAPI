const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../../pg_client" );
const esClient = require( "../../es_client" );
const util = require( "../../util" );
const Model = require( "../../models/model" );
const Place = require( "../../models/place" );
const Taxon = require( "../../models/taxon" );
const InaturalistAPI = require( "../../inaturalist_api" );

const TaxaController = { };

TaxaController.returnFields = [
  "id",
  "name",
  "names.name",
  "names.locale",
  "names.position",
  "names.is_valid",
  "names.place_taxon_names",
  "rank",
  "default_photo",
  "ancestor_ids",
  "ancestry",
  "colors",
  "is_active",
  "observations_count",
  "flag_counts",
  "iconic_taxon_id",
  "parent_id",
  "rank_level",
  "listed_taxa.id",
  "listed_taxa.place_id",
  "listed_taxa.establishment_means",
  "statuses.*",
  "taxon_changes_count",
  "taxon_schemes_count",
  "atlas_id",
  "complete_species_count",
  "complete_rank",
  "extinct",
  "current_synonymous_taxon_ids",
  "wikipedia_url"
];

TaxaController.show = ( req, callback ) => {
  const ids = _.filter( req.params.id.split( "," ), _.identity );
  const filters = [{ terms: { id: ids } }];
  TaxaController.searchQuery( req, { filters, details: true }, callback );
};

TaxaController.exact = ( req, callback ) => {
  const q = req.query.q || req.query.term;
  if ( !q || q.length < 2 ) { return void callback( null, { } ); }
  const filter = [{
    nested: {
      path: "names",
      query: {
        match: {
          "names.exact_ci": {
            query: q
          }
        }
      }
    }
  }];
  const highlight = {
    fields: { "names.exact_ci": { } },
    order: "score"
  };
  if ( util.isJa( q ) ) {
    filter.push( {
      nested: {
        path: "names",
        query: {
          multi_match: {
            query: q,
            fields: ["names.name_ja^10", "names.exact_ci"]
          }
        }
      }
    } );
    highlight.fields["names.name_ja"] = { };
  }
  let should = null;
  const localeOpts = util.localeOpts( req );
  const preferredPlace = req.query.preferredPlace || localeOpts.preferredPlace;
  if ( preferredPlace ) {
    should = should || [];
    const placeIDs = preferredPlace.ancestor_place_ids || [preferredPlace.id];
    should.push( {
      // Within the should, though, we want a higher score if the taxon has a
      // name in the locale AND that name matches the query, hence the must
      nested: {
        path: "names",
        query: {
          bool: {
            must: [
              {
                match: {
                  "names.name_autocomplete": {
                    query: q,
                    operator: "and"
                  }
                }
              },
              {
                terms: {
                  "names.place_taxon_names.place_id": placeIDs
                }
              }
            ]
          }
        }
      }
    } );
  }
  let isActive = true;
  if ( req.query.is_active === "false" ) {
    isActive = false;
  } else if ( req.query.is_active === "any" ) {
    isActive = null;
  }
  if ( isActive !== null ) {
    filter.push( esClient.termFilter( "is_active", isActive ) );
  }
  req.query.page = 1;
  req.query.per_page = 5;
  req.elastic_query = {
    query: {
      function_score: {
        query: {
          bool: {
            should,
            filter
          }
        },
        field_value_factor: {
          field: "observations_count",
          modifier: "log1p",
          factor: 2
        },
        boost_mode: "sum"
      }
    },
    highlight,
    sort: "_score"
  };
  TaxaController.searchQuery( req, {}, callback );
};

TaxaController.autocomplete = ( req, callback ) => {
  const localeOpts = util.localeOpts( req );
  // not sending the actual req, rather making a copy
  TaxaController.exact( {
    query: Object.assign( { }, req.query ),
    inat: Object.assign( {}, req.inat )
  }, ( err, exactResponse ) => {
    if ( err ) { return void callback( err ); }
    const exactResults = (
      exactResponse
      && exactResponse.results
      && exactResponse.results.length > 0 ) ? exactResponse.results : null;
    const q = req.query.q || req.query.term;
    req.query.per_page = Number( req.query.per_page ) || 30;
    if ( req.query.per_page < 1 || req.query.per_page > 30 ) {
      req.query.per_page = 30;
    }
    if ( !q || q.length < 1 ) {
      return void InaturalistAPI.basicResponse( null, req, null, callback );
    }
    let isActive = true;
    if ( req.query.is_active === "false" ) {
      isActive = false;
    } else if ( req.query.is_active === "any" ) {
      isActive = null;
    }
    req.query.page = 1;
    // Make sure we don't show things that don't match all query tokens
    const filter = [
      {
        nested: {
          path: "names",
          query: {
            match: {
              "names.name_autocomplete": {
                query: q,
                operator: "and"
              }
            }
          }
        }
      }
    ];
    if ( isActive !== null ) {
      filter.push( esClient.termFilter( "is_active", isActive ) );
    }
    const highlight = {
      fields: { "names.name_autocomplete": { } },
      order: "score"
    };
    const should = [];
    // multi-token matches, e.g. if you search "foo bar" that should match "foo barness"
    should.push( {
      constant_score: {
        filter: {
          nested: {
            path: "names",
            query: {
              match: {
                "names.name_autocomplete": {
                  query: q,
                  operator: "and"
                }
              }
            }
          }
        },
        boost: 1
      }
    } );
    // Exact prefix matches
    should.push( {
      constant_score: {
        filter: {
          nested: {
            path: "names",
            query: {
              prefix: {
                "names.exact_ci": {
                  value: q
                }
              }
            }
          }
        },
        boost: 1
      }
    } );
    // extra boosting for exact prefixes of scientific names
    should.push( {
      constant_score: {
        filter: {
          nested: {
            path: "names",
            query: {
              bool: {
                must: [
                  {
                    prefix: {
                      "names.exact_ci": {
                        value: q.toLowerCase( )
                      }
                    }
                  },
                  {
                    term: {
                      "names.locale": "sci"
                    }
                  }
                ]
              }
            }
          }
        },
        boost: 2
      }
    } );
    if ( localeOpts.locale ) {
      const localeLang = localeOpts.locale.split( "-" )[0].toLowerCase( );
      // We want locale-specific matches to have a higher score, but we don't
      // want to *only* show locale matches, hence the should
      should.push( {
        // Constant score allows us to boost name and locale matches higher than
        // place-specific matches. Without this we end up with queries like "bi"
        // matching names like "birds-foot trefoil" that have been added to a
        // place higher than names like "birds"
        constant_score: {
          filter: {
            // Within the should, though, we want a higher score if the taxon has a
            // name in the locale AND that name matches the query, hence the must
            nested: {
              path: "names",
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "names.name_autocomplete": {
                          query: q,
                          operator: "and"
                        }
                      }
                    },
                    {
                      term: {
                        "names.locale": localeLang
                      }
                    }
                  ]
                }
              }
            }
          },
          boost: 1
        }
      } );
      // ...and we need to add another boost for locale-specific prefix matches
      should.push( {
        constant_score: {
          filter: {
            nested: {
              path: "names",
              query: {
                bool: {
                  must: [
                    {
                      prefix: {
                        "names.exact_ci": {
                          value: q
                        }
                      }
                    },
                    {
                      term: {
                        "names.locale": localeLang
                      }
                    }
                  ]
                }
              }
            }
          },
          boost: 2
        }
      } );
    }
    if ( localeOpts.preferredPlace ) {
      const placeIDs = localeOpts.preferredPlace.ancestor_place_ids
        || [localeOpts.preferredPlace.id];
      should.push( {
        constant_score: {
          filter: {
            // Within the should, though, we want a higher score if the taxon has a
            // name in the locale AND that name matches the query, hence the must
            nested: {
              path: "names",
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "names.name_autocomplete": {
                          query: q,
                          operator: "and"
                        }
                      }
                    },
                    {
                      terms: {
                        "names.place_taxon_names.place_id": placeIDs
                      }
                    }
                  ]
                }
              }
            }
          },
          boost: 1.5
        }
      } );
    }
    if ( util.isJa( q ) ) {
      filter.push( {
        nested: {
          path: "names",
          query: {
            multi_match: {
              query: q,
              fields: ["names.name_autocomplete_ja^10", "names.name_autocomplete"]
            }
          }
        }
      } );
      highlight.fields["names.name_autocomplete_ja"] = { };
    }
    req.elastic_query = {
      query: {
        function_score: {
          query: {
            bool: {
              should,
              filter
            }
          },
          field_value_factor: {
            field: "observations_count",
            modifier: "log1p",
            factor: 2
          },
          boost_mode: "sum"
        }
      },
      highlight,
      sort: "_score"
    };

    TaxaController.searchQuery( req, { }, ( errr, response ) => {
      if ( errr ) { return void callback( errr ); }
      if ( response && response.results && exactResults ) {
        const exactResultIDs = _.map( exactResults, "id" );
        response.results = _.reject( response.results, r => _.includes( exactResultIDs, r.id ) );
        response.results = exactResults.concat( response.results );
        if ( response.total_results < response.results.length ) {
          response.total_results = response.results.length;
        }
      }
      callback( null, response );
    } );
  } );
};

TaxaController.wanted = ( req, callback ) => {
  // load the taxon
  const taxonQuery = esClient.searchHash( {
    filters: [{ terms: { id: [req.params.id] } }],
    per_page: Number( req.query.per_page || req.query.size ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" }
  } );
  esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: taxonQuery,
    _source: ["id"]
  }, ( err, taxonData ) => {
    if ( err ) { return void callback( err ); }
    const taxon = new Taxon( taxonData.hits.hits[0]._source );
    // get ids of all countable descendants
    const descendantQuery = esClient.searchHash( {
      filters: [
        esClient.termFilter( "ancestor_ids", taxon.id ),
        esClient.termFilter( "rank", "species" ),
        esClient.termFilter( "is_active", true )
      ],
      inverse_filters: [
        esClient.termFilter( "extinct", true )
      ],
      per_page: 1000,
      page: 1
    } );
    esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
      body: descendantQuery,
      _source: ["id"]
    }, ( errr, descendantData ) => {
      if ( errr ) { return void callback( errr ); }
      const descendantTaxonIds = _.map( descendantData.hits.hits, h => h._source.id );
      // get ids of all observed taxa
      const speciesCountsReq = Object.assign( {}, req, {
        query: {
          taxon_id: taxon.id,
          hrank: "species",
          quality_grade: ["research", "needs_id"]
        }
      } );
      // eslint-disable-next-line global-require
      const ObservationsController = require( "./observations_controller" );
      ObservationsController.leafCounts( speciesCountsReq, ( errrr, leafCounts ) => {
        if ( errrr ) { return void callback( errrr ); }
        const observedTaxonIds = _.map( leafCounts, lc => Number( lc.taxon_id ) );
        // subtract observed taxon ids from countable descendant taxon ids
        const wantedTaxonIds = _.difference( descendantTaxonIds, observedTaxonIds );
        // load descendants and paginate
        const filters = [{ terms: { id: wantedTaxonIds } }];
        TaxaController.searchQuery( req, { filters, details: true }, callback );
      } );
    } );
  } );
};

TaxaController.replaceInactiveTaxaCounts = ( counts, options, callback ) => {
  options = Object.assign( { }, options );
  const countsObject = _.fromPairs( _.map( counts, c => [c.taxon_id, c.count] ) );
  const taxonIDs = _.keys( countsObject );
  const searchHash = {
    filters: [{ terms: { id: taxonIDs } }],
    per_page: taxonIDs.length,
    page: 1
  };
  const defaultSource = [
    "id",
    "current_synonymous_taxon_ids",
    "is_active"
  ];
  let newTaxonIDs = [];
  // quick direct ES query returning only the fields needed to replace inactive taxa
  esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: esClient.searchHash( searchHash ),
    _source: defaultSource
  }, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    _.each( data.hits.hits, h => {
      if ( h._source.is_active === false ) {
        if ( _.isEmpty( h._source.current_synonymous_taxon_ids ) ) {
          // remove counts of inactive taxa
          if ( options.removeInactive === true ) {
            delete countsObject[h._source.id];
          }
        } else {
          // keep a list of taxonIDs being added to the counts
          newTaxonIDs = newTaxonIDs.concat( h._source.current_synonymous_taxon_ids );
          _.each( h._source.current_synonymous_taxon_ids, synTaxonID => {
            // the active synonym inherits the count of the inactive taxon
            // if the synonym taxon already has a count, don't replace it
            // unless it's less than the inactive taxon's count
            // countsObject[synTaxonID] = countsObject[synTaxonID] || countsObject[h._source.id];
            if (
              !countsObject[synTaxonID]
              || countsObject[synTaxonID] < countsObject[h._source.id]
            ) {
              countsObject[synTaxonID] = countsObject[h._source.id];
            }
          } );
          // remove the counts of the inactive taxon
          delete countsObject[h._source.id];
        }
      }
    } );
    const updatedCountsArray = _.map( countsObject, ( count, taxonID ) => (
      { taxon_id: Number( taxonID ), count }
    ) );
    callback( null, updatedCountsArray, newTaxonIDs );
  } );
};

TaxaController.search = ( req, callback ) => {
  const searchReq = _.cloneDeep( req );
  searchReq.query.per_page = InaturalistAPI.perPage( req, { default: 30, max: 500 } );
  const params = _.cloneDeep( req.query );
  const filters = [];
  if ( params.is_active !== "false" && params.is_active !== "any" ) {
    params.is_active = "true";
  }
  if ( params.is_active !== "any" ) {
    filters.push( esClient.termFilter( "is_active", params.is_active ) );
  }
  if ( params.id ) {
    filters.push( esClient.termFilter( "id", params.id ) );
  }
  if ( params.taxon_id ) {
    filters.push( esClient.termFilter( "ancestor_ids", params.taxon_id ) );
  }
  if ( params.parent_id === "0" ) {
    filters.push( { bool: { must_not: { exists: { field: "parent_id" } } } } );
  } else if ( params.parent_id ) {
    filters.push( esClient.termFilter( "parent_id", params.parent_id ) );
  }
  if ( params.rank ) {
    filters.push( esClient.termFilter( "rank", params.rank ) );
  }
  if ( params.rank_level ) {
    filters.push( esClient.termFilter( "rank_level", params.rank_level ) );
  }
  if ( params.id_above ) {
    filters.push( { range: { id: { gt: params.id_above } } } );
  }
  if ( params.id_below ) {
    filters.push( { range: { id: { lt: params.id_below } } } );
  }
  if ( params.q ) {
    // add highlighting to detect which taxon name matched the search
    searchReq.query.highlight = {
      fields: { "names.name_autocomplete": { } },
      order: "score"
    };
    if ( util.isJa( params.q ) ) {
      filters.push( {
        nested: {
          path: "names",
          query: {
            multi_match: {
              query: params.q,
              fields: ["names.name_autocomplete_ja^10", "names.name_autocomplete"]
            }
          }
        }
      } );
      searchReq.query.highlight.fields["names.name_autocomplete_ja"] = { };
    } else {
      filters.push( {
        nested: {
          path: "names",
          query: {
            match: {
              "names.name_autocomplete": {
                query: params.q,
                operator: "and"
              }
            }
          }
        }
      } );
    }
  }

  const searchOptions = { filters };
  if ( params.details === "all" ) {
    searchOptions.details = true;
  }
  // default to sort ascending
  let sortOrder = params.order !== "desc" ? "asc" : "desc";
  let sort;
  switch ( params.order_by ) {
    case "id":
      sort = { id: sortOrder };
      break;
    case "created_at":
      sort = { created_at: sortOrder };
      break;
    default:
      // when sorting by observations_count, default to sort descending
      sortOrder = params.order !== "asc" ? "desc" : "asc";
      sort = { observations_count: sortOrder };
      break;
  }
  searchReq.query.sort = sort;
  TaxaController.searchQuery( searchReq, searchOptions, callback );
};

TaxaController.searchQuery = ( req, options, callback ) => {
  options = Object.assign( { }, options );
  const { filters } = options;
  const searchHash = {
    filters,
    per_page: Number( options.per_page || req.query.per_page || req.query.size ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };

  if ( options.ignorePagination ) {
    searchHash.page = 1;
    searchHash.per_page = options.perPageOverride || 500;
  }
  const elasticQuery = req.elastic_query || esClient.searchHash( searchHash );
  const defaultSource = _.clone( TaxaController.returnFields );
  // we don't want all photos for ancestors or children
  if ( options.details || options.photos ) {
    defaultSource.push( "taxon_photos" );
  }
  esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: elasticQuery,
    _source: req._source || defaultSource
  }, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const localeOpts = options.localeOpts || util.localeOpts( req );
    options.localeOpts = localeOpts;
    if ( req.query.only_id && req.query.only_id !== "false" ) {
      return void callback( null, {
        total_results: data.hits.total.value,
        page: Number( searchHash.page ),
        per_page: Number( searchHash.per_page ),
        results: _.map( data.hits.hits, h => ( { id: h._source.id } ) )
      } );
    }
    // cloning options so we can treat the subject taxon differently from its
    // ancestors who will also get options passed to them
    const mainTaxonOptions = _.cloneDeep( options );
    if ( req.query.all_names && req.query.all_names !== "false" ) {
      mainTaxonOptions.names = true;
      delete req.query.all_names;
    }
    if ( req.query.skip_ancestors && req.query.skip_ancestors !== "false" ) {
      options.details = false;
      options.ancestors = false;
    }
    const taxa = _.map( data.hits.hits, h => {
      if ( elasticQuery.highlight && h.highlight ) {
        const highlighted = h.highlight[_.keys( h.highlight )[0]];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      const t = new Taxon( h._source );
      t.prepareForResponse( localeOpts, mainTaxonOptions );
      return t;
    } );
    Model.preloadTaxonPhotoDimensions( taxa, ( ) => {
      Taxon.preloadPhotosInto( taxa, { localeOpts }, err1 => {
        if ( err1 ) { return void callback( err1 ); }
        TaxaController.assignAncestors( req, taxa, options, ( err2, withAncestors ) => {
          if ( err2 ) { return void callback( err2 ); }
          TaxaController.assignChildren( req, withAncestors, options, ( err3, withChildren ) => {
            if ( err3 ) { return void callback( err3 ); }
            TaxaController.assignPlaces( withChildren, ( err4, taxaWithPlaces ) => {
              if ( err4 ) { return void callback( err4 ); }
              Taxon.assignConservationStatuses( taxaWithPlaces, options, ( err5, taxawithCS ) => {
                if ( err5 ) { return void callback( err5 ); }
                Taxon.assignListedTaxa( taxawithCS, options, ( err6, taxawithLT ) => {
                  if ( err6 ) { return void callback( err6 ); }
                  const wikiOpts = Object.assign( { }, options, localeOpts );
                  Taxon.assignWikipediaSummary( taxawithLT, wikiOpts, ( err7, taxaWithWiki ) => {
                    if ( err7 ) { return void callback( err7 ); }
                    callback( null, {
                      total_results: data.hits.total.value,
                      page: Number( searchHash.page ),
                      per_page: Number( searchHash.per_page ),
                      results: taxaWithWiki
                    } );
                  } );
                } );
              } );
            } );
          } );
        } );
      } );
    } );
  } );
};

TaxaController.assignAncestors = ( req, taxa, options, callback ) => {
  if ( !options.details && !options.ancestors ) {
    return void callback( null, taxa );
  }
  _.each( taxa, t => {
    // remove taxon.id from ancestor_ids
    t.ancestor_ids = _.without( t.ancestor_ids, t.id );
  } );
  const ancestorIDs = _.filter( _.uniq( _.flattenDeep( _.map( taxa, "ancestor_ids" ) ) ), _.identity );
  if ( _.size( ancestorIDs ) === 0 ) { return void callback( null, taxa ); }
  const ancestorOpts = {
    filters: [{ terms: { id: ancestorIDs } }],
    per_page: ancestorIDs.length,
    localeOpts: options.localeOpts
  };
  const newReq = Object.assign( { }, req );
  newReq.query = newReq.query || { };
  newReq.query.size = _.size( ancestorIDs );
  TaxaController.searchQuery( newReq, ancestorOpts, ( err, r ) => {
    if ( err ) { return void callback( err ); }
    const ancestorsByID = _.fromPairs( _.map( r.results, a => [a.id, a] ) );
    _.each( taxa, t => {
      t.ancestors = _.filter(
        _.map( t.ancestor_ids, aid => ancestorsByID[aid] ),
        // filter out root of the tree
        ancestor => ancestor && ancestor.name !== "Life"
      );
    } );
    callback( null, taxa );
  } );
};

TaxaController.assignChildren = ( req, taxa, options, callback ) => {
  if ( !options.details ) { return void callback( null, taxa ); }
  const ids = _.filter( _.map( taxa, "id" ), _.identity );
  const childrenOpts = {
    filters: [
      { terms: { parent_id: ids } },
      { term: { is_active: true } }
    ],
    per_page: 10000
  };
  TaxaController.searchQuery( req, childrenOpts, ( err, r ) => {
    if ( err ) { return void callback( err ); }
    const childrenByID = { };
    _.each( r.results, c => {
      childrenByID[c.parent_id] = childrenByID[c.parent_id] || [];
      childrenByID[c.parent_id].push( c );
    } );
    _.each( taxa, t => { t.children = childrenByID[t.id]; } );
    callback( null, taxa );
  } );
};

TaxaController.assignPlaces = ( taxa, callback ) => {
  let places = _.uniq( _.compact( _.flattenDeep( _.map( taxa, t => {
    const placeIDs = [];
    if ( t.establishment_means && t.establishment_means.place_id ) {
      placeIDs.push( t.establishment_means.place_id );
    }
    if ( t.conservation_status && t.conservation_status.place_id ) {
      placeIDs.push( t.conservation_status.place_id );
    }
    return placeIDs;
  } ) ) ) );
  // turning the array into an ID-indexed object
  places = _.keyBy( places );
  Place.assignToObject( places, err => {
    if ( err ) { return void callback( err ); }
    _.each( taxa, t => {
      if ( t.establishment_means && t.establishment_means.place_id ) {
        t.establishment_means.place = places[t.establishment_means.place_id];
        delete t.establishment_means.place_id;
      }
      if ( t.conservation_status && t.conservation_status.place_id ) {
        t.conservation_status.place = places[t.conservation_status.place_id];
        delete t.conservation_status.place_id;
      }
    } );
    callback( null, taxa );
  } );
};

TaxaController.speciesCountsResponse = ( req, leafCounts, opts, callback ) => {
  const options = Object.assign( { }, opts || { } );
  let totalResults = leafCounts.length;
  const maxPerPage = options.perPageOverride || 500;
  const paginationOptions = { default: maxPerPage, max: maxPerPage };
  const {
    page, perPage, size, offset
  } = InaturalistAPI.paginationData( req, paginationOptions );
  if ( offset > totalResults ) {
    return void callback( null, {
      total_results: totalResults,
      page,
      per_page: perPage,
      results: []
    } );
  }
  if ( req.query.include_only_vision_taxa ) {
    // eslint-disable-next-line global-require
    const ComputervisionController = require( "./computervision_controller" );
    leafCounts = _.filter( leafCounts,
      lc => ComputervisionController.modelContainsTaxonID( lc.taxon_id ) );
    totalResults = leafCounts.length;
  }
  leafCounts = _.sortBy( leafCounts, c => (
    ( req.query.order === "asc" ? 1 : -1 ) * c.count
  ) ).slice( offset, offset + perPage );
  const leafCountObject = _.fromPairs( _.map( leafCounts, c => {
    const obj = Object.assign( { }, c );
    delete obj.taxon_id;
    return [c.taxon_id, obj];
  } ) );
  const filters = [{ terms: { id: _.filter( _.keys( leafCountObject ), _.identity ) } }];
  const searchReq = _.extend( { }, req, {
    query: {
      is_active: null,
      size,
      locale: req.query.locale
    }
  } );
  options.filters = filters;
  if ( req.inat && req.inat.taxonPhotos ) { options.photos = true; }
  if ( req.inat && req.inat.taxonAncestries ) { options.ancestors = true; }
  options.ignorePagination = true;
  TaxaController.searchQuery( searchReq, options, ( err, response ) => {
    if ( err ) { return void callback( err ); }
    // insert the resulting taxa into the leafCountObject
    _.each( response.results, tax => {
      leafCountObject[tax.id].taxon = tax;
    } );
    // remove any with missing taxa
    const leafCountArray = _.reject( leafCountObject, lc => ( !lc.taxon ) );
    // sort the results again by count descending
    const results = _.sortBy( leafCountArray,
      o => ( req.query.order === "asc" ? 1 : -1 ) * o.count );
    callback( null, {
      total_results: totalResults,
      page,
      per_page: perPage,
      results
    } );
  } );
};

TaxaController.suggestifyRequest = req => {
  // eslint-disable-next-line global-require
  const ObservationsController = require( "./observations_controller" );
  // eslint-disable-next-line global-require
  const Observation = require( "../../models/observation" );
  return new Promise( ( resolve, reject ) => {
    req.query.verifiable = "true";
    if ( req.query.observation_id ) {
      const obsReq = {
        query: {
          id: [req.query.observation_id]
        }
      };
      ObservationsController.elasticResults( obsReq, ( err, data ) => {
        if ( err ) { return void reject( err ); }
        if ( data.hits.hits.length === 0 ) { return void resolve( req ); }
        const obs = [new Observation( data.hits.hits[0]._source, { session: req.userSession } )];
        Observation.preloadMinimal( obs, { localeOpts: util.localeOpts( req ) }, errr => {
          if ( errr ) { return void reject( errr ); }
          if ( obs[0].taxon ) {
            if ( obs[0].taxon.rank_level <= 10 ) {
              req.query.taxon_id = obs[0].taxon.ancestor_ids[obs[0].taxon.ancestor_ids.length - 2];
            } else {
              req.query.taxon_id = obs[0].taxon.id;
            }
          }
          if ( obs[0].place_ids && obs[0].place_ids.length > 0 ) {
            req.query.place_id = obs[0].place_ids[obs[0].place_ids.length - 1];
          }
          resolve( req );
        } );
      } );
    } else {
      resolve( req );
    }
  } );
};

TaxaController.getChecklistSuggestions = req => {
  const limit = 500;
  return new Promise( ( resolve, reject ) => {
    let listQuery = squel
      .select( )
      .field( "lists.id", "id" )
      .field( "lists.title", "list_title" )
      .field( "sources.url", "source_url" )
      .field( "sources.in_text", "source_in_text" )
      .from( "lists" )
      .left_join( "sources", null, "sources.id = lists.source_id" )
      .where( "type = 'CheckList'" )
      .where( "comprehensive" );
    if ( req.query.place_id ) {
      listQuery = listQuery.where( "lists.place_id = ?", req.query.place_id );
    }
    if ( req.query.taxon_id ) {
      listQuery = listQuery
        .join( "taxon_ancestors", null, "taxon_ancestors.ancestor_taxon_id = lists.taxon_id" )
        .where( "taxon_ancestors.taxon_id = ?", req.query.taxon_id );
    } else {
      // if no taxon was requested, scuttle the comprehensive list query
      listQuery = listQuery.where( "1 = 2" );
    }
    pgClient.connection.query( listQuery.toString( ), ( err, listResult ) => {
      if ( err ) { return void reject( err ); }
      let query = squel
        .select( )
        .fields( [
          "listed_taxa.taxon_id",
          "listed_taxa.list_id",
          "lists.comprehensive",
          "listed_taxa.observations_count",
          "sources.url"
        ] )
        .field( "lists.title", "list_title" )
        .field( "sources.in_text", "source_in_text" )
        .from( "listed_taxa" )
        .join( "lists", null, "lists.id = listed_taxa.list_id" )
        .left_join( "sources", null, "sources.id = lists.source_id" )
        .limit( limit );
      if ( req.query.place_id ) {
        query = query.where( "listed_taxa.place_id = ?", req.query.place_id );
      }
      if ( req.query.taxon_id ) {
        query = query
          .join( "taxon_ancestors", null, "taxon_ancestors.taxon_id = listed_taxa.taxon_id" )
          .where( "taxon_ancestors.ancestor_taxon_id = ?", req.query.taxon_id );
      }
      const comprehensiveness = {};
      if ( listResult.rows.length > 0 ) {
        query = query.where( "listed_taxa.list_id = ?", listResult.rows[0].id );
        comprehensiveness.rating = 1;
        comprehensiveness.source = {
          id: listResult.rows[0].id,
          title: listResult.rows[0].list_title,
          source: {
            url: listResult.rows[0].source_url,
            in_text: listResult.rows[0].in_text
          }
        };
      }
      pgClient.connection.query( query.toString( ), ( errr, listedTaxaResult ) => {
        if ( errr ) { return void reject( errr ); }
        const filters = [{ terms: { id: listedTaxaResult.rows.map( r => r.taxon_id ) } }];
        const searchReq = _.extend( { }, req, {
          query: {
            is_active: null,
            size: limit,
            locale: req.query.locale
          }
        } );
        TaxaController.searchQuery( searchReq, { filters, photos: true }, ( errrr, response ) => {
          if ( errrr ) { return void reject( errrr ); }
          const results = response.results.map( taxon => {
            const listedTaxon = listedTaxaResult.rows.find( r => r.taxon_id === taxon.id );
            return {
              sourceType: "checklist",
              sourceKey: listedTaxon.list_id,
              frequency: listedTaxon.observations_count,
              sourceDetails: {
                listedTaxon: {
                  taxon_id: listedTaxon.taxon_id,
                  list: {
                    id: listedTaxon.list_id,
                    title: listedTaxon.list_title,
                    comprehensive: listedTaxon.comprehensive,
                    source: {
                      in_text: listedTaxon.source_in_text,
                      url: listedTaxon.url
                    }
                  }
                }
              },
              taxon
            };
          } );
          resolve( {
            comprehensiveness,
            results
          } );
        } );
      } );
    } );
  } );
};

TaxaController.getMisidentificationSuggestions = req => {
  // eslint-disable-next-line global-require
  const IdentificationsController = require( "./identifications_controller" );
  return new Promise( ( resolve, reject ) => {
    IdentificationsController.similarSpecies( req, ( err, response ) => {
      if ( err ) { return void reject( err ); }
      resolve( {
        comprehensiveness: {},
        results: response.results.map( r => ( {
          sourceType: "misidentifications",
          frequency: r.count,
          sourceDetails: {
            identifications_count: r.count
          },
          taxon: r.taxon
        } ) )
      } );
    } );
  } );
};

TaxaController.getObservationSuggestions = req => {
  // eslint-disable-next-line global-require
  const ObservationsController = require( "./observations_controller" );
  let sourceType = "observations";
  if ( req.query.source === "rg_observations" ) {
    sourceType = "rg_observations";
    req.query.quality_grade = "research";
  } else {
    req.query.quality_grade = "research,needs_id";
  }
  return new Promise( ( resolve, reject ) => {
    ObservationsController.leafCounts( req, ( err, leafCounts ) => {
      if ( err ) { return void reject( err ); }
      TaxaController.speciesCountsResponse( req, leafCounts, { photos: true }, ( errr, data ) => {
        if ( errr ) { return void reject( errr ); }
        resolve( {
          comprehensiveness: {},
          results: data.results.map( r => ( {
            sourceType,
            frequency: r.count,
            sourceDetails: {
              observations_count: r.count
            },
            taxon: r.taxon
          } ) )
        } );
      } );
    } );
  } );
};

TaxaController.getVisualSuggestions = req => {
  // eslint-disable-next-line global-require
  const ComputervisionController = require( "./computervision_controller" );
  return new Promise( ( resolve, reject ) => {
    ComputervisionController.scoreImageURL( req, { }, ( err, response ) => {
      if ( err ) { return void reject( err ); }
      resolve( {
        comprehensiveness: {},
        results: response.results.map( r => ( {
          sourceType: "visual",
          frequency: r.combined_score,
          sourceDetails: {
            vision_score: r.vision_score,
            frequency_score: r.frequency_score,
            combined_score: r.combined_score
          },
          taxon: r.taxon
        } ) )
      } );
    } );
  } );
};

TaxaController.suggest = ( req, callback ) => {
  const sugReqPromise = TaxaController.suggestifyRequest( req );
  sugReqPromise.then( sugReq => {
    switch ( req.query.source ) {
      case "checklist":
        return TaxaController.getChecklistSuggestions( sugReq );
      case "misidentifications":
        return TaxaController.getMisidentificationSuggestions( sugReq );
      case "visual":
        return TaxaController.getVisualSuggestions( sugReq );
      default:
        return TaxaController.getObservationSuggestions( sugReq );
    }
  } ).then( response => {
    const taxa = response.results.map( r => r.taxon );
    const localeOpts = util.localeOpts( req );
    Taxon.preloadPhotosInto( taxa, { localeOpts }, err => {
      if ( err ) { return void callback( err ); }
      const wikiOpts = Object.assign( {}, localeOpts, { details: true } );
      Taxon.assignWikipediaSummary( taxa, wikiOpts, ( errr, taxaWithWiki ) => {
        if ( errr ) { return void callback( errr ); }
        response.results = response.results.map( r => {
          r.taxon = taxaWithWiki.find( t => t.id === r.taxon.id );
          return r;
        } );
        response.results = _.sortBy( response.results, r => (
          req.query.order_by === "taxonomy"
            ? `${r.taxon.ancestry}/${r.taxon.id}` : ( r.frequency * -1 )
        ) );
        callback( err, Object.assign( response, {
          query: req.query
        } ) );
      } );
    } );
  } ).catch( e => {
    callback( e );
  } );
};

module.exports = {
  assignAncestors: TaxaController.assignAncestors,
  autocomplete: TaxaController.autocomplete,
  replaceInactiveTaxaCounts: TaxaController.replaceInactiveTaxaCounts,
  search: TaxaController.search,
  searchQuery: TaxaController.searchQuery,
  show: TaxaController.show,
  speciesCountsResponse: TaxaController.speciesCountsResponse,
  suggest: TaxaController.suggest,
  wanted: TaxaController.wanted
};
