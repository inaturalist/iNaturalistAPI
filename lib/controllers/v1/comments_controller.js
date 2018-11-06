const { comments } = require( "inaturalistjs" );
const Comment = require( "../../models/comment" );
const InaturalistAPI = require( "../../inaturalist_api" );

const CommentsController = class CommentsController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.create, req ).then( r => {
      const arr = [{ comment: r }];
      Comment.preloadInto( arr, null, ( ) => callback( null, arr[0].comment ) );
    } ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.update, req ).then( r => {
      const arr = [{ comment: r }];
      Comment.preloadInto( arr, null, ( ) => callback( null, arr[0].comment ) );
    } ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( comments.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = CommentsController;
