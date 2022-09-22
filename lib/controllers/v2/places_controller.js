const _ = require( "lodash" );
const DBModel = require( "../../models/db_model" );
const Place = require( "../../models/place" );
const ctrlv1 = require( "../v1/places_controller" );
const util = require( "../../util" );

const show = async req => {
  const ids = req.params.uuid.slice( 0, 200 );
  const uuids = _.filter( ids, util.isUUID );
  // TODO switch to ESModel lookup when we get uuid in the places index
  const placesByUuid = await DBModel.findByUuids( uuids, Place );
  const finalIds = _.map( ids, id => ( placesByUuid[id] ? placesByUuid[id].id : id ) );
  req.params = Object.assign( req.params, {
    id: finalIds.join( "," )
  } );
  return ctrlv1.show( req );
};

module.exports = {
  search: ctrlv1.autocomplete,
  show
};
