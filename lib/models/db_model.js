const _ = require( "lodash" );
const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const DBModel = { };

DBModel.fetchBelongsTo = async ( objects, model ) => {
  const resultsHash = { };
  const ids = Model.belongsToIDs( objects, model );
  if ( !ids ) { return; }
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
  const { rows } = await pgClient.connection.query( query.toString( ) );
  _.each( rows, r => {
    resultsHash[r.id] = r;
  } );
  Model.injectBelongsTo( objects, model, resultsHash );
};

DBModel.fetchHasMany = async ( objects, model, foreignKey ) => {
  const resultsHash = { };
  if ( !_.isArray( objects ) || objects.length === 0 ) {
    return;
  }
  let ids = _.map( objects, "id" );
  ids = _.filter( _.uniq( ids ), _.identity );
  if ( ids.length === 0 ) { return; }
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
  const { rows } = await pgClient.connection.query( query.toString( ) );
  _.each( rows, r => {
    if ( !resultsHash[r[foreignKey]] ) {
      resultsHash[r[foreignKey]] = { };
    }
    resultsHash[r[foreignKey]][r.id] = r;
  } );
  Model.injectHasMany( objects, model, resultsHash );
};

DBModel.findByUuids = async ( uuids, model, options = { } ) => {
  if ( _.isEmpty( uuids ) ) { return { }; }
  const query = squel.select( )
    .from( model.tableName )
    .where( `${model.tableName}.uuid IN ?`, uuids );
  if ( options.returnFields || model.returnFields ) {
    query.fields( options.returnFields || model.returnFields );
  }
  const { rows } = await pgClient.connection.query( query.toString( ) );
  const resultsHash = { };
  _.each( rows, r => {
    resultsHash[r.uuid] = r;
  } );
  return resultsHash;
};

module.exports = DBModel;
