"use strict";
var posts = require( "inaturalistjs" ).posts,
    InaturalistAPI = require( "../../inaturalist_api" );

var PostsController = class PostsController {

  static index( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.search, req ).then( function( r ) {
      return callback( null, r );
    } ).catch( callback );
  }

  static for_user( req, callback ) {
    InaturalistAPI.iNatJSWrap( posts.for_user, req ).then( function( r ) {
      return callback( null, r );
    } ).catch( callback );
  }

};

module.exports = PostsController;
