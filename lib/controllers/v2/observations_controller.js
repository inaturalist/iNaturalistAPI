const _ = require( "lodash" );
const inatjs = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const Observation = require( "../../models/observation" );
const ctrlv1 = require( "../v1/observations_controller" );
const transform = require( "../../../openapi/joi_to_openapi_parameter" );
const conservationStatus = require( "../../../openapi/schema/response/conservation_status" );
const listedTaxon = require( "../../../openapi/schema/response/listed_taxon" );

// Utility to look up obs IDs from UUIDs to forward requests to the v1 API
const uuidsToObservatioIds = async req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  const observationsByUuid = await ESModel.findByUuids( uuids, Observation );
  req.params = Object.assign( req.params, {
    id: _.map( observationsByUuid, v => v.id )
  } );
  delete req.params.uuid;
};

const show = req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  req.query = Object.assign( req.query, {
    uuid: uuids,
    details: "all",
    per_page: uuids.length
  } );
  return ctrlv1.searchCacheWrapper( req );
};

const create = async req => {
  const observation = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observation]
  };
};

const qualityMetrics = async req => {
  await uuidsToObservatioIds( req );
  return ctrlv1.qualityMetrics( req );
};

const taxonSummary = async req => {
  const { uuid } = req.params;
  const observationsByUuid = await ESModel.findByUuids( [uuid], Observation );
  if ( observationsByUuid && observationsByUuid[uuid] ) {
    req.params.id = observationsByUuid[uuid].id;
  } else {
    req.params.id = uuid;
  }
  delete req.params.uuid;
  delete req.query.fields;
  delete req.body.fields;
  const r = await InaturalistAPI.iNatJSWrap( inatjs.observations.taxonSummary, req );
  // Prune the Rails response to match the API schema
  // TODO make a re-usable method that coerces an object something that fits a Joi schema
  const pruned = _.pick( r, ["wikipedia_summary"] );
  const conservationStatusOpenApi = transform( conservationStatus );
  if ( r.conservation_status ) {
    pruned.conservation_status = _.pick(
      r.conservation_status,
      _.keys( conservationStatusOpenApi.schema.properties )
    );
    if ( pruned.conservation_status.place ) {
      pruned.conservation_status.place = _.pick(
        pruned.conservation_status.place,
        _.keys( conservationStatusOpenApi.schema.properties.place.schema.properties )
      );
    }
  }
  const listedTaxonOpenApi = transform( listedTaxon );
  if ( r.listed_taxon ) {
    pruned.listed_taxon = _.pick( r.listed_taxon, _.keys( listedTaxonOpenApi.schema.properties ) );
    if ( pruned.listed_taxon.place ) {
      pruned.listed_taxon.place = _.pick(
        pruned.listed_taxon.place,
        _.keys( listedTaxonOpenApi.schema.properties.place.schema.properties )
      );
    }
    if ( pruned.listed_taxon.taxon ) {
      pruned.listed_taxon.taxon = _.pick(
        pruned.listed_taxon.taxon,
        _.keys( listedTaxonOpenApi.schema.properties.taxon.schema.properties )
      );
    }
  }
  return pruned;
};

const fave = async req => {
  await uuidsToObservatioIds( req );
  return ctrlv1.fave( req );
};

const unfave = async req => {
  await uuidsToObservatioIds( req );
  return ctrlv1.unfave( req );
};

module.exports = {
  create,
  fave,
  qualityMetrics,
  search: ctrlv1.search,
  show,
  taxonSummary,
  unfave
};
