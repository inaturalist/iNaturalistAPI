const Joi = require( "joi" );
const user = require( "./user" );

module.exports = user.append( {
  activity_count: Joi.number( ).integer( ),
  blocked_user_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  data_transfer_consent: Joi.boolean( ).valid( true, null ),
  email: Joi.string( ).valid( null ),
  locale: Joi.string( ).valid( null ),
  login: Joi.string( ),
  muted_user_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  pi_consent: Joi.boolean( ).valid( true, null ),
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
  search_place_id: Joi.number( ).integer( ).valid( null ),
  time_zone: Joi.string( ).valid( null ),
  universal_search_rank: Joi.number( ).integer( )
} );
