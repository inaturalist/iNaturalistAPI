const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  comment: Joi.object( ).keys( {
    parent_type: Joi
      .string( )
      .valid(
        "Observation",
        "Post"
      )
      .description( "Type of record being commented on" )
      .required( ),
    parent_id: Joi
      .string( ).guid( )
      .required( )
      .description( "UUID of record being commented on" ),
    body: Joi.string( ).required( )
  } ).required( )
} );
