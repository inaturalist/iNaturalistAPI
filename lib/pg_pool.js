const _ = require( "lodash" );
const config = require( "../config" );
const PgPoolConnection = require( "./models/pg_pool_connection" );

const primaryConnection = new PgPoolConnection( );
let replicaConnections = [];
if ( config.database.replicas ) {
  _.each( config.database.replicas, replica => {
    const replicaConnection = new PgPoolConnection( {
      ...replica,
      connectionLabel: replica.label || "replica"
    } );
    _.times( replica.weight || 1, ( ) => {
      replicaConnections.push( replicaConnection );
    } );
  } );
} else if ( config.database.replica ) {
  const replicaConnection = new PgPoolConnection( {
    ...config.database.replica,
    connectionLabel: config.database.replica.label || "replica"
  } );
  replicaConnections.push( replicaConnection );
} else {
  replicaConnections = [primaryConnection];
}

primaryConnection.replicas = replicaConnections;

module.exports = primaryConnection;
