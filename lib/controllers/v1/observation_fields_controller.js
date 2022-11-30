const esClient = require( "../../es_client" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );

const returnFields = ["id", "name", "description", "datatype",
  "allowed_values", "values_count"];

const ObservationFieldsController = class ObservationFieldValuesController {
  static async autocomplete( req ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if ( !req.query.q ) {
      return InaturalistAPI.basicResponse( req );
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
    const response = await esClient.search( "observation_fields", {
      body: {
        query: {
          function_score: {
            query: {
              bool: {
                must: filters,
                filter: filters,
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
    } );
    return InaturalistAPI.basicResponse( req, response );
  }
};

module.exports = ObservationFieldsController;
