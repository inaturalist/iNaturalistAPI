const Joi = require( "joi" );
const place = require( "./place" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.object( {
    standard: Joi.array( ).items( place ),
    community: Joi.array( ).items( place )
  } ).required( )
} ).unknown( false );
