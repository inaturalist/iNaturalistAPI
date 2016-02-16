var _ = require( "underscore" ),
    memoryCache = require( "memory-cache" ),
    esClient = require( "../es_client" ),
    pgClient = require( "../pg_client" ),
    Place = { };

Place = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

Place.findByID = function( id, callback ) {
  if( !parseInt( id ) ) {
    return callback({ messsage: "invalid place_id", status: "422" });
  }
  var cacheKey = "places." + id;
  var place = memoryCache.get( cacheKey );
  if( !_.isNull( place ) ) { return callback( null, place ); }
  esClient.search( "places", { body: {
    query: { term: { id: id } },
    _source: [ "id", "ancestor_place_ids" ] } },
    function( err, results ) {
      if( err ) { return callback( err ); }
      // setting place to false, since null can't be cached
      var place = results.hits.hits[0] ? results.hits.hits[0]._source : false;
      memoryCache.put( cacheKey, place, 3600000 ); // 1 hour
      callback( null, place );
  });
};

Place.assignToObject = function( object, callback ) {
  var ids = _.keys( object );
  if( ids.length == 0 ) { return callback( null, object ); }
  pgClient.connection.query("SELECT id, display_name FROM places WHERE id IN (" + ids.join(",") + ")",
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        object[ r.id ] = r;
      });
      callback( null, object );
    }
  );
};

module.exports = Place;
