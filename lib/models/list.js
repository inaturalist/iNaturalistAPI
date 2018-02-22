"use strict";
var _ = require( "lodash" ),
    squel = require( "squel" ),
    pgClient = require( "../pg_client" ),
    Model = require( "./model" );


var List = class List extends Model {

  taxonIDs( callback ) {
    if( !_.isUndefined( this.taxon_ids ) ) {
      return callback( null, this.taxon_ids );
    }
    this.taxon_ids = [ ];
    var that = this;
    var query = squel.select( ).field( "taxon_id" ).distinct( ).
      from( "listed_taxa" ).where( "list_id = ?", this.id );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        that.taxon_ids = _.map( result.rows, function( r ) {
          return r.taxon_id;
        });
        callback( null, that.taxon_ids );
      }
    );
  }

  static findByID( id, callback ) {
    var query = squel.select( ).field( "*" ).from( "lists" ).
      where( "id = ?", id );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var list = result.rows[0] ? new List( result.rows[0] ) : false;
        callback( null, list );
      }
    );
  }

};

List.modelName = "list";
List.tableName = "lists";
List.returnFields = [ ];

module.exports = List;
