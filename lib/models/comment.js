const _ = require( "lodash" );
const Model = require( "./model" );
const DBModel = require( "./db_model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Comment = class Comment extends Model {
  static async preloadInto( arr ) {
    await DBModel.fetchBelongsToAsync( arr, Comment );
    const comments = _.map( arr, "comment" );
    await ESModel.fetchBelongsToAsync( comments, User );
  }
};

Comment.modelName = "comment";
Comment.tableName = "comments";
Comment.returnFields = [
  "id", "comments.uuid", "body", "parent_id", "parent_type",
  "user_id", "created_at", "updated_at"];

module.exports = Comment;
