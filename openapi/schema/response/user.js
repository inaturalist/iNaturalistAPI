const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  // TODO make this required when we've added taxon.uuid to the ident index
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  activity_count: Joi.number( ).integer( ),
  created_at: Joi.string( ),
  icon: Joi.string( ).valid( null ),
  icon_url: Joi.string( ).valid( null ),
  identifications_count: Joi.number( ).integer( ),
  journal_posts_count: Joi.number( ).integer( ),
  login: Joi.string( ),
  login_autocomplete: Joi.string( ),
  login_exact: Joi.string( ),
  name: Joi.string( ).valid( null ),
  name_autocomplete: Joi.string( ).valid( null ),
  observations_count: Joi.number( ).integer( ),
  orcid: Joi.string( ).valid( null ),
  preferences: Joi.object( ).keys( {
    prefers_community_taxa: Joi.boolean( )
  } ).unknown( false ),
  roles: Joi.array( ).items( Joi.string( ) ),
  site_id: Joi.number( ).integer( ).valid( null ),
  spam: Joi.boolean( ),
  species_count: Joi.number( ).integer( ),
  suspended: Joi.boolean( ),
  universal_search_rank: Joi.number( ).integer( )
} ).unknown( false ).meta( { className: "User" } );
