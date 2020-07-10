const Joi = require( "@hapi/joi" );
const place = require( "./place" );

module.exports = Joi.object( ).keys( {
  authority: Joi.string( ),
  description: Joi.string( ).valid( null ),
  geoprivacy: Joi.string( ).valid( null ),
  iucn: Joi.number( ).integer( ),
  place,
  place_id: Joi.number( ).integer( ).valid( null ),
  source_id: Joi.number( ).integer( ).valid( null ),
  status: Joi.string( ),
  status_name: Joi.string( ),
  taxon_id: Joi.number( ).integer( ),
  url: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "ConservationStatus" } )
  .valid( null );
