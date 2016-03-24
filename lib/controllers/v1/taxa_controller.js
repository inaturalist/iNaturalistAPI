var _ = require( "underscore" ),
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    Place = require( "../../models/place" ),
    Taxon = require( "../../models/taxon" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    TaxaController = { };

TaxaController.returnFields = [
  "id", "name", "names.name", "names.locale",
  "names.place_taxon_names", "rank", "default_photo",
  "colors", "is_active", "observations_count", "iconic_taxon_id",
  "rank_level", "ancestor_name", "ancestor_rank",
  "listed_taxa.place_id", "listed_taxa.establishment_means",
  "statuses.place_id", "statuses.iucn" ];

TaxaController.show = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity );
  var filters = [{ terms: { id: ids } }];
  TaxaController.searchQuery( req, null, filters, callback );
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
  TaxaController.searchQuery( req, search_wheres, search_filters, callback )
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
    TaxaController.searchQuery( req, search_wheres, search_filters, function( err, response ) {
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

TaxaController.searchQuery = function( req, search_wheres, search_filters, callback ) {
  var searchHash = {
    where: search_wheres,
    filters: search_filters,
    size: Number( req.query.size ),
    per_page: Number( req.query.per_page ) || 30,
    page: Number( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };
  req.elastic_query = esClient.searchHash( searchHash );
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
    body: req.elastic_query,
    _source: req._source || [ "id", "name", "names.name", "names.locale",
      "names.place_taxon_names", "rank", "default_photo",
      "colors", "is_active", "observations_count", "iconic_taxon_id",
      "rank_level", "ancestor_name", "ancestor_rank",
      "listed_taxa.place_id", "listed_taxa.establishment_means",
      "statuses.place_id", "statuses.iucn" ]
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    var taxa = _.map( data.hits.hits, function( h ) {
      if( req.query.highlight && h.highlight ) {
        var highlighted = h.highlight[ _.keys( h.highlight )[0] ];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      var t = new Taxon( h._source );
      t.prepareForResponse( util.localeOpts( req ) );
      return t;
    });
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
      callback( null, {
        total_results: data.hits.total,
        page: Number( searchHash.page ),
        per_page: Number( searchHash.per_page ),
        results: taxa
      });
    });
  });
};

module.exports = {
  show: TaxaController.show,
  autocomplete: TaxaController.autocomplete,
  searchQuery: TaxaController.searchQuery
};
