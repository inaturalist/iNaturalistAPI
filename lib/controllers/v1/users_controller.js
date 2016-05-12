"use strict";
var _ = require( "underscore" ),
    users = require( "inaturalistjs" ).users,
    esClient = require( "../../es_client" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    User = require( "../../models/user" ),
    UsersController = { };

// var returnFields = [ "id", "title", "description", "slug" ];

var UsersController = class UsersController {

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    User.findByLoginOrID( req.params.id, function( err, user ) {
      if( err ) { return callback( err ); }
      if( user ) {
        InaturalistAPI.resultsHash({
          total: 1,
          per_page: req.query.per_page,
          page: req.query.page,
          results: [ user ]
        }, callback )
      } else {
        return callback({ error: "Unknown user", status: 422 });
      }
    });
  }

};

module.exports = UsersController;
