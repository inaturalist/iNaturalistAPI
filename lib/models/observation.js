"use strict";
var _ = require( "underscore" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    Fave = require( "./fave" ),
    Identification = require( "./identification" ),
    QualityMetric = require( "./quality_metric" ),
    Taxon = require( "./taxon" ),
    User = require( "./user" ),
    Model = require( "./model" );

var Observation = class Observation extends Model {

  constructor( attrs ) {
    super( attrs );
    this.obscured = !!(this.geoprivacy === "obscured" || this.private_location);
    delete this.private_location;
    delete this.private_geojson;
  }

  static preloadInto( arr, localeOpts, callback ) {
    ESModel.fetchBelongsTo( arr, Observation, null, function( ) {
      var observations = arr.map( function( i ) { return i.observation; } );
      Observation.preloadAllAssociations( observations, localeOpts, callback );
    });
  }

  static preloadUsers( obs, callback ) {
    DBModel.fetchBelongsTo( obs, User, callback );
  }

  static preloadIdentifications( obs, callback ) {
    DBModel.fetchHasMany( obs, Identification, "observation_id", callback );
  }

  static preloadFaves( obs, callback ) {
    DBModel.fetchHasMany( obs, Fave, "votable_id", callback );
  }

  static preloadQualityMetrics( obs, callback ) {
    DBModel.fetchHasMany( obs, QualityMetric, "observation_id", callback );
  }

  static preloadAllAssociations( obs, localeOpts, callback ) {
    Observation.preloadIdentifications( obs, function( err ) {
      if( err ) { return callback( err ); }
      Observation.preloadFaves( obs, function( err ) {
        if( err ) { return callback( err ); }
        Observation.preloadQualityMetrics( obs, function( err ) {
          if( err ) { return callback( err ); }
          Observation.preloadTaxaAndUsers( obs, localeOpts, callback );
        });
      });
    });
  }

  static preloadTaxaAndUsers( obs, localeOpts, callback ) {
    var prepareTaxon = function( t ) {
      t.prepareForResponse( localeOpts );
    }
    var withTaxa = _.filter(
      _.flatten( [ obs, _.pluck( obs, "identifications" ) ] ), _.identity
    );
    var withUsers = _.filter(
      _.flatten( [ withTaxa,
        _.pluck( obs, "comments" ),
        _.pluck( obs, "faves" ),
        _.pluck( obs, "quality_metrics" ) ] ), _.identity
    );
    ESModel.fetchBelongsTo( withTaxa, Taxon, prepareTaxon, function( err ) {
      if( err ) { return callback( err ); }
      DBModel.fetchBelongsTo( withUsers, User, callback );
    });
  }

};

Observation.modelName = "observation";
Observation.indexName = "observations";
Observation.tableName = "observations";

module.exports = Observation;
