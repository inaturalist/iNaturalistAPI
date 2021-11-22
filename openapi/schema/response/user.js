const Joi = require( "joi" );
const site = require( "./site" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  // TODO make this required when we've added taxon.uuid to the ident index
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  activity_count: Joi.number( ).integer( ),
  blocked_user_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  created_at: Joi.string( ),
  description: Joi.string( ).valid( null ),
  email: Joi.string( ).valid( null ),
  icon: Joi.string( ).valid( null ),
  icon_url: Joi.string( ).valid( null ),
  identifications_count: Joi.number( ).integer( ),
  journal_posts_count: Joi.number( ).integer( ),
  locale: Joi.string( ).valid( null ),
  login: Joi.string( ),
  login_autocomplete: Joi.string( ),
  login_exact: Joi.string( ),
  monthly_supporter: Joi.boolean( ).valid( null ),
  muted_user_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  name: Joi.string( ).valid( null ),
  name_autocomplete: Joi.string( ).valid( null ),
  observations_count: Joi.number( ).integer( ),
  orcid: Joi.string( ).valid( null ),
  place_id: Joi.number( ).integer( ).valid( null ),
  preferences: Joi.object( ).keys( {
    prefers_community_taxa: Joi.boolean( ),
    prefers_observation_fields_by: Joi.string( )
      .description( "Allows this kind of user to add observation field values to their observations" ),
    prefers_project_addition_by: Joi.string( )
      .description( "Allows this kind of user to add their observations to projects" ),
    prefers_common_names: Joi.boolean( )
      .description( "Prefers to view common names" ),
    prefers_scientific_name_first: Joi.boolean( )
      .description( "Prefers to view scientific names before common names" )
  } ).unknown( false ),
  prefers_automatic_taxonomic_changes: Joi.boolean( ).valid( null ),
  prefers_comment_email_notification: Joi.boolean( ).valid( null ),
  prefers_common_names: Joi.boolean( ).valid( null ),
  prefers_community_taxa: Joi.boolean( ).valid( null ),
  prefers_identification_email_notification: Joi.boolean( ).valid( null ),
  prefers_mention_email_notification: Joi.boolean( ).valid( null ),
  prefers_message_email_notification: Joi.boolean( ).valid( null ),
  prefers_monthly_supporter_badge: Joi.boolean( ).valid( null ),
  prefers_no_email: Joi.boolean( ).valid( null ),
  prefers_no_tracking: Joi.boolean( ).valid( null ),
  preferred_observation_fields_by: Joi.string( ).valid( null ),
  preferred_observation_license: Joi.string( ).valid( null ),
  preferred_photo_license: Joi.string( ).valid( null ),
  prefers_project_added_your_observation_email_notification: Joi.boolean( ).valid( null ),
  preferred_project_addition_by: Joi.string( ).valid( null ),
  prefers_project_curator_change_email_notification: Joi.boolean( ).valid( null ),
  prefers_project_journal_post_email_notification: Joi.boolean( ).valid( null ),
  prefers_receive_mentions: Joi.boolean( ).valid( null ),
  prefers_redundant_identification_notifications: Joi.boolean( ).valid( null ),
  prefers_scientific_name_first: Joi.boolean( ).valid( null ),
  preferred_sound_license: Joi.string( ).valid( null ),
  prefers_taxon_change_email_notification: Joi.boolean( ).valid( null ),
  prefers_taxon_or_place_observation_email_notification: Joi.boolean( ).valid( null ),
  prefers_user_observation_email_notification: Joi.boolean( ).valid( null ),
  privileges: Joi.array( ).items( Joi.string( ) ).valid( null ),
  roles: Joi.array( ).items( Joi.string( ) ),
  search_place_id: Joi.number( ).integer( ).valid( null ),
  site: site.valid( null ),
  site_id: Joi.number( ).integer( ).valid( null ),
  spam: Joi.boolean( ),
  species_count: Joi.number( ).integer( ),
  suspended: Joi.boolean( ),
  time_zone: Joi.string( ).valid( null ),
  universal_search_rank: Joi.number( ).integer( ),
  updated_at: Joi.string( )
} ).unknown( false ).meta( { className: "User" } );
