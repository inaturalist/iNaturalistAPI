const _ = require( "lodash" );
const inatjs = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const DBModel = require( "../../models/db_model" );
const Observation = require( "../../models/observation" );
const Place = require( "../../models/place" );
const ctrlv1 = require( "../v1/observations_controller" );
const conservationStatus = require( "../../../openapi/schema/response/conservation_status" );
const listedTaxon = require( "../../../openapi/schema/response/listed_taxon" );
const util = require( "../../util" );

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
    const [UUIDs, intIDs] = _.partition( placeIDs, util.isUUID );
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
  await util.uuidsToSerialIds( req, Observation );
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
  if ( r.conservation_status ) {
    const conservationStatusResponseSchemaKeys = _.map( conservationStatus.$_terms.keys, "key" );
    pruned.conservation_status = _.pick(
      r.conservation_status, conservationStatusResponseSchemaKeys
    );
    if ( pruned.conservation_status.place ) {
      const conservationStatusResponseSchemaPlace = _.find(
        conservationStatus.$_terms.keys, k => k.key === "place"
      );
      const conservationStatusResponseSchemaPlaceKeys = _.map(
        conservationStatusResponseSchemaPlace.schema.$_terms.keys, "key"
      );
      pruned.conservation_status.place = _.pick(
        pruned.conservation_status.place, conservationStatusResponseSchemaPlaceKeys
      );
    }
  }
  if ( r.listed_taxon ) {
    const listedTaxonResponseSchemaKeys = _.map( listedTaxon.$_terms.keys, "key" );
    pruned.listed_taxon = _.pick( r.listed_taxon, listedTaxonResponseSchemaKeys );
    if ( pruned.listed_taxon.place ) {
      const listedTaxonResponseSchemaPlace = _.find(
        listedTaxon.$_terms.keys, k => k.key === "place"
      );
      const listedTaxonResponseSchemaPlaceKeys = _.map(
        listedTaxonResponseSchemaPlace.schema.$_terms.keys, "key"
      );
      pruned.listed_taxon.place = _.pick(
        pruned.listed_taxon.place, listedTaxonResponseSchemaPlaceKeys
      );
    }
  }
  return pruned;
};

const fave = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.fave( req );
};

const unfave = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.unfave( req );
};

const review = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.review( req );
};

const unreview = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.unreview( req );
};

const deleteQualityMetric = async req => {
  await util.uuidsToSerialIds( req, Observation );
  if ( req.params.metric === "needs_id" ) {
    req.body.scope = "needs_id";
    req.body.vote = "yes";
    return InaturalistAPI.iNatJSWrap( inatjs.observations.unvote, req );
  }
  return ctrlv1.deleteQualityMetric( req );
};

const setQualityMetric = async req => {
  await util.uuidsToSerialIds( req, Observation );
  if ( req.params.metric === "needs_id" ) {
    req.body.scope = "needs_id";
    req.body.vote = "yes";
    return InaturalistAPI.iNatJSWrap( inatjs.observations.vote, req );
  }
  return ctrlv1.setQualityMetric( req );
};

const subscription = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.subscribe( req );
};

const subscriptions = async req => {
  await util.uuidsToSerialIds( req, Observation );
  return ctrlv1.subscriptions( req );
};

const updates = async req => {
  const response = await ctrlv1.updates( req );
  // add observation UUIDs as `resource_uuid` to the returned updates
  const observationIDs = _.map( _.filter( response.results, r => (
    r.resource_type === "Observation"
  ) ), "resource_id" );
  const observationModels = await DBModel.findByIDs(
    observationIDs, Observation, { returnFields: ["id", "uuid"] }
  );
  _.each( response.results, r => {
    if ( r.resource_type === "Observation" && observationModels[r.resource_id] ) {
      r.resource_uuid = observationModels[r.resource_id].uuid;
    }
  } );
  return response;
};

module.exports = {
  create,
  delete: ctrlv1.delete,
  deleted: ctrlv1.deleted,
  deleteQualityMetric,
  fave,
  histogram: ctrlv1.histogramCacheWrapper,
  iconicTaxaSpeciesCounts: ctrlv1.iconicTaxaSpeciesCounts,
  identificationCategories: ctrlv1.identificationCategories,
  identifiers: ctrlv1.identifiersCacheWrapper,
  observers: ctrlv1.observersCacheWrapper,
  popularFieldValues: ctrlv1.popularFieldValues,
  qualityGrades: ctrlv1.qualityGrades,
  qualityMetrics,
  review,
  search,
  setQualityMetric,
  show,
  speciesCounts: ctrlv1.speciesCountsCacheWrapper,
  subscription,
  subscriptions,
  taxonSummary,
  umbrellaProjectStats: ctrlv1.umbrellaProjectStats,
  unfave,
  unreview,
  update,
  updates,
  viewedUpdates: ctrlv1.viewedUpdates
};
