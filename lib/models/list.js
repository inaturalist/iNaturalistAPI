"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ),
    memoryCache = require( "memory-cache" ),
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
    var cacheKey = "lists." + id;
    var list = memoryCache.get( cacheKey );
    if( !_.isNull( list ) ) { return callback( null, list ); }
    var query = squel.select( ).field( "*" ).from( "lists" ).
      where( "id = ?", id );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        // setting list to false, since null can't be cached
        var list = result.rows[0] ? new List( result.rows[0] ) : false;
        memoryCache.put( cacheKey, list, 300000 ); // 5 minutes
        callback( null, list );
      }
    );
  }

};

module.exports = List;
