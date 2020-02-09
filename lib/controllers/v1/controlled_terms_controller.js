const _ = require( "lodash" );
const esClient = require( "../../es_client" );
const ESModel = require( "../../models/es_model" );
const ControlledTerm = require( "../../models/controlled_term" );

const ControlledTermsController = class ControlledTermsController {
  static async forTaxon( req ) {
    if ( !req.query.taxon_id ) {
      // return void callback( { error: "Missing required parameter `taxon_id`", status: 422 } );
      throw new Error( 422 );
    }
    const ors = [{ bool: { must_not: [{ exists: { field: "taxon_ids" } }] } }];
    ors.push( esClient.termFilter( "taxon_ids", req.query.taxon_id ) );
    const query = {
      filters: [
        { term: { is_value: false } },
        { bool: { should: ors } }
      ]
    };
    const data = await ESModel.elasticResultsAsync( req, query, "controlled_terms" );
    const terms = _.map( data.hits.hits, h => {
      const term = new ControlledTerm( h._source );
      term.values = term.values.map( v => ( new ControlledTerm( v ) ) );
      return term;
    } );
    return {
      total_results: data.hits.total.value,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: terms
    };
  }

  static async search( req ) {
    const query = {
      filters: [
        { term: { is_value: false } }
      ]
    };
    const data = await ESModel.elasticResultsAsync( req, query, "controlled_terms" );
    const terms = _.map( data.hits.hits, h => {
      const term = new ControlledTerm( h._source );
      if ( term.values ) {
        term.values = term.values.map( v => ( new ControlledTerm( v ) ) );
      }
      return term;
    } );
    return {
      total_results: data.hits.total.value,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: terms
    };
  }
};

module.exports = ControlledTermsController;
