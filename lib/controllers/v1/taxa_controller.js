"use strict";
var _ = require( "underscore" ),
    pgClient = require( "../../pg_client" ),
    squel = require( "squel" ),
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    Model = require( "../../models/model" ),
    Place = require( "../../models/place" ),
    Taxon = require( "../../models/taxon" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    TaxaController = { };

TaxaController.returnFields = [
  "id",
  "name",
  "names.name",
  "names.locale",
  "names.place_taxon_names",
  "rank",
  "default_photo",
  "ancestor_ids",
  "colors",
  "is_active",
  "observations_count",
  "iconic_taxon_id",
  "rank_level",
  "listed_taxa.place_id",
  "listed_taxa.establishment_means",
  "statuses.place_id",
  "statuses.iucn",
  "taxon_changes_count",
  "taxon_schemes_count",
  "complete_species_count",
  "complete_rank",
  "extinct"
];

TaxaController.show = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity );
  var filters = [{ terms: { id: ids } }];
  TaxaController.searchQuery( req, { filters: filters, details: true }, callback );
}

TaxaController.exact = function( req, callback ) {
  var q = req.query.q || req.query.term;
  if( !q || q.length < 2 ) { return callback( null, { }); }
  var filters = [ { match: { "names.exact_ci": { query: q } } } ];
  req.query.highlight = { fields: { "names.exact_ci": { } } };
  if( util.is_ja( q ) ) {
    filters.push({ multi_match: {
      query: q,
      fields: [ "names.name_ja^10", "names.exact_ci" ] } });
    req.query.highlight.fields[ "names.name_ja" ] = { };
  }
  var is_active = true;
  if( req.query.is_active === "false" ) {
    is_active = false;
  } else if( req.query.is_active === "any" ) {
    is_active = null;
  }
  if( is_active !== null ) {
    filters.push( esClient.termFilter( "is_active", is_active ) );
  }
  req.query.page = 1;
  req.query.per_page = 5;
  req.query.sort = { observations_count: "desc" };
  TaxaController.searchQuery( req, { filters: filters }, callback )
};

TaxaController.autocomplete = function( req, callback ) {
  // not sending the actual req, rather making a copy
  TaxaController.exact( { query: Object.assign( { }, req.query ) }, function( err, exactResponse ) {
    if( err ) { return callback( err ); }
    var exactResults = ( exactResponse && exactResponse.results && exactResponse.results.length > 0 ) ?
      exactResponse.results : null;
    var q = req.query.q || req.query.term;
    req.query.per_page = Number( req.query.per_page ) || 30;
    if( req.query.per_page < 1 || req.query.per_page > 30 ) {
      req.query.per_page = 30;
    }
    if( !q || q.length < 1 ) {
      return InaturalistAPI.basicResponse( null, req, null, callback );
    }
    var is_active = true;
    if( req.query.is_active === "false" ) {
      is_active = false;
    } else if( req.query.is_active === "any" ) {
      is_active = null;
    }
    var filters = [ { match: { "names.name_autocomplete": {
      query: q, operator: "and" } } } ];
    req.query.highlight = { fields: { "names.name_autocomplete": { } } };
    if( util.is_ja( q ) ) {
      filters.push({ multi_match: {
        query: q,
        fields: [ "names.name_autocomplete_ja^10", "names.name_autocomplete" ] } });
      req.query.highlight.fields[ "names.name_autocomplete_ja" ] = { };
    }
    if( is_active !== null ) {
      filters.push( esClient.termFilter( "is_active", is_active ) );
    }
    req.query.page = 1;
    req.query.sort = { observations_count: "desc" };
    TaxaController.searchQuery( req, { filters: filters },
      function( err, response ) {
      if( err ) { return callback( err ); }
      if( response && response.results && exactResults ) {
        const exactResultIDs = _.map( exactResults, "id" );
        response.results = _.reject( response.results, function( r ) {
          return _.includes( exactResultIDs, r.id );
        });
        response.results = exactResults.concat( response.results );
        if( response.total_results < response.results.length ) {
          response.total_results = response.results.length;
        }
      }
      callback( err, response );
    });
  });
};

TaxaController.wanted = function( req, callback ) {
  // load the taxon
  const taxonQuery = esClient.searchHash( {
    filters: [{ terms: { id: [req.params.id] } }],
    per_page: Number( req.query.per_page || req.query.size ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" }
  } );
  esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
    body: taxonQuery,
    _source: ["id"]
  }, function( err, taxonData ) {
    if( err ) { return callback( err ); }
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
      index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
      body: descendantQuery,
      _source: ["id"]
    }, function( err, descendantData ) {
      if( err ) { return callback( err ); }
      const descendantTaxonIds = _.map( descendantData.hits.hits, h => h._source.id );
      // get ids of all observed taxa
      const speciesCountsReq = Object.assign( {}, req, {
        query: {
          taxon_id: taxon.id,
          hrank: "species",
          quality_grade: ["research", "needs_id"]
        }
      } );
      const ObservationsController = require( "./observations_controller");
      ObservationsController.leafCounts( speciesCountsReq, function( err, leafCounts ) {
        if( err ) { return callback( err ); }
        const observedTaxonIds = _.map( leafCounts, lc => Number( lc.taxon_id ) );
        // subtract observed taxon ids from countable descendant taxon ids
        const wantedTaxonIds = _.difference( descendantTaxonIds, observedTaxonIds );
        // load descendants and paginate
        var filters = [{ terms: { id: wantedTaxonIds } }];
        TaxaController.searchQuery( req, { filters: filters, details: true }, callback );
      } );
    } );
  } );
};

TaxaController.searchQuery = function( req, options, callback ) {
  options = Object.assign( { }, options );
  var fitlers = options.filters;
  var searchHash = {
    filters: fitlers,
    per_page: Number( options.per_page || req.query.per_page || req.query.size ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };

  if ( options.ignorePagination ) {
    searchHash.page = 1;
    searchHash.per_page = 500;
  }
  req.elastic_query = esClient.searchHash( searchHash );
  var defaultSource = [
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
    "iconic_taxon_id",
    "parent_id",
    "rank_level",
    "listed_taxa.place_id",
    "listed_taxa.establishment_means",
    "statuses.*",
    "taxon_changes_count",
    "taxon_schemes_count",
    "atlas_id",
    "complete_species_count",
    "complete_rank",
    "extinct"
  ];
  // we don't want all photos for ancestors or children
  if( options.details || options.photos ) {
    defaultSource.push( "taxon_photos" );
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
    body: req.elastic_query,
    _source: req._source || defaultSource
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    const localeOpts = options.localeOpts || util.localeOpts( req );
    options.localeOpts = localeOpts;
    var taxa = _.map( data.hits.hits, function( h ) {
      if( req.query.highlight && h.highlight ) {
        var highlighted = h.highlight[ _.keys( h.highlight )[0] ];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      var t = new Taxon( h._source );
      t.prepareForResponse( localeOpts, options );
      return t;
    });
    Model.preloadTaxonPhotoDimensions( taxa, ( ) => {
      Taxon.preloadPhotosInto( taxa, { localeOpts }, err => {
        if( err ) { return callback( err ); }
        TaxaController.assignAncestors( req, taxa, options, ( err, taxaWithAncestors ) => {
          if( err ) { return callback( err ); }
          TaxaController.assignChildren( req, taxaWithAncestors, options, ( err, taxaWithChildren ) => {
            if( err ) { return callback( err ); }
            TaxaController.assignPlaces( taxaWithChildren, ( err, taxaWithPlaces ) => {
              if( err ) { return callback( err ); }
              Taxon.assignConservationStatuses( taxaWithPlaces, options, ( err, taxawithCS ) =>  {
                if( err ) { return callback( err ); }
                Taxon.assignListedTaxa( taxawithCS, options, ( err, taxawithLT ) =>  {
                  if( err ) { return callback( err ); }
                  const wikiOpts = Object.assign( { }, options, localeOpts );
                  Taxon.assignWikipediaSummary( taxawithLT, wikiOpts, ( err, taxaWithWiki ) =>  {
                    if( err ) { return callback( err ); }
                    Taxon.assignTaxonCurators( taxaWithWiki, options, ( err, taxaWithTaxonCurators ) => {
                      if( err ) { return callback( err ); }
                      callback( null, {
                        total_results: data.hits.total,
                        page: Number( searchHash.page ),
                        per_page: Number( searchHash.per_page ),
                        results: taxaWithTaxonCurators
                      });
                    } );
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

TaxaController.assignAncestors = function( req, taxa, options, callback ) {
  if( !options.details && !options.ancestors ) { return callback( null, taxa ); }
  _.each( taxa, t => {
    // remove taxon.id from ancestor_ids
    t.ancestor_ids = _.without( t.ancestor_ids, t.id );
  });
  var ancestor_ids = _.filter( _.uniq( _.flatten( _.map( taxa, "ancestor_ids" ) ) ), _.identity );
  if( _.size( ancestor_ids ) === 0 ) { return callback( null, taxa ); }
  var ancestorOpts = {
    filters: [{ terms: { id: ancestor_ids } }],
    per_page: ancestor_ids.length,
    localeOpts: options.localeOpts
  };
  const newReq = Object.assign( { }, req );
  newReq.query = newReq.query || { };
  newReq.query.size = _.size( ancestor_ids );
  TaxaController.searchQuery( newReq, ancestorOpts, function( err, r ) {
    if( err ) { return callback( err ); }
    var ancestorsByID = _.object( _.map( r.results, r => [ r.id, r ] ));
    _.each( taxa, t => {
      t.ancestors = _.filter(
        _.map( t.ancestor_ids, aid => ancestorsByID[ aid ] ),
        // filter out root of the tree
        ancestor => ancestor && ancestor.name !== "Life"
      );
    });
    callback( null, taxa );
  });
};

TaxaController.assignChildren = function( req, taxa, options, callback ) {
  if( !options.details ) { return callback( null, taxa ); }
  var ids = _.filter( _.map( taxa, "id" ), _.identity );
  var childrenOpts = { filters: [
    { terms: { parent_id: ids } },
    { term: { is_active: true } }
  ], per_page: 10000 };
  TaxaController.searchQuery( req, childrenOpts, function( err, r ) {
    if( err ) { return callback( err ); }
    var childrenByID = { };
    _.each( r.results, r => {
      childrenByID[ r.parent_id ] = childrenByID[ r.parent_id ] || [ ];
      childrenByID[ r.parent_id ].push( r );
    });
    _.each( taxa, t => t.children = childrenByID[ t.id ] );
    callback( null, taxa );
  });
};

TaxaController.assignPlaces = function( taxa, callback ) {
  var places = _.uniq( _.compact( _.flatten( _.map( taxa, function( t ) {
    var place_ids = [ ];
    if( t.establishment_means && t.establishment_means.place_id ) {
      place_ids.push( t.establishment_means.place_id );
    }
    if( t.conservation_status && t.conservation_status.place_id ) {
      place_ids.push( t.conservation_status.place_id );
    }
    return place_ids;
  }))));
  // turning the array into an ID-indexed object
  places = _.object(places, _.map( places, function( ){ return { } } ));
  Place.assignToObject( places, function( err ) {
    if( err ) { return callback( err ); }
    _.each( taxa, function( t ) {
      if( t.establishment_means && t.establishment_means.place_id ) {
        t.establishment_means.place = places[ t.establishment_means.place_id ];
        delete t.establishment_means.place_id;
      }
      if( t.conservation_status && t.conservation_status.place_id ) {
        t.conservation_status.place = places[ t.conservation_status.place_id ];
        delete t.conservation_status.place_id;
      }
    });
    callback( null, taxa );
  });
};

TaxaController.speciesCountsResponse = function( req, leafCounts, opts, callback ) {
  const options = Object.assign( { }, opts || { } );
  var totalResults = leafCounts.length;
  const paginationOptions = { default: 500, max: 500 };
  const { page, perPage, size, offset } = InaturalistAPI.paginationData( req, paginationOptions );
  if ( offset >= 500 ) {
    return callback( null, {
      total_results: totalResults,
      page: page,
      per_page: perPage,
      results: []
    });
  }
  leafCounts = _.sortBy( leafCounts, c => (
    ( req.query.order === "asc" ? 1 : -1 ) * c.count
  ) ).slice( offset, offset + perPage );
  var leafCountObject = _.object( _.map( leafCounts, function( c ) {
    let obj = Object.assign( { }, c );
    delete obj.taxon_id;
    return [ c.taxon_id, obj ];
  }));
  var filters = [ { terms: { id: _.filter( _.keys( leafCountObject ), _.identity ) } } ];
  var searchReq = _.extend( { }, req, { query: { is_active : null, size: size,
    locale: req.query.locale } });
  options.filters = filters;
  if( req.inat && req.inat.similarToImage ) {
    options.photos = true;
    options.ancestors = true;
  }
  options.ignorePagination = true;
  TaxaController.searchQuery( searchReq, options, function( err, response ) {
    if( err ) { return callback( err ); }
    // insert the resulting taxa into the leafCountObject
    _.each( response.results, function( tax ) {
      leafCountObject[ tax.id ].taxon = tax;
    });
    // remove any with missing taxa
    var leafCountArray = _.reject( leafCountObject, lc => ( !lc.taxon ) );
    // sort the results again by count descending
    const results = _.sortBy( leafCountArray, function( o ) {
      return ( req.query.order === "asc" ? 1 : -1 ) * o.count;
    } );
    callback( null, {
      total_results: totalResults,
      page: page,
      per_page: perPage,
      results: results
    });
  });
}

TaxaController.suggestifyRequest = req => {
  const ObservationsController = require( "./observations_controller");
  const Observation = require( "../../models/observation");
  return new Promise( ( resolve, reject ) => {
    req.query.verifiable = "true";
    if ( req.query.observation_id ) {
      const obsReq = {
        query: {
          id: [req.query.observation_id]
        }
      }
      ObservationsController.elasticResults( obsReq, function( err, data ) {
        if( err ) { return reject( err ); }
        if ( data.hits.hits.length === 0 ) { return resolve( req ); }
        var obs = [new Observation( data.hits.hits[0]._source, { session: req.userSession } )];
        Observation.preloadMinimal( obs, { localeOpts: util.localeOpts( req ) }, err => {
          if( err ) { return reject( err ); }
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
  } )
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
      listQuery = listQuery.
        join( "taxon_ancestors", null, "taxon_ancestors.ancestor_taxon_id = lists.taxon_id" ).
        where( "taxon_ancestors.taxon_id = ?", req.query.taxon_id );
    } else {
      // if no taxon was requested, scuttle the comprehensive list query
      listQuery = listQuery.where( "1 = 2" );
    }
    pgClient.connection.query( listQuery.toString( ), function( err, listResult ) {
      if( err ) { return reject( err ); }
      let query = squel
        .select( )
          .fields( [
            "listed_taxa.taxon_id",
            "listed_taxa.list_id",
            "lists.comprehensive",
            "listed_taxa.observations_count",
            "sources.url"
          ] )
          .field( "lists.title", "list_title")
          .field( "sources.in_text", "source_in_text")
        .from( "listed_taxa" )
        .join( "lists", null, "lists.id = listed_taxa.list_id" )
        .left_join( "sources", null, "sources.id = lists.source_id" )
        .limit( limit );
      if ( req.query.place_id ) {
        query = query.where( "listed_taxa.place_id = ?", req.query.place_id );
      }
      if ( req.query.taxon_id ) {
        query = query.
          join( "taxon_ancestors", null, "taxon_ancestors.taxon_id = listed_taxa.taxon_id" ).
          where( "taxon_ancestors.ancestor_taxon_id = ?", req.query.taxon_id );
      }
      let comprehensiveness = {};
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
      pgClient.connection.query( query.toString( ),
        function( err, listedTaxaResult ) {
          if( err ) { return reject( err ); }
          var filters = [ { terms: { id: listedTaxaResult.rows.map( r => r.taxon_id ) } } ];
          var searchReq = _.extend( { }, req, { query: { is_active : null, size: limit, locale: req.query.locale } });
          TaxaController.searchQuery( searchReq, { filters: filters, photos: true }, function( err, response ) {
            if( err ) { return reject( err ); }
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
              } }
            );
            resolve( {
              comprehensiveness,
              results
            } );
          } );
        }
      );
    } );
  } );
}

TaxaController.getMisidentificationSuggestions = req => {
  const IdentificationsController = require( "./identifications_controller" );
  return new Promise( ( resolve, reject ) => {
    IdentificationsController.similarSpecies( req, ( err, response ) => {
      if ( err ) { return reject( err ); }
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
}

TaxaController.getObservationSuggestions = ( req ) => {
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
      if ( err ) { return reject( err ); }
      TaxaController.speciesCountsResponse( req, leafCounts, { photos: true }, ( err, data ) => {
        if ( err ) { return reject( err ); }
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
  const ComputervisionController = require( "./computervision_controller" );
  return new Promise( ( resolve, reject ) => {
    ComputervisionController.scoreImageURL( req, { }, ( err, response ) => {  
      if ( err ) { return reject( err ); }
      resolve( {
        comprehensiveness: {},
        results: response.results.map( r => ( {
          sourceType: "visual",
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
}

TaxaController.suggest = function( req, callback ) {
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
      if( err ) { return callback( err ); }
      const wikiOpts = Object.assign( {}, localeOpts, { details: true } );
      Taxon.assignWikipediaSummary( taxa, wikiOpts, ( err, taxaWithWiki ) =>  {
        if( err ) { return callback( err ); }
        response.results = response.results.map( r => {
          r.taxon = taxaWithWiki.find( t => t.id === r.taxon.id );
          return r;
        } );
        response.results = _.sortBy( response.results, r => (
          req.query.order_by === "taxonomy" ? `${r.taxon.ancestry}/${r.taxon.id}` : (r.frequency * -1)
        ) );
        callback( err, Object.assign( response, {
          query: req.query
        } ) );
      });
    } );
  } ).catch( e => {
    callback( e );
  } );
}

module.exports = {
  show: TaxaController.show,
  assignAncestors: TaxaController.assignAncestors,
  autocomplete: TaxaController.autocomplete,
  searchQuery: TaxaController.searchQuery,
  speciesCountsResponse: TaxaController.speciesCountsResponse,
  suggest: TaxaController.suggest,
  wanted: TaxaController.wanted
};
