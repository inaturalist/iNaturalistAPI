"use strict";
var observationFieldValues = require( "inaturalistjs" ).observationFieldValues,
    esClient = require( "../../es_client" ),
    InaturalistAPI = require( "../../inaturalist_api" );

var returnFields = [ "id", "name", "description", "datatype", "allowed_values" ];

var ObservationFieldValuesController = class ObservationFieldValuesController {

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 20 } );
    if( !req.query.q ) {
      return InaturalistAPI.basicResponse( null, req, null, callback );
    }
    var wheres = { bool: { should: [
      { term: { slug: req.query.q } },
      { match: { title_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { title: { query: req.query.q, operator: "and" } } }
    ] } };
    esClient.connection.search({
      preference: global.config.elasticsearch.preference || "_local",
      index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
      body: {
        query: {
          bool: {
            must: wheres
          }
        },
        _source: returnFields,
        size: req.query.per_page
      }
    }, function( err, response ) {
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.update, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ObservationFieldValuesController;
