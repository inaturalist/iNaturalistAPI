const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const DBModel = { };

DBModel.fetchBelongsTo = ( objects, model, callback ) => {
  const resultsHash = { };
  const ids = Model.belongsToIDs( objects, model );
  if ( !ids ) { return void callback( ); }
  let query = squel.select( ).fields( model.returnFields )
    .from( model.tableName ).where( `${model.tableName}.id IN ?`, ids );
  if ( model.leftJoins ) {
    _.each( model.leftJoins, leftJoin => {
      query = query.left_join( ...leftJoin );
    } );
  }
  if ( model.defaultDBClause ) {
    query = query.where( model.defaultDBClause );
  }
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if ( err ) { return void callback( err ); }
    _.each( result.rows, r => {
      resultsHash[r.id] = r;
    } );
    Model.injectBelongsTo( objects, model, resultsHash );
    callback( );
  } );
};

DBModel.fetchBelongsToAsync = async ( objects, model ) => (
  new Promise( ( resolve, reject ) => {
    DBModel.fetchBelongsTo( objects, model, err => {
      if ( err ) { return void reject( err ); }
      resolve( );
    } );
  } )
);

DBModel.fetchHasMany = ( objects, model, foreignKey, options, callback ) => {
  options = options || { };
  const resultsHash = { };
  if ( !_.isArray( objects ) || objects.length === 0 ) {
    return void callback( );
  }
  let ids = _.map( objects, "id" );
  ids = _.filter( _.uniq( ids ), _.identity );
  if ( ids.length === 0 ) { return void callback( ); }
  let query = squel.select( ).fields( model.returnFields )
    .from( model.tableName ).where( `${foreignKey} IN ?`, ids );
  if ( model.leftJoins ) {
    _.each( model.leftJoins, leftJoin => {
      query = query.left_join( ...leftJoin );
    } );
  }
  if ( model.defaultDBClause ) {
    query = query.where( model.defaultDBClause );
  }
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if ( err ) { return void callback( err ); }
    _.each( result.rows, r => {
      if ( !resultsHash[r[foreignKey]] ) {
        resultsHash[r[foreignKey]] = { };
      }
      resultsHash[r[foreignKey]][r.id] = r;
    } );
    Model.injectHasMany( objects, model, resultsHash );
    callback( );
  } );
};

module.exports = DBModel;
