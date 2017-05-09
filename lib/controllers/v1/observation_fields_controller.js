"use strict";
var esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" );

var returnFields = [ "id", "name", "description", "datatype",
  "allowed_values", "values_count" ];

var ObservationFieldsController = class ObservationFieldValuesController {

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if( !req.query.q ) {
      return InaturalistAPI.basicResponse( null, req, null, callback );
    }
    let filters = [ { bool: { should: [
      { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { name: { query: req.query.q, operator: "and" } } } ] } } ];
    if( req.query.not_id ) {
      filters.push( { not: {
        terms: { id: util.paramArray( req.query.not_id ) }
      }});
    }
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_observation_fields",
      body: {
        query: {
          bool: {
            filter: filters
          }
        },
        _source: returnFields,
        size: req.query.per_page
      }
    }, function( err, response ) {
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

};

module.exports = ObservationFieldsController;
