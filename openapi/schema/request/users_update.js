const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  user: Joi.object( ).keys( {
    login: Joi.string( ),
    email: Joi.string( ),
    name: Joi.string( ),
    site_id: Joi.number( ).integer( ),
    description: Joi.string( ),
    time_zone: Joi.string( ),
    locale: Joi.string( ),
    pi_consent: Joi.boolean( ).valid( true, null )
      .description( `
        Whether the user consents to the storage of their personal
        information. The only way to revoke this consent is to delete the
        account.
      ` ),
    data_transfer_consent: Joi.boolean( ).valid( true, null )
      .description( `
        Whether the user consents to the transfer of their personal
        information to the United States. The only way to revoke this consent
        is to delete the account.
      ` ),
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
    monthly_supporter: Joi.boolean( )
  } ),
  icon_delete: Joi.boolean( )
} );
