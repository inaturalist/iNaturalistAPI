const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  nelat: Joi.number( ).required( ),
  nelng: Joi.number( ).required( ),
  swlat: Joi.number( ).required( ),
  swlng: Joi.number( ).required( ),
  name: Joi.string( ),
  per_page: Joi.number( ),
  fields: Joi.any( )
} ).unknown( false ).meta( { parameters: true } );
