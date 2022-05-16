const Joi = require( "joi" );
const place = require( "./place" );
const project = require( "./project" );
const taxon = require( "./taxon" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  score: Joi.number( ).description( "Search score; can be used to sort search results" ),
  type: Joi
    .string( )
    .required( )
    .valid(
      "place",
      "project",
      "taxon",
      "user"
    )
    .example( "place" )
    .description( "Type of record for this search result" ),
  matches: Joi
    .array( )
    .items( Joi.string( ) )
    .description( "Array of text field values that matched the search query" ),
  place: place.unknown( true ).description( "Place record for a place result" ),
  project: project.unknown( true ).description( "Project record for a project result" ),
  taxon: taxon.unknown( true ).description( "Taxon record for a taxon result" ),
  user: user.unknown( true ).description( "User record for a user result" )
} ).unknown( true );
