const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    taxon_id: Joi.number( ).integer( ).required( ),
    count: Joi.number( ).integer( ).required( )
  } ) ).required( )
} ).unknown( false );
