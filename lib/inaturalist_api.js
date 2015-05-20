var ElasticMapper = require( "elasticmaps" );

var InaturalistAPI = { };

InaturalistAPI.filterDateRange = function( elastic_query, params ) {
  if( params.d1 || params.d2 ) {
    var date1 = Date.parse( params.d1 );
    var date2 = Date.parse( params.d2 );
    if( date1 || date2 ) {
      date1 = date1 ? new Date( date1 ) : new Date( "1800-1-1" );
      date2 = date2 ? new Date( date2 ) : new Date( );
      if( date1 > new Date( ) ) {
        date1 = new Date( );
      }
      if( date2 > new Date( ) ) {
        date2 = new Date( );
      }
      elastic_query["query"]["filtered"]["filter"].push(
        { range: {
          observed_on: {
            gte: date1, lte: date2 } } }
      );
    }
  }
};

InaturalistAPI.filterUser = function( elastic_query, params ) {
  if( params.user_id ) {
    elastic_query["query"]["filtered"]["filter"].push(
      { term: { "user.id": params.user_id } }
    );
  }
};

InaturalistAPI.filterProject = function( elastic_query, params ) {
  if( params.project_id ) {
    elastic_query["query"]["filtered"]["filter"].push(
      { term: { "project_ids": params.project_id } }
    );
  }
};

InaturalistAPI.filterPlace = function( elastic_query, params ) {
  if( params.place_id ) {
    elastic_query["query"]["filtered"]["filter"].push(
      { geo_shape: {
          _cache: true,
          geojson: {
            indexed_shape: {
              id: params.place_id,
              type: "place",
              index: global.config.elasticsearch.placeIndex,
              path: "geometry_geojson" } } },
         }
    );
  }
};

InaturalistAPI.filterTaxon = function( elastic_query, params ) {
  if( params.taxon_id ) {
    elastic_query["query"]["filtered"]["filter"].push(
      { term: { "taxon.ancestor_ids": params.taxon_id } }
    );
  }
};

InaturalistAPI.defaultMapFilters = function( ) {
  return {
    filtered: {
      query: {
        match: { mappable: true }
      },
      filter: [
        { not: { exists: { field: "private_location" } } }
      ]
    }
  }
};

InaturalistAPI.defaultMapFields = function( ) {
  return [ "id", "location", "taxon.iconic_taxon_id", "captive", "quality_grade" ];
};

InaturalistAPI.filterRequest = function( elastic_query, params ) {
  InaturalistAPI.filterDateRange( elastic_query, params );
  InaturalistAPI.filterUser( elastic_query, params );
  InaturalistAPI.filterProject( elastic_query, params );
  InaturalistAPI.filterPlace( elastic_query, params );
  InaturalistAPI.filterTaxon( elastic_query, params );
};

module.exports = InaturalistAPI;
