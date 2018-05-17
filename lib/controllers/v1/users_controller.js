"use strict";
var _ = require( "lodash" ),
    users = require( "inaturalistjs" ).users,
    InaturalistAPI = require( "../../inaturalist_api" ),
    User = require( "../../models/user" ),
    esClient = require( "../../es_client" ),
    ESModel = require( "../../models/es_model" );

var UsersController = class UsersController {

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( users.update, req ).then( function( r ) {
      let userID;
      if ( _.isObject( r ) && r.friendship ) {
        userID = r.friendship.user_id;
      }
      userID = userID || r.id || r['0'].id;
      var arr = [ { user_id: userID } ];
      ESModel.fetchBelongsTo( arr, User, { }, function( ) {
        return callback( null, arr[0].user );
      });
    }).catch( callback );
  }

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

  static me( req, callback ) {
    if( !req.userSession ) {
      return callback({ error: "Unauthorized", status: 401 });
    }
    User.findInES( req.userSession.user_id, function( err, results ) {
      if( err ) { return callback( err ); }
      if( results ) {
        InaturalistAPI.resultsHash({
          total: 1,
          per_page: 1,
          page: 1,
          results: [ results ]
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

    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_users",
      body: {
        query: {
          term: {
            login_exact: req.query.q
          }
        },
        size: req.query.per_page
      }
    }, function( err, exactResponse ) {
      if( err ) { return callback( err ); }
      var shoulds = [
        { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { name: { query: req.query.q, operator: "and" } } },
        { match: { login_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { login: { query: req.query.q, operator: "and" } } }
      ];
      esClient.connection.search({
        preference: global.config.elasticsearch.preference,
        index: ( process.env.NODE_ENV || global.config.environment ) + "_users",
        body: {
          query: {
            bool: {
              should: shoulds
            }
          },
          sort: { activity_count: "desc" },
          size: req.query.per_page
        }
      }, function( err, response ) {
        const exactHit = exactResponse.hits.hits[0];
        if ( exactHit ) {
          response.hits.hits = _.filter( response.hits.hits, h => h._source.id !== exactHit._source.id );
          response.hits.hits.splice( 0, 0, exactHit );
        }
        InaturalistAPI.basicResponse( err, req, response, callback );
      });
    });
  }

  static updateSession( req, callback ) {
    InaturalistAPI.iNatJSWrap( users.update_session, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = UsersController;
