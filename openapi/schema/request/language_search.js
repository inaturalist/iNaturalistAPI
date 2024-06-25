const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  taxon_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  locale: Joi.string( ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} ).unknown( false ).meta( { unpublished: true } );
