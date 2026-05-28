const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  newer_than: Joi.number( ).integer( ).description( "Include posts newer than the post with this ID" ),
  older_than: Joi.number( ).integer( ).description( "Include posts older than the post with this ID" ),
  page: Joi.number( ).integer( ).min( 1 ).default( 1 ),
  per_page: Joi.number( ).integer( ).min( 1 ).max( 200 )
    .default( 30 )
} );
