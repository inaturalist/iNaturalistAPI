const _ = require( "lodash" );
const ESModel = require( "./es_model" );
const ControlledTerm = require( "./controlled_term" );
const Model = require( "./model" );
const ObservationPreload = require( "./observation_preload" );
const User = require( "./user" );

const TaxonIdentification = class TaxonIdentification extends Model {
  static async preloadAllAssociations( req, taxonIdentifications ) {
    await TaxonIdentification.preloadAnnotationControlledTerms( taxonIdentifications );
    await TaxonIdentification.preloadUsers( taxonIdentifications );
    await ObservationPreload.observationPhotos( _.map( taxonIdentifications, "observation" ) );
  }

  static async preloadAnnotationControlledTerms( taxonIdentifications ) {
    return ESModel.fetchBelongsTo(
      _.flattenDeep( _.map( taxonIdentifications, "observation.annotations" ) ),
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
    } );
  }
};

TaxonIdentification.indexName = "taxon_identifications";

module.exports = TaxonIdentification;
