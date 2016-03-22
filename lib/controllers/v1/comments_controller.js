
var comments = require( "inaturalistjs" ).comments,
    Comment = require( "../../models/comment" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    CommentsController = { };

CommentsController.create = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( comments.create, req ).then( function( r ) {
    var arr = [ { comment: r } ];
    Comment.preloadInto( arr, function( ) {
      return callback( null, arr[0].comment );
    });
  }).catch( callback );
};

CommentsController.update = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( comments.update, req ).then( function( r ) {
    var arr = [ { comment: r } ];
    Comment.preloadInto( arr, function( ) {
      return callback( null, arr[0].comment );
    });
  }).catch( callback );
};

CommentsController.delete = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( comments.delete, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

module.exports = {
  create: CommentsController.create,
  update: CommentsController.update,
  delete: CommentsController.delete
};
