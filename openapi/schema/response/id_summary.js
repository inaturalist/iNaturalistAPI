const Joi = require( "joi" );
const idSummaryReference = require( "./id_summary_reference" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier for the IdSummary." )
    .required( ),
  taxon_id_summary_id: Joi.number( ).integer( )
    .description( "Parent TaxonIdSummary ID." )
    .required( ),
  summary: Joi.string( ).allow( null )
    .description( "Short human-readable identification summary text." ),
  visual_key_group: Joi.string( ).allow( null )
    .description( "Grouping label for the summary (e.g. 'Coloration', 'Shape')." ),
  score: Joi.number( ).allow( null )
    .description( "Overall score for the summary, if available." ),
  created_at: Joi.string( ).isoDate( ).allow( null )
    .description( "Record creation time (UTC)." ),
  updated_at: Joi.string( ).isoDate( ).allow( null )
    .description( "Last update time (UTC)." ),

  references: Joi.array( ).items( idSummaryReference ).default( [] )
    .description( "References (observations, identifications, comments, etc.) that support this summary." )
} ).unknown( false ).meta( { className: "IdSummary" } );
