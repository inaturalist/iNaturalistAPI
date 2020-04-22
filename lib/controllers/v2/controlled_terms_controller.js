const _ = require( "lodash" );
const Joi = require( "@hapi/joi" );
const DBModel = require( "../../models/db_model" );
const Taxon = require( "../../models/taxon" );
const ctrlv1 = require( "../v1/controlled_terms_controller" );

const forTaxon = async req => {
  const taxonIds = req.params.taxon_id.slice( 0, 200 );
  const ids = [];
  const uuids = [];
  _.filter( taxonIds, id => {
    const { error: guidError } = Joi.string( ).guid( ).validate( id );
    const { error: intError } = Joi.number( ).integer( ).validate( id );
    if ( !guidError ) {
      uuids.push( id );
    } else if ( !intError ) {
      ids.push( id );
    }
  } );
  const taxaByUuid = await DBModel.findByUuids( uuids, Taxon );
  req.query = Object.assign( req.query, {
    taxon_id: _.map( taxonIds, v => (
      taxaByUuid[v] ? taxaByUuid[v].id : v
    ) ).join( "," )
  } );
  return ctrlv1.forTaxon( req );
};

module.exports = {
  search: ctrlv1.search,
  forTaxon
};
