const _ = require( "lodash" );
const config = require( "../config" );
const PgConnection = require( "./models/pg_connection" );

const primaryConnection = new PgConnection( );
let replicaConnections = [];
if ( config.database.replicas ) {
  _.each( config.database.replicas, replica => {
    const replicaConnection = new PgConnection( );
    replicaConnection.connect( {
      ...replica,
      connectionLabel: replica.label || "replica"
    } );
    _.times( replica.weight || 1, ( ) => {
      replicaConnections.push( replicaConnection );
    } );
  } );
} else if ( config.database.replica ) {
  const replicaConnection = new PgConnection( );
  replicaConnection.connect( {
    ...config.database.replica,
    connectionLabel: config.database.replica.label || "replica"
  } );
  replicaConnections.push( replicaConnection );
} else {
  replicaConnections = [primaryConnection];
}

primaryConnection.replicas = replicaConnections;

module.exports = primaryConnection;
