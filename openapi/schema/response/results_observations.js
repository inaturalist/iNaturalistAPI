const Joi = require( "joi" );
const observation = require( "./observation" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  total_bounds: Joi.object( ).keys( {
    swlat: Joi.number( ),
    swlng: Joi.number( ),
    nelat: Joi.number( ),
    nelng: Joi.number( )
  } ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( observation ).required( )
} ).unknown( false );
