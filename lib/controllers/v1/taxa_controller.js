var _ = require( "underscore" ),
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    Model = require( "../../models/model" ),
    Place = require( "../../models/place" ),
    Taxon = require( "../../models/taxon" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    TaxaController = { };

TaxaController.returnFields = [
  "id", "name", "names.name", "names.locale",
  "names.place_taxon_names", "rank", "default_photo", "ancestor_ids",
  "colors", "is_active", "observations_count", "iconic_taxon_id",
  "rank_level", "listed_taxa.place_id", "listed_taxa.establishment_means",
  "statuses.place_id", "statuses.iucn", "taxon_changes_count",
  "taxon_schemes_count" ];

TaxaController.show = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity );
  var filters = [{ terms: { id: ids } }];
  TaxaController.searchQuery( req, { filters: filters, details: true }, callback );
}

TaxaController.exact = function( req, callback ) {
  var q = req.query.q || req.query.term;
  if( !q || q.length < 2 ) { return callback( null, { }); }
  var search_wheres = [ { match: { "names.exact": { query: q } } } ];
  req.query.highlight = { fields: { "names.exact": { } } };
  if( util.is_ja( q ) ) {
    search_wheres.push({ multi_match: {
      query: q,
      fields: [ "names.name_ja^10", "names.exact" ] } });
    req.query.highlight.fields[ "names.name_ja" ] = { };
  }
  var is_active = true;
  if( req.query.is_active === "false" ) {
    is_active = false;
  } else if( req.query.is_active === "any" ) {
    is_active = null;
  }
  var search_filters = [ ];
  if( is_active !== null ) {
    search_filters.push( esClient.termFilter( "is_active", is_active ) );
  }
  req.query.page = 1;
  req.query.sort = "_score";
  TaxaController.searchQuery( req,
    { wheres: search_wheres, filters: search_filters }, callback )
};

TaxaController.autocomplete = function( req, callback ) {
  // not sending the actual req, rather making a copy
  TaxaController.exact( { query: req.query }, function( err, exactResponse ) {
    var exactResult = ( exactResponse && exactResponse.results && exactResponse.results.length > 0 ) ?
      exactResponse.results[0] : null;
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
    var search_wheres = [ { match: { "names.name_autocomplete": {
      query: q, operator: "and" } } } ];
    var search_filters = [ ];
    req.query.highlight = { fields: { "names.name_autocomplete": { } } };
    if( util.is_ja( q ) ) {
      search_wheres.push({ multi_match: {
        query: q,
        fields: [ "names.name_autocomplete_ja^10", "names.name_autocomplete" ] } });
      req.query.highlight.fields[ "names.name_autocomplete_ja" ] = { };
    }
    if( is_active !== null ) {
      search_filters.push( esClient.termFilter( "is_active", is_active ) );
    }
    req.query.page = 1;
    req.query.sort = { observations_count: "desc" };
    TaxaController.searchQuery( req, { wheres: search_wheres, filters: search_filters },
      function( err, response ) {
      if( err ) { return callback( err ); }
      if( response && response.results && exactResult ) {
        response.results = _.reject( response.results, function( r ) {
          return r.id == exactResult.id;
        });
        response.results.unshift( exactResult );
        if( response.total_results < response.results.length ) {
          response.total_results = response.results.length;
        }
      }
      callback( err, response );
    });
  });
};

TaxaController.searchQuery = function( req, options, callback ) {
  options = Object.assign( { }, options );
  var search_wheres = options.wheres;
  var search_filters = options.filters;
  var searchHash = {
    where: search_wheres,
    filters: search_filters,
    size: Number( req.query.size ),
    per_page: Number( options.per_page || req.query.per_page ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };
  req.elastic_query = esClient.searchHash( searchHash );
  var defaultSource = [ "id", "name", "names.name", "names.locale",
      "names.position", "names.is_valid",
      "names.place_taxon_names", "rank", "default_photo", "ancestor_ids",
      "colors", "is_active", "observations_count", "iconic_taxon_id", "parent_id",
      "rank_level", "listed_taxa.place_id", "listed_taxa.establishment_means",
      "statuses.*", "taxon_changes_count", "taxon_schemes_count" ];
  // we don't want all photos for ancestors or children
  if( options.details ) {
    defaultSource.push( "taxon_photos" );
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
    body: req.elastic_query,
    _source: req._source || defaultSource
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    var taxa = _.map( data.hits.hits, function( h ) {
      if( req.query.highlight && h.highlight ) {
        var highlighted = h.highlight[ _.keys( h.highlight )[0] ];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      var t = new Taxon( h._source );
      t.prepareForResponse( util.localeOpts( req ), options );
      return t;
    });
    Model.preloadTaxonPhotoDimensions( taxa, ( ) => {
      Taxon.preloadPhotosInto( taxa, {}, ( ) => {
        TaxaController.assignAncestors( req, taxa, options, taxaWithAncestors => {
          TaxaController.assignChildren( req, taxaWithAncestors, options, taxaWithChildren => {
            TaxaController.assignPlaces( taxaWithChildren, taxaWithPlaces => {
              Taxon.assignConservationStatuses( taxaWithPlaces, options, ( err, taxawithCS ) =>  {
                Taxon.assignListedTaxa( taxawithCS, options, ( err, taxawithLT ) =>  {
                  callback( null, {
                    total_results: data.hits.total,
                    page: Number( searchHash.page ),
                    per_page: Number( searchHash.per_page ),
                    results: taxawithLT
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
  if( !options.details ) { return callback( taxa ); }
  _.each( taxa, t => {
    // remove taxon.id from ancestor_ids
    t.ancestor_ids = _.without( t.ancestor_ids, t.id );
  });
  var ancestor_ids = _.uniq( _.flatten( _.map( taxa, "ancestor_ids" )));
  if( _.size( ancestor_ids ) === 0 ) { return callback( taxa ); }
  var ancestorOpts = { filters: [{ terms: { id: ancestor_ids } }], per_page: ancestor_ids.length };
  TaxaController.searchQuery( req, ancestorOpts, function( err, r ) {
    var ancestorsByID = _.object( _.map( r.results, r => [ r.id, r ] ));
    _.each( taxa, t => {
      t.ancestors = _.filter(
        _.map( t.ancestor_ids, aid => ancestorsByID[ aid ] ),
        // filter out root of the tree
        ancestor => ancestor.name !== "Life"
      );
    });
    callback( taxa );
  });
};

TaxaController.assignChildren = function( req, taxa, options, callback ) {
  if( !options.details ) { return callback( taxa ); }
  var ids = _.map( taxa, "id" );
  var childrenOpts = { filters: [
    { terms: { parent_id: ids } },
    { term: { is_active: true } }
  ], per_page: 10000 };
  TaxaController.searchQuery( req, childrenOpts, function( err, r ) {
    var childrenByID = { };
    _.each( r.results, r => {
      childrenByID[ r.parent_id ] = childrenByID[ r.parent_id ] || [ ];
      childrenByID[ r.parent_id ].push( r );
    });
    _.each( taxa, t => t.children = childrenByID[ t.id ] );
    callback( taxa );
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
  Place.assignToObject( places, function( ) {
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
    callback( taxa );
  });
};

TaxaController.speciesCountsResponse = function( req, leafCounts, callback ) {
  var totalResults = leafCounts.length;
  leafCounts = leafCounts.slice( 0, req.query.per_page || 500 );
  var leafCountObject = _.object( _.map( leafCounts, function( c ) {
    return [ c.taxon_id, { count: c.count } ];
  }));
  var filters = [ { terms: { id: _.keys( leafCountObject ) } } ];
  var searchReq = _.extend( { }, req, { query: { is_active : null, size: req.query.per_page || 500,
    locale: req.query.locale } });
  TaxaController.searchQuery( searchReq, { filters: filters }, function( err, response ) {
    if( err ) { return callback( err ); }
    // insert the resulting taxa into the leafCountObject
    _.each( response.results, function( tax ) {
      leafCountObject[ tax.id ].taxon = tax;
    });
    // remove any with missing taxa
    var leafCountArray = _.reject( leafCountObject, function( lc ) {
      if( !lc.taxon ) {
        util.debug( "Taxon missing" )
      }
      return !lc.taxon;
    });
    // sort the results again by count descending
    callback( null, {
      total_results: totalResults,
      page: 1,
      per_page: leafCountArray.length,
      results: _.sortBy( leafCountArray, function( o ) {
        return ( req.query.order === "asc" ? 1 : -1 ) * o.count;
      })
    });
  });
}

module.exports = {
  show: TaxaController.show,
  autocomplete: TaxaController.autocomplete,
  searchQuery: TaxaController.searchQuery,
  speciesCountsResponse: TaxaController.speciesCountsResponse
};
