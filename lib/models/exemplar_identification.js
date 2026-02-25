const _ = require( "lodash" );
const ESModel = require( "./es_model" );
const ControlledTerm = require( "./controlled_term" );
const Model = require( "./model" );
const ObservationPreload = require( "./observation_preload" );
const User = require( "./user" );
const Identification = require( "./identification" );

const ExemplarIdentification = class ExemplarIdentification extends Model {
  static async preloadAllAssociations( req, exemplarIdentifications ) {
    const identifications = _.map( _.map( exemplarIdentifications, "identification" ), identification => (
      { id: identification.id }
    ) );
    await ESModel.fetchBelongsTo( identifications, Identification, {
      foreignKey: "id", source: { excludes: ["observation", "taxon", "current_taxon"] }
    } );
    const identificationInstances = _.keyBy( _.map( identifications, "identification" ), "id" );
    _.each( exemplarIdentifications, exemplarIdentification => {
      if ( _.has( identificationInstances, exemplarIdentification.identification?.id ) ) {
        exemplarIdentification.identification = _.assign(
          identificationInstances[exemplarIdentification.identification.id],
          exemplarIdentification.identification
        );
      }
    } );

    await ExemplarIdentification.preloadAnnotationControlledTerms( exemplarIdentifications );
    const withUsers = _.filter( _.flattenDeep( [
      _.map( exemplarIdentifications, "identification" ),
      _.map( exemplarIdentifications, "votes" )] ), _.identity );
    await ESModel.fetchBelongsTo( withUsers, User );
    await ESModel.fetchBelongsTo( exemplarIdentifications, User, {
      idFields: { nominated_by_user_id: "nominated_by_user" }
    } );
    await ObservationPreload.observationSounds( _.map( exemplarIdentifications, "identification.observation" ) );
    await ObservationPreload.observationPhotos( _.map( exemplarIdentifications, "identification.observation" ) );
  }

  static async preloadAnnotationControlledTerms( exemplarIdentifications ) {
    return ESModel.fetchBelongsTo(
      _.flattenDeep( _.map( exemplarIdentifications, "identification.observation.annotations" ) ),
      ControlledTerm,
      {
        idFields: {
          controlled_value_id: "controlled_value",
          controlled_attribute_id: "controlled_attribute"
        },
        source: {
          includes: ["id", "labels"]
        }
      }
    );
  }

  static async preloadUsers( exemplarIdentifications ) {
    const userIDs = {};
    _.each( exemplarIdentifications, tid => {
      userIDs[tid.user.id] = 1;
      if ( tid.nominated_by_user ) {
        userIDs[tid.nominated_by_user.id] = 1;
      }
    } );
    const users = await ESModel.fetchInstancesByIDsObject( userIDs, User, {
      source: {
        includes: ["id", "login", "icon", "name"]
      }
    } );
    _.each( exemplarIdentifications, tid => {
      if ( users[tid.user.id] ) {
        tid.user = users[tid.user.id];
      }
      if ( tid.nominated_by_user && users[tid.nominated_by_user.id] ) {
        tid.nominated_by_user = users[tid.nominated_by_user.id];
      }
    } );
  }
};

ExemplarIdentification.indexName = "exemplar_identifications";

module.exports = ExemplarIdentification;
