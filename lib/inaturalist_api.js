var _ = require( "underscore" ),
    elasticsearch = require( "elasticsearch" ),
    InaturalistAPI = { esClient: null };

InaturalistAPI.createClient = function( ) {
  if( InaturalistAPI.esClient === null ) {
    InaturalistAPI.esClient = new elasticsearch.Client({
      host: global.config.elasticsearch.host,
      log: 'debug'
    });
  }
};

var cachedTaxa = { };
InaturalistAPI.lookupTaxon = function( taxonID, callback ) {
  if( !_.isUndefined( cachedTaxa[ taxonID ] ) ) {
    return callback( null, cachedTaxa[ taxonID ] );
  }
  InaturalistAPI.createClient( );
  InaturalistAPI.esClient.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_taxa",
    body: { query: { term: { id: taxonID } } }
  }, function( err, results ) {
    if( err ) { callback( err ); }
    else if( _.isUndefined( results.hits.hits[0] ) ) {
      cachedTaxa[ taxonID ] = null;
      callback( null, null );
    } else {
      cachedTaxa[ taxonID ] = results.hits.hits[0]._source;
      callback( null, cachedTaxa[ taxonID ] );
    }
  });
};

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
      elastic_query.query.filtered.filter.push(
        { range: {
          observed_on: {
            gte: date1, lte: date2 } } }
      );
    }
  }
};

InaturalistAPI.filterUser = function( elastic_query, params ) {
  if( params.user_id ) {
    elastic_query.query.filtered.filter.push(
      { term: { "user.id": params.user_id } }
    );
  }
};

InaturalistAPI.filterProject = function( elastic_query, params ) {
  if( params.project_id ) {
    elastic_query.query.filtered.filter.push(
      { term: { "project_ids": params.project_id } }
    );
  }
};

InaturalistAPI.filterPlace = function( elastic_query, params ) {
  if( params.place_id ) {
    elastic_query.query.filtered.filter.push(
      { term: { "place_ids": params.place_id } }
    );
  }
};

InaturalistAPI.filterTaxon = function( elastic_query, params ) {
  if( params.taxon_id ) {
    elastic_query.query.filtered.filter.push(
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
      filter: [ ]
    }
  };
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
