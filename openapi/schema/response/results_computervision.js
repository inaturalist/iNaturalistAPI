const Joi = require( "joi" );
const taxon = require( "./taxon" );
const commonAncestor = require( "./common_ancestor" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  common_ancestor: commonAncestor,
  experimental: Joi.string( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    combined_score: Joi.number( ).min( 0 ).max( 100 ).required( )
      .description( `
      Combination of the vision and frequency scores, i.e. a score that
      incorporates visual similarity and spatial similarity
    `.replace( /\s+/m, " " ) ),
    frequency_score: Joi.number( ).integer( ).valid( 0, 1 ).description( `
      This value used to be any float value between 0 and 1 reflecting a
      measure of spatial similarity to observations of this taxon.
      Currently frequency_score can only be 0 meaning the taxon is not expected
      nearby, or 1 meaning the taxon is expected to be nearby. These values
      are derived from the iNaturalist Geomodel trained on iNaturalist
      observation locations.
    `.replace( /\s+/m, " " ) ),
    vision_score: Joi.number( ).min( 0 ).max( 100 ).description( `
      Score based on the visual similarity of the provided photo to photos of
      taxa in the computer vision model.
    `.replace( /\s+/m, " " ) ),
    taxon: taxon.required( )
  } ) ).required( ).description( `
    Scores are provided without units and are intended for sorting the
    suggestions. One type of score is not necessarily comparable to another,
    e.g. a taxon with a vision_score of 30 should not necessarily be shown
    before one with a frequency_score of 1. None of the scores are probabilities of
    accuracy. Score ranges will vary from observation to observation (e.g. a
    result with combined_score of 80 for one observation is not equally as
    likely a result with the same score for a different observation). Within
    results for a single observation, scores reflect relative confidence. In a
    single response, a result with a combined score twice another result is
    more likely to be accurate, but not neseccarily exactly twice as likely.
  `.replace( /\s+/m, " " ) )
} ).unknown( false )
  .meta( { unpublished: true } );
