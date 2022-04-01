const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ).example( "all" ),
  relationship: Joi.object( ).required( ).keys( {
    trust: Joi
      .boolean( )
      .default( false )
      .description( "Whether the user trusts the friend with hidden coordinates" ),
    following: Joi
      .boolean( )
      .default( true )
      .description( "Whether the user notifications about new content made by the friend" )
  } )
} );
