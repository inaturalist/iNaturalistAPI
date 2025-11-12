const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier for the reference." )
    .required( ),
  id_summary_id: Joi.number( ).integer( )
    .description( "Parent IdSummary ID." )
    .required( ),
  reference_uuid: Joi.string( ).allow( null )
    .description( "External UUID for the referenced object (e.g. identification or comment), if available." ),
  reference_source: Joi.string( ).allow( null )
    .description( "Origin of the reference, e.g. 'observation' or 'identification'." ),
  reference_date: Joi.string( ).isoDate( ).allow( null )
    .description( "When the referenced content was created, if known." ),
  reference_content: Joi.string( ).allow( null )
    .description( "Captured text from the referenced content (e.g. a comment body)." ),
  user_id: Joi.number( ).integer( ).allow( null )
    .description( "User ID associated with the reference, if any." ),
  user_login: Joi.string( ).allow( null )
    .description( "User login associated with the reference, if any." ),
  created_at: Joi.string( ).isoDate( ).allow( null )
    .description( "Record creation time (UTC)." ),
  updated_at: Joi.string( ).isoDate( ).allow( null )
    .description( "Last update time (UTC)." )
} ).unknown( false ).meta( { className: "IdSummaryReference" } );
