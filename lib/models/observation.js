const _ = require( "lodash" );
const util = require( "../util" );
const ControlledTerm = require( "./controlled_term" );
const ObservationField = require( "./observation_field" );
const ESModel = require( "./es_model" );
const Identification = require( "./identification" );
const Project = require( "./project" );
const Taxon = require( "./taxon" );
const User = require( "./user" );
const Model = require( "./model" );
const TaxaController = require( "../controllers/v1/taxa_controller" );
const ObservationPreload = require( "./observation_preload" );

const Observation = class Observation extends Model {
  constructor( attrs, options ) {
    super( attrs );
    options = options || { };
    this.obscured = !!( this.geoprivacy === "obscured" || this.private_location );
    this.votes = this.votes || [];
    // faves are the votes w/o scopes
    this.faves = _.filter( this.votes, v => v.vote_scope === null );
    this.preferences = util.preferencesToHash( this.preferences );
    this.makeBackwardsCompatible( );
    this.setProjectObservationPreferences( );
    this.removeUnviewableGeo( options );
    this.removeUnviewableComments( options );
    delete this.identification_categories;
    delete this.identifier_user_ids;
    delete this.non_owner_identifier_user_ids;
    delete this.photo_licenses;
    delete this.sound_licenses;
    delete this.photos_count;
    delete this.sounds_count;
  }

  makeBackwardsCompatible( ) {
    // setting name as `prefers_community_taxon` for v1.0 compatibility
    if ( "community_taxon" in this.preferences ) {
      this.preferences.prefers_community_taxon = this.preferences.community_taxon;
      delete this.preferences.community_taxon;
    }
    // setting non_owner_ids, which needs to be in v1.0 obs responses
    if ( _.isEmpty( this.non_owner_ids ) ) {
      this.non_owner_ids = _.filter( this.identifications || [], i => i.user.id !== this.user.id );
    }
  }

  setProjectObservationPreferences( ) {
    if ( this.project_observations ) {
      _.each( this.project_observations, po => {
        // setting `allows_curator_coordinate_access` for v1.0 compatibility
        if ( "curator_coordinate_access" in po.preferences ) {
          // eslint-disable-next-line max-len
          po.preferences.allows_curator_coordinate_access = po.preferences.curator_coordinate_access;
          delete po.preferences.curator_coordinate_access;
        }
      } );
    }
  }

  removeUnviewableGeo( options = { } ) {
    let viewerCanSeePrivateCoordinates = false;
    if ( options.userSession && this.user ) {
      // viewing user is the observer, or project curator and has access
      const viewerIsObserver = this.user.id === options.userSession.user_id;
      let viewerHasCuratorCoordinateAccessForTraditional;
      if ( options.userSession.curated_project_ids ) {
        viewerHasCuratorCoordinateAccessForTraditional = _.find( this.project_observations, po => (
          po.project
          && options.userSession.curated_project_ids.indexOf( po.project.id ) >= 0
          && po.preferences
          && po.preferences.allows_curator_coordinate_access
        ) );
      }
      let viewerCuratesCollectionProjectObserverTrusts;
      const nonTradProjects = _.compact( this.non_traditional_projects ) || [];
      if (
        options.userSession.curated_project_ids
        && nonTradProjects.length > 0
      ) {
        const curatedNonTraditionalProjects = _.filter(
          nonTradProjects,
          p => options.userSession.curated_project_ids.indexOf( p.project_id ) >= 0
        );
        viewerCuratesCollectionProjectObserverTrusts = _.find( curatedNonTraditionalProjects, p => (
          p.project_user
          && p.project
          && p.project.prefers_user_trust === true
          && p.project_user.prefers_curator_coordinate_access_for
          && (
            p.project_user.prefers_curator_coordinate_access_for === "any"
            || (
              p.project_user.prefers_curator_coordinate_access_for === "taxon"
              && ["obscured", "private"].includes( this.taxon_geoprivacy )
              && !["obscured", "private"].includes( this.geoprivacy )
            )
          )
        ) );
      }
      let viewerTrustedByObserver;
      if ( options.userSession.trusting_user_ids ) {
        viewerTrustedByObserver = options.userSession.trusting_user_ids
          .indexOf( this.user.id ) >= 0;
        this.viewer_trusted_by_observer = viewerTrustedByObserver;
      }
      if (
        viewerIsObserver
        || viewerHasCuratorCoordinateAccessForTraditional
        || viewerTrustedByObserver
        || viewerCuratesCollectionProjectObserverTrusts
      ) {
        viewerCanSeePrivateCoordinates = true;
      }
    }
    if ( !viewerCanSeePrivateCoordinates ) {
      delete this.private_place_ids;
      delete this.private_location;
      delete this.private_geojson;
      delete this.private_place_guess;
    }
  }

  removeUnviewableComments( options = { } ) {
    // admins see all comments
    if ( options.userSession
      && ( options.userSession.isAdmin || options.userSession.isCurator ) ) {
      return;
    }
    const sessionUserID = options.userSession && options.userSession.user_id;
    this.comments = _.filter( this.comments, c => (
      _.isEmpty( c.flags ) || !_.find( c.flags, f => {
        const flagUserID = f.user ? f.user.id : f.user_id;
        return f.flag === "spam"
          && !f.resolved
          && !( sessionUserID && flagUserID === sessionUserID );
      } )
    ) );
  }

  static async preloadInto( arr, options ) {
    await ESModel.fetchBelongsTo( arr, Observation, options );
    const observations = _.compact( _.map( arr, "observation" ) );
    const preloadMethod = options.minimal
      ? Observation.preloadMinimal : Observation.preloadAllAssociations;
    await preloadMethod( observations, options );
  }

  static async preloadAnnotationControlledTerms( obs ) {
    return ESModel.fetchBelongsTo(
      _.flattenDeep( _.map( obs, "annotations" ) ),
      ControlledTerm,
      {
        idFields: {
          controlled_value_id: "controlled_value",
          controlled_attribute_id: "controlled_attribute"
        }
      }
    );
  }

  static preloadObservationFields( obs ) {
    return ESModel.fetchBelongsTo(
      _.flattenDeep( _.map( obs, "ofvs" ) ),
      ObservationField,
      { foreignKey: "field_id" }
    );
  }

  static async preloadAllAssociations( obs, localeOpts ) {
    await Observation.preloadAnnotationControlledTerms( obs );
    await Observation.preloadMinimal( obs, localeOpts );
    await Observation.preloadObservationFields( obs );
    const withProjects = _.filter(
      _.flattenDeep( [
        _.map( obs, o => {
          _.each( o.project_observations, po => { po.project_id = po.project.id; } );
          return o.project_observations;
        } ),
        _.map( obs, "non_traditional_projects" )
      ] ), _.identity
    );
    const wikiOpts = Object.assign( { }, localeOpts, { details: true } );
    const taxonOpts = {
      foreignKey: "community_taxon_id",
      attrName: "community_taxon",
      modifier: t => t.prepareForResponse( localeOpts )
    };
    await ESModel.fetchBelongsTo( withProjects, Project, { source: Project.returnFields } );
    await Promise.all( [
      ObservationPreload.viewerProjectMembership( obs, localeOpts ),
      ObservationPreload.observerProjectMembership( obs, localeOpts ),
      ObservationPreload.applications( obs ),
      Taxon.assignWikipediaSummary( _.map( obs, "taxon" ), wikiOpts ),
      ESModel.fetchBelongsTo( obs, Taxon, taxonOpts )
    ] );
    _.each( obs, o => {
      // remove any projectObservation which for whatever reason has no associated
      // project instance, or is associated with a new-style project
      o.project_observations = _.filter( o.project_observations, po => (
        po.project && po.project.project_type !== "collection" && po.project_type !== "umbrella"
      ) );
    } );
  }

  static async preloadMinimal( obs, localeOpts ) {
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      idFields: {
        taxon_id: "taxon",
        previous_observation_taxon_id: "previous_observation_taxon"
      },
      source: { excludes: ["photos", "taxon_photos"] }
    };
    await ESModel.fetchHasMany( obs, Identification, "observation.id", { modelOptions: { forObs: true } } );
    await ObservationPreload.projectObservations( obs );
    const ids = _.flattenDeep( _.map( obs, "identifications" ) );
    const comments = _.flattenDeep( _.map( obs, "comments" ) );
    const ofvs = _.flattenDeep( _.map( obs, "ofvs" ) );
    const withTaxa = _.filter(
      _.flattenDeep( [obs, ids, ofvs] ), wt => ( wt
        && ( ( wt.taxon && Number( wt.taxon.id ) )
          || ( wt.taxon_id && Number( wt.taxon_id ) )
        ) )
    );
    const annotations = _.flattenDeep( _.map( obs, "annotations" ) );
    const annotationVotes = _.flattenDeep( _.map( annotations, "votes" ) );
    const withUsers = _.filter(
      _.flattenDeep( [obs,
        ids,
        annotations,
        annotationVotes,
        comments,
        _.map( comments, "flags" ),
        _.map( ids, "flags" ),
        _.map( obs, "flags" ),
        _.map( obs, "faves" ),
        _.map( obs, "votes" ),
        _.map( obs, "ofvs" ),
        _.map( obs, "project_observations" ),
        _.map( obs, "quality_metrics" )
      ] ), _.identity
    );

    await ESModel.fetchBelongsTo( withTaxa, Taxon, taxonOpts );
    const taxa = _.compact( _.map( ids, "taxon" ) );
    await Promise.all( [
      TaxaController.assignAncestors( { }, taxa, { localeOpts, ancestors: true } ),
      ESModel.fetchBelongsTo( withUsers, User, { } ),
      ObservationPreload.observationSounds( obs ),
      ObservationPreload.userPreferences( obs ),
      ObservationPreload.observationPhotos( obs )
    ] );
  }

  static async preloadMinimalWithProjects( obs, localeOpts ) {
    await Observation.preloadMinimal( obs, localeOpts );
    const withProjects = _.filter(
      _.flattenDeep( [
        _.map( obs, o => {
          _.each( o.project_observations, po => { po.project_id = po.project.id; } );
          return o.project_observations;
        } ),
        _.map( obs, "non_traditional_projects" )
      ] ), _.identity
    );
    await ESModel.fetchBelongsTo( withProjects, Project, { source: Project.returnFields } );
    await ObservationPreload.observerProjectMembership( obs, localeOpts );
  }
};

Observation.modelName = "observation";
Observation.indexName = "observations";
Observation.tableName = "observations";

module.exports = Observation;
