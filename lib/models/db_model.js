"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ),
    pgClient = require( "../pg_client" ),
    Model = require( "./model" ),
    DBModel = { };

DBModel.fetchBelongsTo = function( objects, model, callback ) {
  var resultsHash = { };
  var ids = Model.belongsToIDs( objects, model );
  if( !ids ) { return callback( ); }
  var query = squel.select( ).fields( model.returnFields ).
    from( model.tableName ).where( `${model.tableName}.id IN ?`, ids );
  if ( model.leftJoins ) {
    _.each( model.leftJoins, leftJoin => {
      query = query.left_join( ...leftJoin );
    } );
  }
  if ( model.defaultDBClause ) {
    query = query.where( model.defaultDBClause );
  }
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        resultsHash[ r.id ] = r;
      });
      Model.injectBelongsTo( objects, model, resultsHash );
      callback( );
    }
  );
};

DBModel.fetchHasMany = function( objects, model, foreign_key, options, callback ) {
  options = options || { };
  var resultsHash = { };
  if( !_.isArray( objects ) || objects.length == 0 ) {
    return callback( );
  }
  var ids = _.map( objects, function( o ) { return o.id; } );
  ids = _.filter( _.uniq( ids ), _.identity );
  if( ids.length == 0 ) { return callback( ); }
  var query = squel.select( ).fields( model.returnFields ).
    from( model.tableName ).where( foreign_key + " IN ?", ids );
  if ( model.leftJoins ) {
    _.each( model.leftJoins, leftJoin => {
      query = query.left_join( ...leftJoin );
    } );
  }
  if ( model.defaultDBClause ) {
    query = query.where( model.defaultDBClause );
  }
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      _.each( result.rows, function( r ) {
        if( !resultsHash[ r[ foreign_key ] ] ) {
          resultsHash[ r[ foreign_key ] ] = { };
        }
        resultsHash[ r[ foreign_key ] ][ r.id ] = r;
      });
      Model.injectHasMany( objects, model, resultsHash );
      callback( );
    }
  );
};

module.exports = DBModel;
