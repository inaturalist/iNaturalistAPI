var _ = require( "underscore" ),
    squel = require( "squel" ),
    memoryCache = require( "memory-cache" ),
    pgClient = require( "../pg_client" ),
    User = { };

User.findByLogin = function( login, callback ) {
  if( _.isEmpty( login ) ) { return callback( ); }
  var asInt = parseInt( login );
  var cacheKey = "users." + login;
  var user = memoryCache.get( cacheKey );
  if( !_.isNull( user ) ) { return callback( null, user ); }
  var query = squel.select( ).field( "id, login ").from( "users" ).
    where( "login = ?", login );
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      // setting user to false, since null can't be cached
      var user = result.rows[0] ? result.rows[0] : false;
      memoryCache.put( cacheKey, user, 3600000 ); // 1 hour
      callback( null, user );
    }
  );
};

User.assignToObject = function( object, callback ) {
  var ids = _.keys( object );
  if( ids.length == 0 ) { return callback( null, object ); }
  pgClient.connection.query("SELECT id, login, name, icon_content_type, icon_file_name FROM users WHERE id IN (" + ids.join(",") + ")",
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        r.icon_url = User.iconUrl( r );
        object[ r.id ].user = r;
      });
      callback( null, object );
    }
  );
};

User.iconUrl = function( user ) {
  if( !user.icon_content_type ) { return; }
  var extension;
  if( user.icon_content_type && user.icon_content_type.match( /jpeg$/ ) ) { extension = "jpg"; }
  else if( user.icon_content_type && user.icon_content_type.match( /png$/ ) ) { extension = "png"; }
  else if( user.icon_content_type && user.icon_content_type.match( /gif$/ ) ) { extension = "gif"; }
  else if( user.icon_content_type && user.icon_content_type.match( /bmp$/ ) ) { extension = "bmp"; }
  else if( user.icon_content_type && user.icon_content_type.match( /tiff$/ ) ) { extension = "tiff"; }
  else return;
  // catch a few file_names that paperclip knows are JPEGs
  if( extension == "jpg" && user.icon_file_name &&
      user.icon_file_name.match( /(stringio\.txt|open-uri|\.jpeg|^data$)/ ) ) {
    extension = "jpeg";
  }
  var prefix = global.config.userImagePrefix ||
    "http://www.inaturalist.org/attachments/users/icons/";
  return prefix + user.id + "-medium." + extension;
};

module.exports = User;
