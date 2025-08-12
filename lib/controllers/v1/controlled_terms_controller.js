const _ = require( "lodash" );
const esClient = require( "../../es_client" );
const ESModel = require( "../../models/es_model" );
const ControlledTerm = require( "../../models/controlled_term" );
const ObservationsController = require( "./observations_controller" );

const ControlledTermsController = class ControlledTermsController {
  static async forTaxon( req ) {
    if ( !req.query.taxon_id ) {
      const e = new Error( );
      e.custom_message = "Missing required parameter `taxon_id`";
      e.status = 422;
      throw e;
    }
    const ors = [{ bool: { must_not: [{ exists: { field: "taxon_ids" } }] } }];
    ors.push( esClient.termFilter( "taxon_ids", req.query.taxon_id ) );
    const query = {
      filters: [
        { term: { is_value: false } },
        { bool: { should: ors } }
      ]
    };
    const data = await ESModel.elasticResults( req, query, "controlled_terms" );
    let terms = _.map( data.hits.hits, h => {
      const term = new ControlledTerm( h._source );
      term.values = term.values.map( v => ( new ControlledTerm( v ) ) );
      return term;
    } );

    if ( req.query.populated_by ) {
      const countQuery = {
        per_page: 0,
        taxon_id: req.query.populated_by,
        aggs: {
          nested_annotations: {
            nested: { path: "annotations" },
            aggs: {
              attributes: {
                terms: {
                  field: "annotations.concatenated_attr_val",
                  size: 100
                }
              }
            }
          }
        }
      };
      const countReq = _.assignIn( { }, req, { query: countQuery } );
      const termsAggResponse = await ObservationsController.elasticResults( countReq );
      let populatedTermValueIDs = [];
      _.each(
        termsAggResponse.aggregations.nested_annotations.attributes.buckets,
        bucket => {
          populatedTermValueIDs = populatedTermValueIDs.concat( _.map( bucket.key.split( "|" ), Number ) );
        }
      );
      const queryTaxonIDs = _.map( req.query.taxon_id.split( "," ), Number );
      _.each( terms, term => {
        term.values = _.filter( term.values, value => {
          if ( value.taxon_ids
            && _.isEmpty( _.intersection( value.taxon_ids, queryTaxonIDs ) )
          ) {
            return false;
          }
          if ( !_.includes( populatedTermValueIDs, value.id ) ) {
            return false;
          }
          return true;
        } );
      } );
      terms = _.filter( terms, term => ( !_.isEmpty( term.values ) ) );
    }

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
    const data = await ESModel.elasticResults( req, query, "controlled_terms" );
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
