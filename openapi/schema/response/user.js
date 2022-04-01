const Joi = require( "joi" );
const site = require( "./site" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  // TODO make this required when we've added taxon.uuid to the ident index
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  created_at: Joi.string( ).isoDate( ),
  description: Joi.string( ).valid( null ),
  icon: Joi.string( ).valid( null ),
  identifications_count: Joi.number( ).integer( ),
  journal_posts_count: Joi.number( ).integer( ),
  last_active: Joi.date( ).iso( ),
  login: Joi.string( ),
  monthly_supporter: Joi.boolean( ).valid( null ),
  name: Joi.string( ).valid( null ),
  observations_count: Joi.number( ).integer( ),
  orcid: Joi.string( ).valid( null ),
  preferences: Joi.object( ).keys( {
    prefers_community_taxa: Joi.boolean( )
      .description( `
        Whether the user allows the Community Taxon to be the taxon their observation is associated with
      ` ),
    prefers_observation_fields_by: Joi.string( ).valid(
      "anyone",
      "curators",
      "observer"
    ),
    prefers_project_addition_by: Joi.string( ).valid(
      "any",
      "joined",
      "none"
    )
  } ),
  roles: Joi.array( ).items( Joi.string( ) ),
  site: site.valid( null ),
  site_id: Joi.number( ).integer( ).valid( null ),
  spam: Joi.boolean( ),
  species_count: Joi.number( ).integer( ),
  suspended: Joi.boolean( ),
  updated_at: Joi.string( ).isoDate( )
} ).unknown( false )
  .meta( { className: "User" } )
  .valid( null );
