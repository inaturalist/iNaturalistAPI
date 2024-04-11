const config = require( "../config" );
const PgConnection = require( "./models/pg_connection" );

const primaryConnection = new PgConnection( );
let replicaConnection;
if ( config.database.replica ) {
  replicaConnection = new PgConnection( );
  replicaConnection.connect( { ...config.database.replica, connectionLabel: "replica" } );
} else {
  replicaConnection = primaryConnection;
}

primaryConnection.replica = replicaConnection;

module.exports = primaryConnection;
