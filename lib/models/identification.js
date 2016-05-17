"use strict";
var Model = require( "./model" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    Taxon = require( "./taxon" ),
    User = require( "./user" );

var Identification = class Identification extends Model {

  static preloadInto( arr, localeOpts, callback ) {
    var prepareTaxon = function( t ) {
      t.prepareForResponse( localeOpts );
    }
    DBModel.fetchBelongsTo( arr, Identification, function( ) {
      var identification = arr.map( function( i ) { return i.identification; } );
      ESModel.fetchBelongsTo( identification, Taxon, prepareTaxon, function( err ) {
        if( err ) { return callback( err ); }
        DBModel.fetchBelongsTo( identification, User, callback );
      });
    });
  }

};

Identification.modelName = "identification";
Identification.tableName = "identifications";
Identification.returnFields = [
  "id", "observation_id", "taxon_id", "user_id", "body",
  "created_at", "updated_at", "current" ];

module.exports = Identification;
