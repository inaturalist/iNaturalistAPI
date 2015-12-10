var _ = require( "underscore" ),
    pgClient = require( "../pg_client" ),
    User = { };

User.assignToObject = function( object, callback ) {
  var ids = _.keys( object );
  if( ids.length == 0 ) { return callback( null, object ); }
  pgClient.connection.query("SELECT id, login, icon_content_type, icon_file_name FROM users WHERE id IN (" + ids.join(",") + ")",
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        r.icon_url = User.iconUrl( r );
        if( object[ r.id ] ) {
          object[ r.id ].user = r;
        }
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
  return "http://www.inaturalist.org/attachments/users/icons/" +
    user.id + "-medium." + extension;
};

module.exports = User;
