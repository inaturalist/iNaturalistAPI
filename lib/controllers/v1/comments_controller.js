"use strict";
var comments = require( "inaturalistjs" ).comments,
    Comment = require( "../../models/comment" ),
    InaturalistAPI = require( "../../inaturalist_api" );

var CommentsController = class CommentsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.create, req ).then( function( r ) {
      var arr = [ { comment: r } ];
      Comment.preloadInto( arr, function( ) {
        return callback( null, arr[0].comment );
      });
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.update, req ).then( function( r ) {
      var arr = [ { comment: r } ];
      Comment.preloadInto( arr, function( ) {
        return callback( null, arr[0].comment );
      });
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = CommentsController;
