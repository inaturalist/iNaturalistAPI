const { comments } = require( "inaturalistjs" );
const Comment = require( "../../models/comment" );
const InaturalistAPI = require( "../../inaturalist_api" );

const CommentsController = class CommentsController {
  static async create( req ) {
    const response = await InaturalistAPI.iNatJSWrap( comments.create, req );
    const arr = [{ comment: response }];
    await Comment.preloadInto( arr );
    return arr[0].comment;
  }

  static async update( req ) {
    const response = await InaturalistAPI.iNatJSWrap( comments.update, req );
    const arr = [{ comment: response }];
    await Comment.preloadInto( arr );
    return arr[0].comment;
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( comments.delete, req );
  }
};

module.exports = CommentsController;
