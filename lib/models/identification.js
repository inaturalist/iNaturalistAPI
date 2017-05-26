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
    var taxonOpts = {
      modifier: prepareTaxon,
      source: { excludes: [ "photos", "taxon_photos" ] }
    };
    DBModel.fetchBelongsTo( arr, Identification, err => {
      if( err ) { return callback( err ); }
      var identification = arr.map( function( i ) { return i.identification; } );
      ESModel.fetchBelongsTo( identification, Taxon, taxonOpts, function( err ) {
        if( err ) { return callback( err ); }
        ESModel.fetchBelongsTo( identification, User, { }, callback );
      });
    });
  }

};

Identification.modelName = "identification";
Identification.tableName = "identifications";
Identification.returnFields = [
  "identifications.id", "identifications.uuid", "identifications.observation_id",
  "identifications.taxon_id", "identifications.user_id", "identifications.body",
  "identifications.created_at", "identifications.updated_at", "identifications.current",
  "identifications.category",
  "taxon_changes.id taxon_change_id", "taxon_changes.type taxon_change_type"
];
Identification.leftJoins = [
  [ "taxon_changes", null, "identifications.taxon_change_id=taxon_changes.id" ]
];

module.exports = Identification;
