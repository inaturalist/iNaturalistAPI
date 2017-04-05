"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ),
    util = require( "../util" ),
    ControlledTerm = require( "./controlled_term" ),
    ObservationField = require( "./observation_field" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    pgClient = require( "../pg_client" ),
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
    ESModel.fetchBelongsTo( arr, Observation, { }, ( ) => {
      var observations = arr.map( i => ( i.observation ) );
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

  static preloadObservationFields( obs, callback ) {
    ESModel.fetchBelongsTo(
      _.flatten( _.pluck( obs, "ofvs" ) ),
      ObservationField,
      { foreignKey: "field_id" },
      callback );
  }

  static preloadProjectMembership( obs, options, callback ) {
    options.userSession = { user_id: 42780 };
    if ( !options.userSession || !options.userSession.user_id ) { return callback( null ); }
    const projobs = _.flatten( _.map( obs, o => ( o.project_observations ) ) );
    const projectIDs = _.compact( _.map( projobs, po => ( po.project.id ) ) );
    if ( projectIDs.length === 0 ) { return callback( null ); }
    const query = squel.select( ).fields([ "pu.project_id" ]).
      from( "project_users pu" ).
      where( "pu.project_id IN ?", projectIDs ).
      where( "pu.user_id = ?", options.userSession.user_id );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      const memberProjects = { };
      _.each( result.rows, r => {
        memberProjects[ r.project_id ] = true;
      });
      _.each( projobs, po => {
        po.current_user_is_member = memberProjects[ po.project.id ] || false;
      });
      callback( null );
    });
  }

  static preloadProjectObservationPreferences( obs, options, callback ) {
    options.userSession = { user_id: 42780 };
    if ( !options.userSession || !options.userSession.user_id ) { return callback( null ); }
    const projobs = _.flatten( _.map( obs, o => ( o.project_observations ) ) );
    const projobsIDs = _.compact( _.map( projobs, po => ( po.uuid ) ) );
    if ( projobsIDs.length === 0 ) { return callback( null ); }
    const query = squel.select( ).fields([ "po.uuid, p.name, p.value" ]).
      from( "project_observations po" ).
      left_join( "preferences p",  null,
        "po.id = p.owner_id AND p.owner_type= 'ProjectObservation' AND p.name = 'curator_coordinate_access'" ).
      where( "po.uuid IN ?", projobsIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      const projectObsPrefs = { };
      _.each( result.rows, r => {
        if ( r.value === "t" ) {
          projectObsPrefs[ r.uuid ] = true;
        } else if ( r.value === "f" ) {
          projectObsPrefs[ r.uuid ] = false;
        }
      });
      _.each( projobs, po => {
        po.preferences = { allows_curator_coordinate_access: projectObsPrefs[ po.uuid ] || false };
      });
      callback( null );
    });
  }

  static preloadObservationPreferences( obs, callback ) {
    if ( obs.length === 0 ) { return callback( null ); }
    const obsIDs = _.map( obs, o => ( o.id ) );
    const query = squel.select( ).fields([ "o.id, p.name, p.value" ]).
      from( "observations o" ).
      left_join( "preferences p",  null,
        "o.id = p.owner_id AND p.owner_type= 'Observation' AND p.name = 'community_taxon'" ).
      where( "o.id IN ?", obsIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      const obsPrefs = { };
      _.each( result.rows, r => {
        if ( r.value === "t" ) {
          obsPrefs[ r.id ] = true;
        } else if ( r.value === "f" ) {
          obsPrefs[ r.id ] = false;
        }
      });
      _.each( obs, o => {
        o.preferences = { prefers_community_taxon: obsPrefs[ o.id ] };
      });
      callback( null );
    });
  }

  static preloadObservationUserPreferences( obs, callback ) {
    if ( obs.length === 0 ) { return callback( null ); }
    const userIDs = _.map( obs, o => ( o.user.id ) );
    const query = squel.select( ).fields([ "u.id, p.name, p.value" ]).
      from( "users u" ).
      left_join( "preferences p",  null,
        "u.id = p.owner_id AND p.owner_type= 'User' AND p.name = 'community_taxa'" ).
      where( "u.id IN ?", userIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      const userPrefs = { };
      _.each( result.rows, r => {
        if ( r.value === "t" ) {
          userPrefs[ r.id ] = true;
        } else if ( r.value === "f" ) {
          userPrefs[ r.id ] = false;
        }
      });
      _.each( obs, o => {
        o.user.preferences = { prefers_community_taxa: userPrefs[ o.user.id ] };
      });
      callback( null );
    });
  }

  static preloadAllAssociations( obs, localeOpts, callback ) {
    Observation.preloadIdentifications( obs, function( err ) {
      if( err ) { return callback( err ); }
      Observation.preloadFlags( obs, err => {
        if( err ) { return callback( err ); }
        Observation.preloadFaves( obs, err => {
          if( err ) { return callback( err ); }
          Observation.preloadQualityMetrics( obs, err => {
            if( err ) { return callback( err ); }
            Observation.preloadAnnotationControlledTerms( obs, err => {
              if( err ) { return callback( err ); }
              Observation.preloadObservationFields( obs, err => {
                if( err ) { return callback( err ); }
                const projobs = _.flatten( _.map( obs, o => {
                 _.each( o.project_observations, po => ( po.project_id = po.project.id ) );
                 return o.project_observations;
                } ) );
                ESModel.fetchBelongsTo( projobs, Project, { source: Project.returnFields }, err => {
                  if( err ) { return callback( err ); }
                  Observation.preloadProjectMembership( obs, localeOpts, err => {
                    if( err ) { return callback( err ); }
                    Observation.preloadProjectObservationPreferences( obs, localeOpts, err => {
                      if( err ) { return callback( err ); }
                      Observation.preloadObservationPreferences( obs, err => {
                        if( err ) { return callback( err ); }
                        Observation.preloadObservationUserPreferences( obs, err => {
                          if( err ) { return callback( err ); }
                          Observation.preloadMinimal( obs, localeOpts, callback );
                        });
                      });
                    });
                  });
                });
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
        TaxaController.assignAncestors( { }, taxa, { ancestors: true }, ( ) => {
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
