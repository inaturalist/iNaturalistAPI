const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../../pg_client" );
const esClient = require( "../../es_client" );
const redisClient = require( "../../redis_client" );
const util = require( "../../util" );
const config = require( "../../../config" );
const Model = require( "../../models/model" );
const ESModel = require( "../../models/es_model" );
const Place = require( "../../models/place" );
const Taxon = require( "../../models/taxon" );
const InaturalistAPI = require( "../../inaturalist_api" );
const CachemanCache = require( "../../cacheman_cache" );

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

TaxaController.show = async req => {
  const ids = _.filter( req.params.id.split( "," ), _.identity );
  const filters = [{ terms: { id: ids } }];
  return TaxaController.searchQuery( req, { filters, details: true } );
};

TaxaController.exact = async req => {
  const params = req.query;
  const q = params.q || params.term;
  if ( !q || q.length < 2 ) { return null; }
  const inverseFilters = [];
  const filters = [{
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
    filters.push( {
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
  if ( params.taxon_id ) {
    filters.push( esClient.termFilter( "ancestor_ids", params.taxon_id ) );
  }
  if ( req.query.not_id ) {
    inverseFilters.push( esClient.termFilter( "id", params.not_id ) );
  }
  if ( params.rank ) {
    filters.push( esClient.termFilter( "rank", params.rank ) );
  }
  if ( params.rank_level ) {
    filters.push( esClient.termFilter( "rank_level", params.rank_level ) );
  }
  if ( req.inat.observedByUser ) {
    const observedTaxonIDs = await ESModel.userObservedTaxonIDsCached(
      req.inat.observedByUser.id
    );
    if ( !_.isEmpty( observedTaxonIDs ) ) {
      filters.push( esClient.termFilter( "id", observedTaxonIDs ) );
    }
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
    filters.push( esClient.termFilter( "is_active", isActive ) );
  }
  req.query.page = 1;
  req.query.per_page = 5;
  req.elastic_query = {
    query: {
      function_score: {
        query: {
          bool: {
            should,
            must_not: inverseFilters,
            filter: filters
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
  return TaxaController.searchQuery( req );
};

TaxaController.autocomplete = async req => {
  const localeOpts = util.localeOpts( req );
  // not sending the actual req, rather making a copy
  const exactResponse = await TaxaController.exact( {
    query: Object.assign( { }, req.query ),
    inat: Object.assign( {}, req.inat )
  } );
  const exactResults = (
    exactResponse
    && exactResponse.results
    && exactResponse.results.length > 0 ) ? exactResponse.results : null;
  InaturalistAPI.setPerPage( req, { default: 30, max: 30 } );
  const params = _.cloneDeep( req.query );
  const q = params.q || params.term;
  if ( !q || q.length < 1 ) {
    return InaturalistAPI.basicResponse( req );
  }
  let isActive = true;
  if ( req.query.is_active === "false" ) {
    isActive = false;
  } else if ( req.query.is_active === "any" ) {
    isActive = null;
  }
  req.query.page = 1;
  // Make sure we don't show things that don't match all query tokens
  const inverseFilters = [];
  const filters = [
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
    filters.push( esClient.termFilter( "is_active", isActive ) );
  }
  if ( params.taxon_id ) {
    filters.push( esClient.termFilter( "ancestor_ids", params.taxon_id ) );
  }
  if ( req.query.not_id ) {
    inverseFilters.push( esClient.termFilter( "id", params.not_id ) );
  }
  if ( params.rank ) {
    filters.push( esClient.termFilter( "rank", params.rank ) );
  }
  if ( params.rank_level ) {
    filters.push( esClient.termFilter( "rank_level", params.rank_level ) );
  }
  if ( req.inat.observedByUser ) {
    const observedTaxonIDs = await ESModel.userObservedTaxonIDsCached(
      req.inat.observedByUser.id
    );
    if ( !_.isEmpty( observedTaxonIDs ) ) {
      filters.push( esClient.termFilter( "id", observedTaxonIDs ) );
    }
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
    filters.push( {
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
            must_not: inverseFilters,
            filter: filters
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

  const response = await TaxaController.searchQuery( req );
  if ( response && response.results && exactResults ) {
    const exactResultIDs = _.map( exactResults, "id" );
    response.results = _.reject( response.results, r => _.includes( exactResultIDs, r.id ) );
    response.results = exactResults.concat( response.results );
    if ( response.total_results < response.results.length ) {
      response.total_results = response.results.length;
    }
  }
  return response;
};

TaxaController.wanted = async req => {
  // load the taxon
  const taxonQuery = esClient.searchHash( {
    filters: [{ terms: { id: [req.params.id] } }],
    per_page: Number( req.query.per_page || req.query.size ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" }
  } );
  const taxonData = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: taxonQuery,
    _source: ["id"]
  } );
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
  const descendantData = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: descendantQuery,
    _source: ["id"]
  } );
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
  const leafCounts = await ObservationsController.leafCounts( speciesCountsReq );
  const observedTaxonIds = _.map( leafCounts, lc => Number( lc.taxon_id ) );
  // subtract observed taxon ids from countable descendant taxon ids
  const wantedTaxonIds = _.difference( descendantTaxonIds, observedTaxonIds );
  // load descendants and paginate
  const filters = [{ terms: { id: wantedTaxonIds } }];
  return TaxaController.searchQuery( req, { filters, details: true } );
};

TaxaController.replaceInactiveTaxaCounts = async ( counts, options = { } ) => {
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
  const data = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: esClient.searchHash( searchHash ),
    _source: defaultSource
  } );
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
  const updatedCounts = _.map( countsObject, ( count, taxonID ) => (
    { taxon_id: Number( taxonID ), count }
  ) );
  return { updatedCounts, newTaxonIDs };
};

TaxaController.search = async req => {
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
  if ( req.inat.observedByUser ) {
    const observedTaxonIDs = await ESModel.userObservedTaxonIDsCached(
      req.inat.observedByUser.id
    );
    if ( !_.isEmpty( observedTaxonIDs ) ) {
      filters.push( esClient.termFilter( "id", observedTaxonIDs ) );
    }
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
  searchOptions.track_total_hits = true;
  return TaxaController.searchQuery( searchReq, searchOptions );
};

TaxaController.searchQuery = async ( req, options = { } ) => {
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
  elasticQuery.track_total_hits = req.query.track_total_hits || options.track_total_hits;
  const defaultSource = _.clone( TaxaController.returnFields );
  // we don't want all photos for ancestors or children
  if ( options.details || options.photos ) {
    defaultSource.push( "taxon_photos" );
    defaultSource.push( "photos_locked" );
  }
  const data = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_taxa`,
    body: elasticQuery,
    _source: req._source || defaultSource
  } );
  const localeOpts = options.localeOpts || util.localeOpts( req );
  options.localeOpts = localeOpts;
  if ( req.query.only_id && req.query.only_id !== "false" ) {
    return {
      total_results: data.hits.total.value,
      page: Number( searchHash.page ),
      per_page: Number( searchHash.per_page ),
      results: _.map( data.hits.hits, h => ( { id: h._source.id } ) )
    };
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
  const wikiOpts = Object.assign( { }, options, localeOpts );
  await Model.preloadTaxonPhotoDimensions( taxa );
  await Taxon.preloadPhotosInto( taxa, { localeOpts } );
  await TaxaController.assignAncestors( req, taxa, options );
  await TaxaController.assignChildren( req, taxa, options );
  await TaxaController.assignPlaces( taxa );
  await Taxon.assignConservationStatuses( taxa, options );
  await Taxon.assignListedTaxa( taxa, options );
  await Taxon.assignWikipediaSummary( taxa, wikiOpts );
  return {
    total_results: data.hits.total.value,
    page: Number( searchHash.page ),
    per_page: Number( searchHash.per_page ),
    results: taxa
  };
};

TaxaController.assignAncestors = async ( req, taxa, options ) => {
  if ( !options.details && !options.ancestors ) { return; }
  _.each( taxa, t => {
    // remove taxon.id from ancestor_ids
    t.ancestor_ids = _.without( t.ancestor_ids, t.id );
  } );
  const ancestorIDs = _.filter( _.uniq( _.flattenDeep( _.map( taxa, "ancestor_ids" ) ) ), _.identity );
  if ( _.size( ancestorIDs ) === 0 ) { return; }
  const ancestorOpts = {
    filters: [{ terms: { id: ancestorIDs } }],
    per_page: ancestorIDs.length,
    localeOpts: options.localeOpts
  };
  const newReq = Object.assign( { }, req );
  newReq.query = newReq.query || { };
  newReq.query.size = _.size( ancestorIDs );
  const r = await TaxaController.searchQuery( newReq, ancestorOpts );
  const ancestorsByID = _.fromPairs( _.map( r.results, a => [a.id, a] ) );
  _.each( taxa, t => {
    t.ancestors = _.filter(
      _.map( t.ancestor_ids, aid => ancestorsByID[aid] ),
      // filter out root of the tree
      ancestor => ancestor && ancestor.name !== "Life"
    );
  } );
};

TaxaController.assignChildren = async ( req, taxa, options ) => {
  if ( !options.details ) { return; }
  const ids = _.filter( _.map( taxa, "id" ), _.identity );
  const childrenOpts = {
    filters: [
      { terms: { parent_id: ids } },
      { term: { is_active: true } }
    ],
    per_page: 10000
  };
  const r = await TaxaController.searchQuery( req, childrenOpts );
  const childrenByID = { };
  _.each( r.results, c => {
    childrenByID[c.parent_id] = childrenByID[c.parent_id] || [];
    childrenByID[c.parent_id].push( c );
  } );
  _.each( taxa, t => { t.children = childrenByID[t.id]; } );
};

TaxaController.assignPlaces = async taxa => {
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
  await Place.assignToObject( places );
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
};

TaxaController.speciesCountsResponse = async ( req, leafCounts, opts = { } ) => {
  const options = Object.assign( { }, opts || { } );
  let totalResults = leafCounts.length;
  const maxPerPage = options.perPageOverride || 500;
  const paginationOptions = { default: maxPerPage, max: maxPerPage };
  const {
    page, perPage, size, offset
  } = InaturalistAPI.paginationData( req, paginationOptions );
  if ( offset > totalResults || perPage === 0 ) {
    return {
      total_results: totalResults,
      page,
      per_page: perPage,
      results: []
    };
  }
  if ( req.query.include_only_vision_taxa ) {
    // eslint-disable-next-line global-require
    const ComputervisionController = require( "./computervision_controller" );
    // make sure CV has done some caching needed for modelContainsTaxonID
    await ComputervisionController.cacheAllTaxonAncestries( );
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
  const response = await TaxaController.searchQuery( searchReq, options );
  // insert the resulting taxa into the leafCountObject
  _.each( response.results, tax => {
    leafCountObject[tax.id].taxon = tax;
  } );
  // remove any with missing taxa
  const leafCountArray = _.reject( leafCountObject, lc => ( !lc.taxon ) );
  // sort the results again by count descending
  const results = _.sortBy( leafCountArray,
    o => ( req.query.order === "asc" ? 1 : -1 ) * o.count );
  return {
    total_results: totalResults,
    page,
    per_page: perPage,
    results
  };
};

TaxaController.suggestifyRequest = async req => {
  // eslint-disable-next-line global-require
  const ObservationsController = require( "./observations_controller" );
  // eslint-disable-next-line global-require
  const Observation = require( "../../models/observation" );
  if ( req.query.observation_id ) {
    const obsReq = {
      query: {
        id: [req.query.observation_id]
      }
    };
    const data = await ObservationsController.elasticResults( obsReq );
    if ( data.hits.hits.length === 0 ) { return; }
    const obs = [new Observation( data.hits.hits[0]._source, { session: req.userSession } )];
    await Observation.preloadMinimal( obs, { localeOpts: util.localeOpts( req ) } );
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
  }
};

TaxaController.getChecklistSuggestions = async req => {
  const limit = 500;
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
  const listResult = await pgClient.connection.query( listQuery.toString( ) );
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
    comprehensiveness.list = {
      id: listResult.rows[0].id,
      title: listResult.rows[0].list_title,
      source: {
        url: listResult.rows[0].source_url,
        in_text: listResult.rows[0].source_in_text
      }
    };
  }
  const listedTaxaResult = await pgClient.connection.query( query.toString( ) );
  const filters = [{ terms: { id: listedTaxaResult.rows.map( r => r.taxon_id ) } }];
  const searchReq = _.extend( { }, req, {
    query: {
      is_active: null,
      size: limit,
      locale: req.query.locale
    }
  } );
  const response = await TaxaController.searchQuery( searchReq, { filters, photos: true } );
  const results = response.results.map( taxon => {
    const listedTaxon = listedTaxaResult.rows.find( r => r.taxon_id === taxon.id );
    return {
      sourceType: "checklist",
      score: listedTaxon.observations_count,
      taxon
    };
  } );
  return {
    comprehensiveness,
    results
  };
};

TaxaController.getMisidentificationSuggestions = async req => {
  // eslint-disable-next-line global-require
  const ObservationsController = require( "./observations_controller" );
  const response = await ObservationsController.similarSpecies( req );
  return {
    comprehensiveness: {},
    results: response.results.map( r => ( {
      sourceType: "misidentifications",
      score: r.count,
      sourceDetails: {
        identifications_count: r.count
      },
      taxon: r.taxon
    } ) )
  };
};

TaxaController.getObservationSuggestions = async req => {
  // eslint-disable-next-line global-require
  const ObservationsController = require( "./observations_controller" );
  let sourceType = "observations";
  if ( req.query.source === "rg_observations" ) {
    sourceType = "rg_observations";
    req.query.quality_grade = "research";
  } else if ( req.query.source === "captive_observations" ) {
    sourceType = "captive_observations";
    req.query.captive = "true";
  } else {
    req.query.quality_grade = "research,needs_id";
  }
  req.query.taxon_is_active = true;
  const leafCounts = await ObservationsController.leafCounts( req );
  const data = await TaxaController.speciesCountsResponse( req, leafCounts, { photos: true } );
  return {
    comprehensiveness: {},
    results: data.results.map( r => ( {
      sourceType,
      score: r.count,
      sourceDetails: {
        observations_count: r.count
      },
      taxon: r.taxon
    } ) )
  };
};

TaxaController.getVisualSuggestions = async req => {
  // eslint-disable-next-line global-require
  const ComputervisionController = require( "./computervision_controller" );
  const response = await ComputervisionController.scoreImageURL( req );
  return {
    comprehensiveness: {},
    results: response.results.map( r => ( {
      sourceType: "visual",
      score: r.combined_score,
      sourceDetails: {
        vision_score: r.vision_score,
        frequency_score: r.frequency_score,
        combined_score: r.combined_score
      },
      taxon: r.taxon
    } ) )
  };
};

TaxaController.suggest = async req => {
  await TaxaController.suggestifyRequest( req );
  const suggestMethod = ( ) => {
    switch ( req.query.source ) {
      case "checklist":
        return TaxaController.getChecklistSuggestions;
      case "misidentifications":
        return TaxaController.getMisidentificationSuggestions;
      case "visual":
        return TaxaController.getVisualSuggestions;
      default:
        return TaxaController.getObservationSuggestions;
    }
  };
  const response = await suggestMethod( )( req );
  response.results = _.filter( response.results, r => r.taxon && r.taxon.is_active !== false );
  const taxa = response.results.map( r => r.taxon );
  const localeOpts = util.localeOpts( req );
  await Taxon.preloadPhotosInto( taxa, { localeOpts } );
  const wikiOpts = Object.assign( { }, localeOpts, { details: true } );
  await Taxon.assignWikipediaSummary( taxa, wikiOpts );
  response.results = response.results.map( r => {
    r.taxon = taxa.find( t => t.id === r.taxon.id );
    return r;
  } );
  response.results = _.sortBy( response.results, r => (
    req.query.order_by === "taxonomy"
      ? `${r.taxon.ancestry}/${r.taxon.id}` : ( r.score * -1 )
  ) );
  return Object.assign( response, {
    query: req.query
  } );
};

let SEEK_EXCEPTED_TAXA = { };
TaxaController.fetchSeekExceptionList = async ( ) => {
  if ( !config.seekExceptionListID ) {
    return null;
  }
  const cacheKey = "SEEK_EXCEPTED_TAXA";
  const value = await CachemanCache.memoryCache.get( cacheKey );
  if ( value ) {
    return value;
  }
  const listQuery = squel
    .select( )
    .field( "listed_taxa.taxon_id" )
    .from( "listed_taxa" )
    .where( "list_id = ?", config.seekExceptionListID );
  const listedTaxaResults = await pgClient.connection.query( listQuery.toString( ) );
  SEEK_EXCEPTED_TAXA = _.fromPairs( _.map( listedTaxaResults.rows, r => [r.taxon_id, true] ) );
  await CachemanCache.memoryCache.set( cacheKey, SEEK_EXCEPTED_TAXA, 3600 );
  return SEEK_EXCEPTED_TAXA;
};

// return the keys to all the cells we'd want to pull data from
// given query parameters `lat`, `lng`, and `observed_on`
TaxaController.nearbyTaxaRedisQuerySet = req => {
  let swlat = Math.floor( req.query.lat - 0.5 );
  let swlng = Math.floor( req.query.lng - 0.5 );
  if ( swlat < -90 ) { swlat = -90; }
  if ( swlng < -180 ) { swlng = -180; }
  if ( swlat > 88 ) { swlat = 88; }
  if ( swlng > 178 ) { swlng = 178; }

  const baseKeys = [];
  // search within a range of cells
  _.each( _.range( swlat, swlat + 3 ), lat => {
    _.each( _.range( swlng, swlng + 3 ), lng => {
      baseKeys.push( `${lat}.${lng}` );
    } );
  } );
  let queryKeys = [];
  if ( req.query.observed_on ) {
    // search a range of months
    const parsedDate = util.parsedDateParam( req.query.observed_on );
    if ( parsedDate && parsedDate.isValid( ) ) {
      // 0 is January
      const dateMonth = parsedDate.month( );
      const monthBefore = ( dateMonth - 1 ) % 12;
      const monthAfter = ( dateMonth + 1 ) % 12;
      _.each( [monthBefore + 1, dateMonth + 1, monthAfter + 1], month => {
        _.each( baseKeys, k => {
          queryKeys.push( `${k}:${month}` );
        } );
      } );
    }
  }
  if ( _.isEmpty( queryKeys ) ) {
    queryKeys = _.clone( baseKeys );
  }
  return queryKeys;
};

TaxaController.includeTaxonInNearbyResults = ( req, taxonID, taxonData, filterTaxonID ) => {
  const selfAndAncestorIDs = taxonData.a
    ? _.fromPairs( _.map( taxonData.a.split( "/" ), a => [Number( a ), true] ) ) : { };
  selfAndAncestorIDs[taxonID] = true;
  // the taxon was requested to be included, or we want all taxa,
  // or we want some taxa and this is one or a descendant
  if ( (
    ( req.inat.includeTaxonIDs && req.inat.includeTaxonIDs.includes( taxonID ) )
    || !filterTaxonID
    || selfAndAncestorIDs[filterTaxonID] )
  ) {
    let excepted = false;
    if ( req.query.seek_exceptions ) {
      _.each( _.keys( selfAndAncestorIDs ), id => {
        if ( SEEK_EXCEPTED_TAXA[Number( id )] ) {
          excepted = true;
        }
      } );
    }
    return !excepted;
  }
  return false;
};

TaxaController.nearby = async req => {
  if ( !req.query.lat || !req.query.lng ) {
    // { error: "Must provide `lat` and `lng`", status: 422 };
    throw new Error( 422 );
  }
  // this is an async function being called synchronously - not waiting for it to finish.
  // The goal is to SEEK_EXCEPTED_TAXA populated and cached in memory
  TaxaController.fetchSeekExceptionList( ).then( ( ) => { } );
  const filterTaxonID = Number( req.query.taxon_id );
  const queryKeys = TaxaController.nearbyTaxaRedisQuerySet( req );
  const promises = _.map( queryKeys, k => redisClient.getCompressed( k, { json: true } ) );

  // query each cell or cell/month separately and combine responses
  const keyResponses = await Promise.all( promises );
  const groupedCounts = { };
  _.each( keyResponses, keyResponse => {
    _.each( keyResponse, ( taxonData, taxonID ) => {
      if ( !TaxaController.includeTaxonInNearbyResults(
        req, Number( taxonID ), taxonData, filterTaxonID
      ) ) {
        return;
      }
      if ( !groupedCounts[taxonID] ) {
        groupedCounts[taxonID] = {
          taxon: { id: Number( taxonID ) },
          count: 0
        };
      }
      groupedCounts[taxonID].count += taxonData.c;
    } );
  } );
  const allCounts = _.values( groupedCounts );
  // this is used by ComputervisionController which doesn't need more than taxon IDs
  if ( req.inat.returnRawCounts ) {
    return { results: allCounts };
  }
  const paginationOptions = { default: 30, max: 50 };
  const {
    page, perPage, offset
  } = InaturalistAPI.paginationData( req, paginationOptions );

  // sort the nearby taxa by frequency and set limits and offsets
  const topCounts = _.reverse( _.sortBy( allCounts, "count" ) )
    .slice( offset, offset + perPage );

  // If we were asked to include certain taxon IDs, let's make sure they don't
  // get sliced off
  if ( req.inat.includeTaxonIDs ) {
    _.each( req.inat.includeTaxonIDs, taxonID => {
      if ( groupedCounts[taxonID] ) {
        topCounts.push( groupedCounts[taxonID] );
      }
    } );
  }
  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonSourceExcludes = ["photos"];
  if ( !req.query.all_photos ) {
    taxonSourceExcludes.push( "taxon_photos" );
  }
  const taxonOpts = {
    modifier: prepareTaxon,
    source: { excludes: taxonSourceExcludes }
  };
  // fetch taxa information for the response
  await ESModel.fetchBelongsTo( topCounts, Taxon, taxonOpts );
  return {
    total_results: allCounts.length,
    page,
    per_page: perPage,
    results: topCounts
  };
};

TaxaController.mapLayers = async req => {
  const taxon = await Taxon.findByID( req.params.id );
  if ( !taxon ) {
    throw new Error( 404 );
  }

  let query = squel.select( ).field( "source_identifier" )
    .from( "taxon_scheme_taxa tst" )
    .join( "taxon_schemes ts", null, "tst.taxon_scheme_id = ts.id" )
    .where( "ts.title = ?", "GBIF" )
    .where( "tst.taxon_id = ?", req.params.id );
  let results = await pgClient.connection.query( query.toString( ) );
  const gbifTaxonID = _.isEmpty( results.rows )
    ? null : Number( results.rows[0].source_identifier );

  query = squel.select( ).field( "1" )
    .from( "listed_taxa lt" )
    .join( "place_geometries pg", null, "pg.place_id = lt.place_id" )
    .where( "lt.taxon_id = ?", req.params.id )
    .limit( 1 );
  results = await pgClient.connection.query( query.toString( ) );
  const hasListedPlaces = !_.isEmpty( results.rows );

  query = squel.select( ).field( "1" )
    .from( "taxon_ranges" )
    .where( "taxon_id = ?", req.params.id )
    .limit( 1 );
  results = await pgClient.connection.query( query.toString( ) );
  const hasRange = !_.isEmpty( results.rows );

  return {
    id: Number( req.params.id ),
    ranges: hasRange,
    gbif_id: gbifTaxonID,
    listed_places: hasListedPlaces
  };
};

TaxaController.lifelistMetadata = async req => {
  if ( !req.inat.observedByUser ) {
    throw new Error( 422 );
  }
  const observedTaxonIDs = await ESModel.userObservedTaxonIDsCached(
    req.inat.observedByUser.id
  );
  if ( _.isEmpty( observedTaxonIDs ) ) {
    throw new Error( 500 );
  }
  if ( _.size( observedTaxonIDs ) === 1 && observedTaxonIDs[0] === -1 ) {
    return { };
  }
  const taxa = _.map( observedTaxonIDs, taxonID => ( { id: taxonID } ) );

  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonOpts = {
    modifier: prepareTaxon,
    foreignKey: "id",
    batchSize: 1000,
    source: {
      includes: [
        "id",
        "default_photo.medium_url",
        "name",
        "names.name",
        "names.locale",
        "names.position",
        "names.is_valid",
        "names.place_taxon_names"
      ]
    }
  };

  await ESModel.fetchBelongsTo( taxa, Taxon, taxonOpts );
  return { total_results: taxa.length, results: _.map( taxa, "taxon" ) };
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
  wanted: TaxaController.wanted,
  nearby: TaxaController.nearby,
  fetchSeekExceptionList: TaxaController.fetchSeekExceptionList,
  mapLayers: TaxaController.mapLayers,
  lifelistMetadata: TaxaController.lifelistMetadata
};
