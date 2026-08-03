const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    name: Joi.string( ),
    default_photo: Joi.object( {
      medium_url: Joi.string( )
    } ),
    preferred_common_name: Joi.string( ).valid( null )
  } ) ).required( )
} ).unknown( false );
