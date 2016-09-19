"use strict";
var _ = require( "underscore" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    User = require( "../../models/user" ),
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    ObservationsController = require( "../../controllers/v1/observations_controller" ),
    UsersController = { };

var UsersController = class UsersController {

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    User.findInES( req.params.id, function( err, user ) {
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

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if( !req.query.q ) {
      return InaturalistAPI.basicResponse( null, req, null, callback );
    }
    var wheres = { bool: { should: [
      { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { name: { query: req.query.q, operator: "and" } } },
      { match: { login_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { login: { query: req.query.q, operator: "and" } } }
    ] } };
    esClient.connection.search({
      preference: global.config.elasticsearch.preference || "_local",
      index: ( process.env.NODE_ENV || global.config.environment ) + "_users",
      body: {
        query: {
          bool: {
            must: wheres
          }
        },
        sort: { activity_count: "desc" },
        size: req.query.per_page
      }
    }, function( err, response ) {
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

};

module.exports = UsersController;
