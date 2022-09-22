const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( {
    id: Joi.number( ).integer( ).required( ),
    project_id: Joi.number( ).integer( ),
    created_at: Joi.date( ),
    updated_at: Joi.date( ),
    role: Joi.string( ).valid( null ),
    observations_count: Joi.number( ).integer( ).required( ),
    taxa_count: Joi.number( ).integer( ),
    user: Joi.object( {
      id: Joi.number( ).integer( ).required( ),
      name: Joi.string( ).valid( null ),
      icon: Joi.string( ).valid( null ),
      login: Joi.string( ),
      icon_url: Joi.string( ).valid( null ),
      orcid: Joi.string( ).valid( null )
    } ).required( )
  } ) ).required( )
} ).unknown( false );
