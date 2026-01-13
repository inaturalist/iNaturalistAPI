const _ = require( "lodash" );
const ESModel = require( "./es_model" );
const ControlledTerm = require( "./controlled_term" );
const Model = require( "./model" );
const ObservationPreload = require( "./observation_preload" );
const User = require( "./user" );
const Identification = require( "./identification" );

const TaxonIdentification = class TaxonIdentification extends Model {
  static async preloadAllAssociations( req, taxonIdentifications ) {
    const identifications = _.map( _.map( taxonIdentifications, "identification" ), identification => (
      { id: identification.id }
    ) );
    await ESModel.fetchBelongsTo( identifications, Identification, {
      foreignKey: "id", source: { excludes: ["observation", "taxon", "current_taxon"] }
    } );
    const identificationInstances = _.keyBy( _.map( identifications, "identification" ), "id" );
    _.each( taxonIdentifications, taxonIdentification => {
      if ( _.has( identificationInstances, taxonIdentification.identification?.id ) ) {
        taxonIdentification.identification = _.assign(
          identificationInstances[taxonIdentification.identification.id],
          taxonIdentification.identification
        );
      }
    } );

    await TaxonIdentification.preloadAnnotationControlledTerms( taxonIdentifications );
    const withUsers = _.filter( _.flattenDeep( [
      _.map( taxonIdentifications, "identification" ),
      _.map( taxonIdentifications, "votes" )] ), _.identity );
    await ESModel.fetchBelongsTo( withUsers, User );
    await ESModel.fetchBelongsTo( taxonIdentifications, User, {
      idFields: { nominated_by_user_id: "nominated_by_user" }
    } );
    await ObservationPreload.observationSounds( _.map( taxonIdentifications, "identification.observation" ) );
    await ObservationPreload.observationPhotos( _.map( taxonIdentifications, "identification.observation" ) );
  }

  static async preloadAnnotationControlledTerms( taxonIdentifications ) {
    return ESModel.fetchBelongsTo(
      _.flattenDeep( _.map( taxonIdentifications, "identification.observation.annotations" ) ),
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

  static async preloadUsers( taxonIdentifications ) {
    const userIDs = {};
    _.each( taxonIdentifications, tid => {
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
    _.each( taxonIdentifications, tid => {
      if ( users[tid.user.id] ) {
        tid.user = users[tid.user.id];
      }
      if ( tid.nominated_by_user && users[tid.nominated_by_user.id] ) {
        tid.nominated_by_user = users[tid.nominated_by_user.id];
      }
    } );
  }
};

TaxonIdentification.indexName = "exemplar_identifications";

module.exports = TaxonIdentification;
