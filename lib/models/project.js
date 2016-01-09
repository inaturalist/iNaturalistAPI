var _ = require( "underscore" ),
    squel = require( "squel" ),
    memoryCache = require( "memory-cache" ),
    pgClient = require( "../pg_client" ),
    Project = { };

Project.findByID = function( id, callback ) {
  var cacheKey = "projects." + id;
  var project = memoryCache.get( cacheKey );
  if( !_.isNull( project ) ) { return callback( null, project ); }
  var query = squel.select( ).
    field( "id ").
    field( "title" ).
    field(" slug" ).
    from( "projects" );
  var asInt = parseInt( id );
  if( asInt ) {
    query = query.where( "id = ? OR slug = '?'", asInt, asInt );
  } else {
    query = query.where( "slug = ?", id );
  }
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      // setting taxon to false, since null can't be cached
      var project = result.rows[0] ? result.rows[0] : false;
      memoryCache.put( cacheKey, project, 3600000 ); // 1 hour
      callback( null, project );
    }
  );
};

module.exports = Project;
