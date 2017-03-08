"use strict";
var _ = require( "underscore" ),
    util = require( "../util" ),
    ControlledTerm = require( "./controlled_term" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    Fave = require( "./fave" ),
    Flag = require( "./flag" ),
    Identification = require( "./identification" ),
    Project = require( "./project" ),
    QualityMetric = require( "./quality_metric" ),
    Taxon = require( "./taxon" ),
    User = require( "./user" ),
    Model = require( "./model" ),
    TaxaController = require( "../controllers/v1/taxa_controller" );

var Observation = class Observation extends Model {

  constructor( attrs, options ) {
    super( attrs );
    this.obscured = !!(this.geoprivacy === "obscured" || this.private_location);
    if( this.observation_photos ) {
      var photosByID = _.object( _.map( this.photos, p => [ p.id, p ] ) );
      _.each( this.observation_photos, op => {
        op.photo = photosByID[op.photo_id];
        if( op.photo ) {
          op.photo.url = util.fix_https( op.photo.url );
        }
        delete op.photo_id;
      });
    }
    if( this.project_observations ) {
      _.each( this.project_observations, po => {
        po.project = { id: po.project_id };
        delete po.project_id;
      });
    }
    options = options || { };
    if ( options.session && this.user &&
         this.user.id === options.session.user_id ) {
      // logged in
    } else {
      delete this.private_location;
      delete this.private_geojson;
    }
  }

  static preloadInto( arr, options, callback ) {
    ESModel.fetchBelongsTo( arr, Observation, { }, function( ) {
      var observations = arr.map( function( i ) { return i.observation; } );
      var preloadCallback = options.minimal ?
        Observation.preloadMinimal : Observation.preloadAllAssociations;
      preloadCallback( observations, options, callback );
    });
  }

  static preloadUsers( obs, callback ) {
    ESModel.fetchBelongsTo( obs, User, { }, callback );
  }

  static preloadIdentifications( obs, callback ) {
    DBModel.fetchHasMany( obs, Identification, "observation_id", { }, callback );
  }

  static preloadFaves( obs, callback ) {
    DBModel.fetchHasMany( obs, Fave, "votable_id", { }, callback );
  }

  static preloadFlags( obs, callback ) {
    const comments = _.compact( _.flatten( _.pluck( obs, "comments" ) ) );
    const ids = _.compact( _.flatten( _.pluck( obs, "identifications" ) ) );
    var withFlags = _.filter(
      _.flatten( [ obs, comments, ids ] ), _.identity
    );
    DBModel.fetchHasMany( withFlags, Flag, "flaggable_id", { }, err => {
      if ( err ) { return callback( err ); }
      _.each( obs, o => {
        o.flags = _.filter( o.flags, f => f.flaggable_type == "Observation" );
      } );
      _.each( comments, c => {
        c.flags = _.filter( c.flags, f => f.flaggable_type == "Comment" );
      } );
      _.each( ids, id => {
        id.flags = _.filter( id.flags, f => f.flaggable_type == "Identification" );
      } );
      callback( );
    } );
  }

  static preloadQualityMetrics( obs, callback ) {
    DBModel.fetchHasMany( obs, QualityMetric, "observation_id", { }, callback );
  }

  static preloadAnnotationControlledTerms( obs, callback ) {
    ESModel.fetchBelongsTo(
      _.flatten( _.pluck( obs, "annotations" ) ),
      ControlledTerm,
      { idFields: {
        controlled_value_id: "controlled_value",
        controlled_attribute_id: "controlled_attribute" } },
      callback );
  }

  static preloadAllAssociations( obs, localeOpts, callback ) {
    Observation.preloadIdentifications( obs, function( err ) {
      if( err ) { return callback( err ); }
      Observation.preloadFlags( obs, function( err ) {
        if( err ) { return callback( err ); }
        Observation.preloadFaves( obs, function( err ) {
          if( err ) { return callback( err ); }
          Observation.preloadQualityMetrics( obs, function( err ) {
            if( err ) { return callback( err ); }
            Observation.preloadAnnotationControlledTerms( obs, function( err ) {
              if( err ) { return callback( err ); }
              const projobs = _.flatten( _.map( obs, o => {
               _.each( o.project_observations, po => ( po.project_id = po.project.id ) );
               return o.project_observations;
              } ) );
              ESModel.fetchBelongsTo( projobs, Project, { source: Project.returnFields }, err => {
                if( err ) { return callback( err ); }
                Observation.preloadMinimal( obs, localeOpts, callback );
              });
            });
          });
        });
      });
    });
  }

  static preloadMinimal( obs, localeOpts, callback ) {
    var prepareTaxon = function( t ) {
      t.prepareForResponse( localeOpts );
    }
    const ids = _.flatten( _.pluck( obs, "identifications" ) );
    const comments = _.flatten( _.pluck( obs, "comments" ) );
    const ofvs = _.flatten( _.pluck( obs, "ofvs" ) );
    var withTaxa = _.filter(
      _.flatten( [ obs, ids, ofvs ] ), _.identity
    );
    var annotations = _.flatten( _.pluck( obs, "annotations" ) );
    var annotationVotes = _.flatten( _.pluck( annotations, "votes" ) );
    var withUsers = _.filter(
      _.flatten( [ obs,
        ids,
        annotations,
        annotationVotes,
        comments,
        _.pluck( comments, "flags" ),
        _.pluck( ids, "flags" ),
        _.pluck( obs, "flags" ),
        _.pluck( obs, "faves" ),
        _.pluck( obs, "votes" ),
        _.pluck( obs, "quality_metrics" ) ] ), _.identity
    );
    Model.preloadObjectPhotoDimensions( obs, err => {
      if( err ) { return callback( err ); }
      var taxonOpts = { modifier: prepareTaxon, source: { excludes: [ "photos", "taxon_photos" ] } };
      ESModel.fetchBelongsTo( withTaxa, Taxon, taxonOpts, err => {
        if( err ) { return callback( err ); }
        const taxa = _.compact( _.pluck( ids, "taxon" ) );
        TaxaController.assignAncestors( { }, taxa, { ancestors: true }, taxaWithAncestors => {
          ESModel.fetchBelongsTo( withUsers, User, { }, callback );
        });
      });
    });
  }

};

Observation.modelName = "observation";
Observation.indexName = "observations";
Observation.tableName = "observations";

module.exports = Observation;
