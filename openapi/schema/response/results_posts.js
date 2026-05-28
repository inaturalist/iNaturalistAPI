const Joi = require( "joi" );
const post = require( "./post" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( post.keys( {
    parent: Joi.object( ).keys( {
      id: Joi.number( ).integer( ).required( ),
      name: Joi.string( ).valid( null ),
      title: Joi.string( ).valid( null ),
      icon_url: Joi.string( ).valid( null )
    } ).unknown( true )
  } ) ).required( )
} ).unknown( false );
