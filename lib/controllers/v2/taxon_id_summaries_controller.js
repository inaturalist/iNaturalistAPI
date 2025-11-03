const _ = require( "lodash" );
const taxonIdSummaryModel = require( "../../models/taxon_id_summary" );
const { findByTaxonSummaryIds } = require( "../../models/id_summary" );
const { findByIdSummaryIds } = require( "../../models/id_summary_reference" );

const search = async req => {
  const {
    results, total, page, perPage
  } = await taxonIdSummaryModel.search( req.query || { } );
  return {
    page, per_page: perPage, total_results: total, results
  };
};

const show = async req => {
  const raw = req.params && req.params.uuid ? String( req.params.uuid ) : "";
  const uuids = _( raw.split( "," ) ).map( s => s.trim( ) ).filter( Boolean ).slice( 0, 200 )
    .value( );
  if ( uuids.length === 0 ) {
    return {
      page: 1, per_page: 0, total_results: 0, results: []
    };
  }

  const rowsByUuid = await taxonIdSummaryModel.findByUUIDs( uuids );
  const rows = uuids.map( u => rowsByUuid[u] ).filter( Boolean );

  const parentIds = rows.map( r => r.id );
  const summariesByParent = await findByTaxonSummaryIds( parentIds );
  const allSummaryIds = _.flatten( Object.values( summariesByParent ) ).map( s => s.id );
  const refsBySummary = await findByIdSummaryIds( allSummaryIds );
  parentIds.forEach( pid => {
    const summaries = summariesByParent[pid] || [];
    summaries.forEach( summary => {
      summary.references = refsBySummary[summary.id] || [];
    } );
    const parent = rows.find( r => r.id === pid );
    if ( parent ) {
      parent.id_summaries = summaries;
    }
  } );

  return {
    page: 1, per_page: rows.length, total_results: rows.length, results: rows
  };
};

module.exports = { search, show };
