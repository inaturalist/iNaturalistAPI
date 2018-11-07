const _ = require( "lodash" );
const Model = require( "./model" );
const DBModel = require( "./db_model" );
const ESModel = require( "./es_model" );
const Taxon = require( "./taxon" );
const User = require( "./user" );

const Identification = class Identification extends Model {
  static preloadInto( arr, localeOpts, callback ) {
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      source: { excludes: ["photos", "taxon_photos"] }
    };
    DBModel.fetchBelongsTo( arr, Identification, err => {
      if ( err ) { return void callback( err ); }
      const identification = _.map( arr, "identification" );
      ESModel.fetchBelongsTo( identification, Taxon, taxonOpts, errr => {
        if ( errr ) { return void callback( errr ); }
        ESModel.fetchBelongsTo( identification, User, { }, callback );
      } );
    } );
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
  ["taxon_changes", null, "identifications.taxon_change_id=taxon_changes.id"]
];

module.exports = Identification;
