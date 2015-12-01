var _ = require( "underscore" ),
    pgClient = require( "../pg_client" ),
    User = { };

User.assignToObject = function( object, callback ) {
  var ids = _.keys( object );
  if( ids.length == 0 ) { return callback( null, object ); }
  pgClient.connection.query("SELECT id, login, icon_file_size FROM users WHERE id IN (" + ids.join(",") + ")",
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        if( object[ r.id ] ) {
          object[ r.id ].user = r;
        }
      });
      callback( null, object );
    }
  );
}

module.exports = User;
