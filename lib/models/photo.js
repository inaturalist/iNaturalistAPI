const _ = require( "lodash" );
const Model = require( "./model" );
const DBModel = require( "./db_model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Photo = class Photo extends Model {
  static async preloadInto( arr ) {
    await DBModel.fetchBelongsTo( arr, Photo );
    const photos = _.map( arr, "photo" );
    await ESModel.fetchBelongsTo( photos, User );
  }
};

Photo.modelName = "photo";
Photo.tableName = "photos";
Photo.returnFields = [
  "id",
  "photos.uuid",
  "license",
  "subtype",
  "user_id",
  "created_at",
  "updated_at"
];

module.exports = Photo;
