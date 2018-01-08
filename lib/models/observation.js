"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ),
    URL = require( "url" ),
    util = require( "../util" ),
    ControlledTerm = require( "./controlled_term" ),
    ObservationField = require( "./observation_field" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    pgClient = require( "../pg_client" ),
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
    options = options || { };
    this.obscured = !!( this.geoprivacy === "obscured" || this.private_location );
    this.votes = this.votes || [];
    // faves are the votes w/o scopes
    this.faves = _.filter( this.votes, v => v.vote_scope === null );
    this.preferences = util.preferencesToHash( this.preferences );
    this.makeBackwardsCompatible( );
    this.prepareProjects( );
    this.prepareObservationPhotos( );
    this.setProjectObservationPreferences( );
    this.removeUnviewableGeo( options );
    this.removeUnviewableComments( options );
  }

  makeBackwardsCompatible( ) {
    // setting name as `prefers_community_taxon` for v1.0 compatibility
    if ( "community_taxon" in this.preferences ) {
      this.preferences.prefers_community_taxon = this.preferences.community_taxon;
      delete this.preferences.community_taxon;
    }
    // setting non_owner_ids, which needs to be in v1.0 obs responses
    if ( _.isEmpty( this.non_owner_ids ) && this.identifications ) {
      this.non_owner_ids = _.filter( this.identifications, i => i.user.id !== this.user.id );
    }
  }

  prepareProjects( ) {
    if( this.project_observations ) {
      _.each( this.project_observations, po => {
        po.project = { id: po.project_id };
        delete po.project_id;
      });
    }
  }

  prepareObservationPhotos( ) {
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
  }

  setProjectObservationPreferences( ) {
    if ( this.project_observations ) {
      _.each( this.project_observations, po => {
        po.preferences = util.preferencesToHash( po.preferences );
        // setting `allows_curator_coordinate_access` for v1.0 compatibility
        if ( "curator_coordinate_access" in po.preferences ) {
          po.preferences.allows_curator_coordinate_access =
            po.preferences.curator_coordinate_access;
          delete po.preferences.curator_coordinate_access;
        }
      });
    }
  }

  removeUnviewableGeo( options = { } ) {
    let viewerCanSeePrivateCoordinates = false;
    if ( options.userSession && this.user ) {
      // viewing user is the observer, or project curator and has access
      const viewerIsObserver = this.user.id === options.userSession.user_id;
      let viewerHasCuratorCoordinateAccess;
      if ( options.userSession.curated_project_ids ) {
        viewerHasCuratorCoordinateAccess = _.find( this.project_observations, po => (
          options.userSession.curated_project_ids.indexOf( po.project.id ) >= 0
          &&
          po.preferences
          &&
          po.preferences.allows_curator_coordinate_access
        ) );
      }
      if ( viewerIsObserver || viewerHasCuratorCoordinateAccess ) {
        viewerCanSeePrivateCoordinates = true;
      }
    }
    if ( !viewerCanSeePrivateCoordinates ) {
      delete this.private_location;
      delete this.private_geojson;
      delete this.private_place_guess;
    }
  }

  removeUnviewableComments( options = { } ) {
    // admins see all comments
    if (
      options.userSession &&
      ( options.userSession.isAdmin || options.userSession.isCurator )
    ) {
      return;
    }
    const sessionUserID = options.userSession && options.userSession.user_id;
    this.comments = _.filter( this.comments, c => (
      _.isEmpty( c.flags ) || !_.find( c.flags, f => {
        const flagUserID = f.user ? f.user.id : f.user_id;
        return f.flag === "spam" && !f.resolved &&
        !( sessionUserID && flagUserID === sessionUserID )
      } )
    ) );
  }

  static preloadInto( arr, options, callback ) {
    ESModel.fetchBelongsTo( arr, Observation, options, ( ) => {
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
    if ( !options.userSession || !options.userSession.user_id ) { return callback( null ); }
    const projobs = _.compact( _.flatten( _.map( obs, o => ( o.project_observations ) ) ) );
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

  static preloadObservationApplications( obs, callback ) {
    if ( obs.length === 0 ) { return callback( null ); }
    const applicationIDs = _.uniq( _.compact( _.map( obs, o => ( o.oauth_application_id ) ) ) );
    if ( _.isEmpty( applicationIDs ) ) { return callback( null ); }
    const query = squel.select( ).fields([ "id, name, url" ]).
      from( "oauth_applications" ).
      where( "id IN ?", applicationIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      const obsApplications = { };
      _.each( result.rows, r => {
        r.url = r.url || `https://www.inaturalist.org/oauth/applications/${r.id}`;
        const parsedURL = URL.parse( r.url );
        r.icon = `https://www.google.com/s2/favicons?domain=${parsedURL.host}`;
        obsApplications[ r.id ] = r;
      });
      _.each( obs, o => {
        o.application = obsApplications[ o.oauth_application_id ];
      });
      callback( null );
    });
  }

  static preloadAllAssociations( obs, localeOpts, callback ) {
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
            Observation.preloadObservationUserPreferences( obs, err => {
              if( err ) { return callback( err ); }
              Observation.preloadObservationApplications( obs, err => {
                if( err ) { return callback( err ); }
                Observation.preloadMinimal( obs, localeOpts, err => {
                  if( err ) { return callback( err ); }
                  const wikiOpts = Object.assign( { }, localeOpts, { details: true } );
                  Taxon.assignWikipediaSummary( _.pluck( obs, "taxon" ), wikiOpts, err => {
                    if ( err ) { return callback( err ); }
                    const taxonOpts = {
                      foreignKey: "community_taxon_id",
                      attrName: "community_taxon",
                      modifier: t => t.prepareForResponse( localeOpts )
                    };
                    ESModel.fetchBelongsTo( obs, Taxon, taxonOpts, callback );
                  } );
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
      _.flatten( [ obs, ids, ofvs ] ), wt => ( wt && (
        ( wt.taxon && Number( wt.taxon.id ) ) ||
        ( wt.taxon_id && Number( wt.taxon_id ) ) ) )
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
        _.pluck( obs, "ofvs" ),
        _.pluck( obs, "project_observations" ),
        _.pluck( obs, "quality_metrics" ) ] ), _.identity
    );
    var taxonOpts = {
      modifier: prepareTaxon,
      idFields: {
        taxon_id: "taxon",
        previous_observation_taxon_id: "previous_observation_taxon"
      },
      source: { excludes: [ "photos", "taxon_photos" ] }
    };
    ESModel.fetchBelongsTo( withTaxa, Taxon, taxonOpts, err => {
      if( err ) { return callback( err ); }
      const taxa = _.compact( _.pluck( ids, "taxon" ) );
      TaxaController.assignAncestors( { }, taxa, { localeOpts, ancestors: true }, err => {
        if( err ) { return callback( err ); }
        ESModel.fetchBelongsTo( withUsers, User, { }, callback );
      });
    });
  }

};

Observation.modelName = "observation";
Observation.indexName = "observations";
Observation.tableName = "observations";

module.exports = Observation;
