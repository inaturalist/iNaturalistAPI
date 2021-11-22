const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  identification: Joi.object( ).keys( {
    body: Joi.string( ),
    observation_id: Joi.number( ).integer( ),
    taxon_id: Joi.number( ).integer( )
  } ).required( )
} );
