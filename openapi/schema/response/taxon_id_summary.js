const Joi = require( "joi" );
const idSummary = require( "./id_summary" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
    .description( "Stable UUID for this taxon_id_summary." )
    .required( ),
  active: Joi.boolean( )
    .description( "Whether this summary is the active one for its taxon." )
    .required( ),
  taxon_id: Joi.number( ).integer( )
    .description( "Taxon ID this summary." )
    .required( ),
  taxon_name: Joi.string( )
    .description( "Scientific name." )
    .required( ),
  taxon_common_name: Joi.string( ).allow( null )
    .description( "Common name, if available." ),
  taxon_photo_id: Joi.number( ).integer( ).allow( null )
    .description( "Photo ID for the taxon" ),
  taxon_photo_attribution: Joi.string( ).allow( null )
    .description( "Attribution text from the associated photo." ),
  taxon_photo_observation_id: Joi.number( ).integer( ).allow( null )
    .description( "Observation ID associated with the taxon photo, when the photo comes from an observation." ),
  taxon_group: Joi.string( ).allow( null )
    .description( "Iconic taxon group, if available." ),
  language: Joi.string( ).allow( null )
    .description( "ISO language code for the summary content." ),
  run_name: Joi.string( ).allow( null )
    .description( "Label for the run that produced this summary." ),
  run_generated_at: Joi.string( ).isoDate( ).allow( null )
    .description( "Timestamp when the run generated this content." ),
  run_description: Joi.string( ).allow( null )
    .description( "Free-text description about the run." ),
  created_at: Joi.string( ).isoDate( )
    .description( "Record creation time (UTC)." )
    .required( ),
  updated_at: Joi.string( ).isoDate( )
    .description( "Last update time (UTC)." )
    .required( ),

  id_summaries: Joi.array( ).items( idSummary ).default( [] )
    .description( "Child IdSummaries for this taxon, each with optional supporting references." )
} ).unknown( false ).meta( { className: "TaxonIdSummary" } );
