const _ = require( "lodash" );
const inatjs = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const DBModel = require( "../../models/db_model" );
const Observation = require( "../../models/observation" );
const Place = require( "../../models/place" );
const ctrlv1 = require( "../v1/observations_controller" );
const transform = require( "../../../openapi/joi_to_openapi_parameter" );
const conservationStatus = require( "../../../openapi/schema/response/conservation_status" );
const listedTaxon = require( "../../../openapi/schema/response/listed_taxon" );
const { uuidsToSerialIds } = require( "../../util" );

const show = async req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  const observationsByUuid = await DBModel.findByUuids( uuids, Observation, { returnFields: ["id", "uuid"] } );
  req.query = Object.assign( req.query, {
    id: _.map( observationsByUuid, "id" ),
    details: "all",
    per_page: uuids.length
  } );
  return ctrlv1.searchCacheWrapper( req );
};

const search = async req => {
  const placeIDs = _.compact(
    _.flattenDeep( [
      typeof ( req.query.place_id ) === "string"
        ? req.query.place_id.split( "," )
        : req.query.place_id
    ] )
  );
  if ( !_.isEmpty( placeIDs ) ) {
    const [UUIDs, intIDs] = _.partition( placeIDs, id => parseInt( id, 2 ).toString( ) !== id );
    // TODO switch to ESModel lookup when we get uuid in the places index
    const placesByUUID = await DBModel.findByUuids( UUIDs, Place );
    const finalUUIDs = _.map( placesByUUID, "id" );
    req.query.place_id = _.compact( finalUUIDs.concat( intIDs ) );
    if ( _.isEmpty( req.query.place_id ) ) {
      // place filter was requested, but none were found, so set an impossible condition
      req.query.place_id = [-1];
    }
  }
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

const update = async req => {
  const observation = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [observation]
  };
};

const qualityMetrics = async req => {
  await uuidsToSerialIds( req, Observation );
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
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.fave( req );
};

const unfave = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.unfave( req );
};

const review = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.review( req );
};

const unreview = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.unreview( req );
};

const deleteQualityMetric = async req => {
  await uuidsToSerialIds( req, Observation );
  if ( req.params.metric === "needs_id" ) {
    req.body.scope = "needs_id";
    req.body.vote = "yes";
    return InaturalistAPI.iNatJSWrap( inatjs.observations.unvote, req );
  }
  return ctrlv1.deleteQualityMetric( req );
};

const setQualityMetric = async req => {
  await uuidsToSerialIds( req, Observation );
  if ( req.params.metric === "needs_id" ) {
    req.body.scope = "needs_id";
    req.body.vote = "yes";
    return InaturalistAPI.iNatJSWrap( inatjs.observations.vote, req );
  }
  return ctrlv1.setQualityMetric( req );
};

const subscription = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.subscribe( req );
};

const subscriptions = async req => {
  await uuidsToSerialIds( req, Observation );
  return ctrlv1.subscriptions( req );
};

module.exports = {
  create,
  deleteQualityMetric,
  fave,
  qualityMetrics,
  review,
  search,
  setQualityMetric,
  show,
  subscription,
  subscriptions,
  taxonSummary,
  unfave,
  unreview,
  update
};
