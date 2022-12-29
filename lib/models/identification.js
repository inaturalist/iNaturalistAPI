const _ = require( "lodash" );
const Model = require( "./model" );
const DBModel = require( "./db_model" );
const ESModel = require( "./es_model" );
const Taxon = require( "./taxon" );
const User = require( "./user" );

const Identification = class Identification extends Model {
  constructor( attrs, options ) {
    super( attrs );
    options = options || { };
    if ( options.forObs ) {
      if ( this.taxon && !this.taxon_id ) {
        this.taxon_id = this.taxon.id;
      }
      delete this.taxon;
      delete this.observation;
      delete this.current_taxon;
    }
  }

  static async preloadInto( req, arr, localeOpts ) {
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      source: { excludes: ["photos", "taxon_photos"] }
    };
    await DBModel.fetchBelongsTo( arr, Identification );
    const identification = _.map( arr, "identification" );
    await ESModel.fetchBelongsTo( identification, Taxon, taxonOpts );
    await ESModel.fetchBelongsTo( identification, User );
  }
};

Identification.modelName = "identification";
Identification.tableName = "identifications";
Identification.indexName = "identifications";
Identification.returnFields = [
  "identifications.id", "identifications.uuid", "identifications.observation_id",
  "identifications.taxon_id", "identifications.user_id", "identifications.body",
  "identifications.created_at", "identifications.updated_at", "identifications.current",
  "identifications.category",
  "taxon_changes.id taxon_change_id", "taxon_changes.type taxon_change_type"
];
Identification.leftJoins = [
  ["taxon_changes", null, "identifications.taxon_change_id=taxon_changes.id"]
];

module.exports = Identification;
