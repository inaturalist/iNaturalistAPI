"use strict";
var Model = require( "./model" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    User = require( "./user" );

var Comment = class Comment extends Model {

  static preloadUsers( comments, callback ) {
    ESModel.fetchBelongsTo( comments, User, { }, callback );
  }

  static preloadInto( arr, localeOpts, callback ) {
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
  "id", "uuid", "body", "parent_id", "parent_type",
  "user_id", "created_at", "updated_at" ];

module.exports = Comment;
