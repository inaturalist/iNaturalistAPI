const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( ).required( ),
  authority: Joi.string( ).valid( null ),
  description: Joi.string( ).valid( null ),
  geoprivacy: Joi.string( ).valid( null ),
  iucn: Joi.number( ).integer( ),
  iucn_status: Joi.string( ),
  iucn_status_code: Joi.string( ),
  place: Joi.object( {
    id: Joi.number( ).integer( ),
    name: Joi.string( ),
    display_name: Joi.string( ),
    ancestry: Joi.string( ).valid( null )
  } ),
  place_id: Joi.number( ).integer( ).valid( null ),
  source_id: Joi.number( ).integer( ).valid( null ),
  status: Joi.string( ),
  status_name: Joi.string( ),
  taxon_id: Joi.number( ).integer( ),
  user_id: Joi.number( ).integer( ).valid( null ),
  url: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "ConservationStatus" } )
  .valid( null );
