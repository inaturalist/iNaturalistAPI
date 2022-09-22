const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  identification: Joi.object( ).keys( {
    body: Joi.string( ),
    observation_id: Joi.string( ).guid( ).required( ),
    taxon_id: Joi.number( ).integer( ).required( ),
    vision: Joi.boolean( ),
    disagreement: Joi.boolean( )
  } ).required( )
} );
