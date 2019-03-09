const esClient = require( "../../es_client" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );

const returnFields = ["id", "name", "description", "datatype",
  "allowed_values", "values_count"];

const ObservationFieldsController = class ObservationFieldValuesController {
  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if ( !req.query.q ) {
      return void InaturalistAPI.basicResponse( null, req, null, callback );
    }
    const filters = [{
      bool: {
        should: [
          { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
          { match: { name: { query: req.query.q, operator: "and" } } }
        ]
      }
    }];
    const inverseFilters = [];
    if ( req.query.not_id ) {
      inverseFilters.push( {
        terms: { id: util.paramArray( req.query.not_id ) }
      } );
    }
    const searchParams = {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_observation_fields`,
      body: {
        query: {
          function_score: {
            query: {
              bool: {
                must: filters,
                must_not: inverseFilters
              }
            },
            field_value_factor: {
              field: "values_count",
              factor: 1,
              missing: 3,
              modifier: "log2p"
            },
            boost_mode: "sum"
          }
        },
        _source: returnFields,
        size: req.query.per_page
      }
    };
    esClient.connection.search( searchParams, ( err, response ) => {
      InaturalistAPI.basicResponse( err, req, response, callback );
    } );
  }
};

module.exports = ObservationFieldsController;
