const _ = require( "lodash" );
const util = require( "../../util" );
const ESModel = require( "../../models/es_model" );
const User = require( "../../models/user" );
const taxonIdSummaryModel = require( "../../models/taxon_id_summary" );
const { findByTaxonSummaryIds } = require( "../../models/id_summary" );
const { findByIdSummaryIds } = require( "../../models/id_summary_reference" );
const IdSummaryDqa = require( "../../models/id_summary_dqa" );
const IdSummaryReferenceDqa = require( "../../models/id_summary_reference_dqa" );

function parsePositiveIntParam( value, field ) {
  const numberValue = Number( value );
  if ( !Number.isInteger( numberValue ) || numberValue < 1 ) {
    throw util.httpError( 422, `${field} must be a positive integer` );
  }
  return numberValue;
}

function parseAgreeParam( req ) {
  const source = !_.isNil( req.query.agree ) ? req.query.agree : _.get( req, "body.agree" );
  if ( _.isNil( source ) ) {
    return true;
  }
  if ( typeof source === "boolean" ) {
    return source;
  }
  const norm = String( source ).trim( ).toLowerCase( );
  if ( ["true", "t", "1", "yes", "y"].includes( norm ) ) {
    return true;
  }
  if ( ["false", "f", "0", "no", "n"].includes( norm ) ) {
    return false;
  }
  throw util.httpError( 422, "agree must be a boolean" );
}

async function loadTaxonIdSummary( uuid ) {
  if ( !uuid || !util.isUUID( uuid ) ) {
    throw util.httpError( 404, "Taxon ID summary not found" );
  }
  const rowsByUuid = await taxonIdSummaryModel.findByUUIDs( [uuid] );
  const summary = rowsByUuid[uuid];
  if ( !summary ) {
    throw util.httpError( 404, "Taxon ID summary not found" );
  }
  return summary;
}

async function loadSummaryContext( req ) {
  const taxonSummary = await loadTaxonIdSummary( req.params.uuid );
  const summaryId = parsePositiveIntParam( req.params.id, "id" );
  const summariesByParent = await findByTaxonSummaryIds( [taxonSummary.id] );
  const summaries = summariesByParent[taxonSummary.id] || [];
  const summary = summaries.find( s => s.id === summaryId );
  if ( !summary ) {
    throw util.httpError( 404, "ID summary not found" );
  }
  return { taxonSummary, summary };
}

async function loadReferenceContext( req ) {
  const { taxonSummary, summary } = await loadSummaryContext( req );
  const referenceId = parsePositiveIntParam( req.params.reference_id, "reference_id" );
  const referencesBySummary = await findByIdSummaryIds( [summary.id] );
  const references = referencesBySummary[summary.id] || [];
  const reference = references.find( r => r.id === referenceId );
  if ( !reference ) {
    throw util.httpError( 404, "ID summary reference not found" );
  }
  return { taxonSummary, summary, reference };
}

function asResultsResponse( rows ) {
  return {
    total_results: rows.length,
    page: 1,
    per_page: rows.length,
    results: rows
  };
}

function sanitizeMetric( metricParam ) {
  const metric = String( metricParam || "" ).trim( );
  if ( metric.length === 0 ) {
    throw util.httpError( 422, "metric is required" );
  }
  if ( metric.length > 255 ) {
    throw util.httpError( 422, "metric must be 255 characters or fewer" );
  }
  return metric;
}

const summaryQualityMetrics = async req => {
  const { summary } = await loadSummaryContext( req );
  const metrics = await IdSummaryDqa.listForSummary( summary.id );
  await ESModel.fetchBelongsTo( metrics, User );
  return asResultsResponse( metrics );
};

const setSummaryQualityMetric = async req => {
  const { summary } = await loadSummaryContext( req );
  const userId = req.userSession?.user_id;
  if ( !userId ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  const metric = sanitizeMetric( req.params.metric );
  const agree = parseAgreeParam( req );
  await IdSummaryDqa.upsertVote( summary.id, userId, metric, agree );
  return null;
};

const deleteSummaryQualityMetric = async req => {
  const { summary } = await loadSummaryContext( req );
  const userId = req.userSession?.user_id;
  if ( !userId ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  const metric = sanitizeMetric( req.params.metric );
  await IdSummaryDqa.deleteVote( summary.id, userId, metric );
  return null;
};

const referenceQualityMetrics = async req => {
  const { reference } = await loadReferenceContext( req );
  const metrics = await IdSummaryReferenceDqa.listForReference( reference.id );
  await ESModel.fetchBelongsTo( metrics, User );
  return asResultsResponse( metrics );
};

const setReferenceQualityMetric = async req => {
  const { reference } = await loadReferenceContext( req );
  const userId = req.userSession?.user_id;
  if ( !userId ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  const metric = sanitizeMetric( req.params.metric );
  const agree = parseAgreeParam( req );
  await IdSummaryReferenceDqa.upsertVote( reference.id, userId, metric, agree );
  return null;
};

const deleteReferenceQualityMetric = async req => {
  const { reference } = await loadReferenceContext( req );
  const userId = req.userSession?.user_id;
  if ( !userId ) {
    throw util.httpError( 401, "Unauthorized" );
  }
  const metric = sanitizeMetric( req.params.metric );
  await IdSummaryReferenceDqa.deleteVote( reference.id, userId, metric );
  return null;
};

module.exports = {
  summaryQualityMetrics,
  setSummaryQualityMetric,
  deleteSummaryQualityMetric,
  referenceQualityMetrics,
  setReferenceQualityMetric,
  deleteReferenceQualityMetric
};
