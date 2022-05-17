const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  user: Joi.object( ).keys( {
    data_transfer_consent: Joi.boolean( ).valid( true, null )
      .description( `
        Whether the user consents to the transfer of their personal
        information to the United States. The only way to revoke this consent
        is to delete the account.
      ` ),
    description: Joi.string( ),
    email: Joi.string( ),
    locale: Joi.string( ),
    login: Joi.string( ),
    make_observation_licenses_same: Joi
      .boolean( )
      .description(
        "Whether a change to `preferred_observation_license` should be apply to "
        + "all the user's existing observations"
      ),
    make_photo_licenses_same: Joi
      .boolean( )
      .description(
        "Whether a change to `preferred_photo_license` should be apply to "
        + "all the user's existing photos"
      ),
    make_sound_licenses_same: Joi
      .boolean( )
      .description(
        "Whether a change to `preferred_sound_license` should be apply to "
        + "all the user's existing sounds"
      ),
    name: Joi.string( ),
    pi_consent: Joi.boolean( ).valid( true, null )
      .description( `
        Whether the user consents to the storage of their personal
        information. The only way to revoke this consent is to delete the
        account.
      ` ),
    place_id: Joi.number( ).integer( )
      .description( "ID of place for localizing common names" ),
    prefers_automatic_taxonomic_changes: Joi.boolean( ),
    prefers_comment_email_notification: Joi.boolean( ),
    prefers_common_names: Joi.boolean( ),
    prefers_community_taxa: Joi.boolean( ),
    prefers_identification_email_notification: Joi.boolean( ),
    prefers_mention_email_notification: Joi.boolean( ),
    prefers_message_email_notification: Joi.boolean( ),
    prefers_monthly_supporter_badge: Joi.boolean( ),
    prefers_no_email: Joi.boolean( ),
    prefers_no_tracking: Joi.boolean( ),
    prefers_project_added_your_observation_email_notification: Joi.boolean( ),
    prefers_project_curator_change_email_notification: Joi.boolean( ),
    prefers_project_journal_post_email_notification: Joi.boolean( ),
    prefers_receive_mentions: Joi.boolean( ),
    prefers_redundant_identification_notifications: Joi.boolean( ),
    prefers_scientific_name_first: Joi.boolean( ),
    prefers_taxon_change_email_notification: Joi.boolean( ),
    prefers_taxon_or_place_observation_email_notification: Joi.boolean( ),
    prefers_user_observation_email_notification: Joi.boolean( ),
    preferred_observation_fields_by: Joi.string( ),
    preferred_observation_license: Joi.string( ),
    preferred_photo_license: Joi.string( ),
    preferred_project_addition_by: Joi.string( ),
    preferred_sound_license: Joi.string( ),
    search_place_id: Joi.number( ).integer( )
      .description( "ID of place for default observation searches" ),
    site_id: Joi.number( ).integer( ),
    time_zone: Joi.string( )
  } ),
  icon_delete: Joi.boolean( )
} );
