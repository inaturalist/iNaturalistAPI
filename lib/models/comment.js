const _ = require( "lodash" );
const Model = require( "./model" );
const DBModel = require( "./db_model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Comment = class Comment extends Model {
  static preloadUsers( comments, callback ) {
    ESModel.fetchBelongsTo( comments, User, { }, callback );
  }

  static preloadInto( arr, localeOpts, callback ) {
    DBModel.fetchBelongsTo( arr, Comment, ( ) => {
      const comments = _.map( arr, "comment" );
      Comment.preloadUsers( comments, ( ) => callback( null, arr ) );
    } );
  }
};

Comment.modelName = "comment";
Comment.tableName = "comments";
Comment.returnFields = [
  "id", "uuid", "body", "parent_id", "parent_type",
  "user_id", "created_at", "updated_at"];

module.exports = Comment;
