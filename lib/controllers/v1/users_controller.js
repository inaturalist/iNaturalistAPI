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

  static unobservedSpecies( req, callback ) {
    req.query.user_id = req.params.user_id;
    // return up to 10k previously observed species
    var observedReq = {
      query: {
        user_id: req.params.user_id,
        hrank: "species",
        per_page: 10000
      }
    };
    // preserve the taxon_id and without_taxon_id for faster queries, and
    // ignore the rest so we have a complete species list for the user
    if( req.query.taxon_id ) {
      observedReq.query.taxon_id = req.query.taxon_id;
    }
    if( req.query.without_taxon_id ) {
      observedReq.query.without_taxon_id = req.query.without_taxon_id;
    }
    ObservationsController.speciesCounts( observedReq, ( err, r ) => {
      // ignore taxa already observed
      var withoutTaxonIDs = _.map( r.results, r => r.taxon.id );
      if( req.query.without_taxon_id ) {
        // combining with without_taxon_id parameter
        withoutTaxonIDs =
          withoutTaxonIDs.concat( util.paramArray( req.query.without_taxon_id ) );
      }
      // look for the top species not observed by this user within a certain radius
      var unobservedReq = { query: Object.assign( { }, req.query, { per_page: 500,
        without_taxon_id: withoutTaxonIDs, hrank: "species" } ) };
      unobservedReq.radius = unobservedReq.radius || 200;
      delete unobservedReq.query.user_id;
      ObservationsController.speciesCounts( unobservedReq, callback );
    });
  }

};

module.exports = UsersController;
