const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ).description( "Search query" ),
  locale: Joi.string( ),
  place_id: Joi
    .number( )
    .integer( )
    .description( "Integer ID for a place associated with results; only works for projects" ),
  preferred_place_id: Joi
    .number( )
    .integer( )
    .description( "Localizes some response values for the given place" ),
  sources: Joi
    .array( )
    .items(
      Joi.string( ).valid(
        "places",
        "projects",
        "taxa",
        "users"
      )
    ).description( "Filters search results by record types. Can be specified as an array or a comma-separated list of values" ),
  include_taxon_ancestors: Joi.boolean( ).default( false ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
    .example( "species_guess,observed_on" )
    .default( "place,project,taxon,user" )
} );
