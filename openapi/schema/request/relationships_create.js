const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ).example( "all" ),
  relationship: Joi.object( ).required( ).keys( {
    friend_id: Joi
      .number( )
      .integer( )
      .min( 1 )
      .required( )
      .description( `
        Sequential ID of the user that is the object of the relationship, i.e.
        the user that the authenticated user is establishing a relationship
        with
      ` ),
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
