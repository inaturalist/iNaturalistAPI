"use strict";
var Model = require( "./model" ),
    DBModel = require( "./db_model" ),
    User = require( "./user" );

var Comment = class Comment extends Model {

  static preloadUsers( comments, callback ) {
    DBModel.fetchBelongsTo( comments, User, callback );
  }

  static preloadInto( arr, callback ) {
    DBModel.fetchBelongsTo( arr, Comment, function( ) {
      var comments = arr.map( function( i ) { return i.comment; } );
      Comment.preloadUsers( comments, function( ) {
        return callback( null, arr );
      });
    });
  }

};

Comment.modelName = "comment";
Comment.tableName = "comments";
Comment.returnFields = [
  "id", "body", "parent_id", "parent_type",
  "user_id", "created_at", "updated_at" ];

module.exports = Comment;
