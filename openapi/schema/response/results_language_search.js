const Joi = require( "joi" );
const observation = require( "./observation" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items(
    Joi.object( {
      photo_id: Joi.number( ).integer( ).required( ),
      score: Joi.number( ).required( ),
      observation
    } )
  ).required( )
} ).unknown( false ).meta( { unpublished: true } );
