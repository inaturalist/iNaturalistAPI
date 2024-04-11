const config = require( "../config" );
const PgPoolConnection = require( "./models/pg_pool_connection" );

const primaryConnection = new PgPoolConnection( );
let replicaConnection;
if ( config.database.replica ) {
  replicaConnection = new PgPoolConnection( {
    ...config.database.replica,
    connectionLabel: "replica"
  } );
} else {
  replicaConnection = primaryConnection;
}

primaryConnection.replica = replicaConnection;

module.exports = primaryConnection;
