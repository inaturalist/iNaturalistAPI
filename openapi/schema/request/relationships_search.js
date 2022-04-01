const Joi = require( "joi" );

const yesNoAny = Joi.string( ).valid(
  "yes",
  "no",
  "any"
);

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  trusted: yesNoAny.description( "Whether or not the user trusts the friend with hidden coordinates." ),
  following: yesNoAny.description( "Whether or not the user wants to see updates about new content from the friend." ),
  order: Joi.string( ).valid(
    "desc",
    "asc"
  ),
  order_by: Joi.string( ).valid(
    "date",
    "user"
  ),
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
    .example( "all" )
} );
