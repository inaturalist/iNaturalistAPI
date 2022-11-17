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
    combined_score: Joi.number( ).required( ).description( `
      Combination of the vision and frequency scores, i.e. a score that
      incorporates visual similarity and spatio-temporal similarity
    `.replace( /\s+/m, " " ) ),
    frequency_score: Joi.number( ).description( `
      Score based on spatio-temporal similarity to observations of this taxon,
      i.e. a number based on the number of Research Grade observations of this
      taxon in the 3-degree lat/lng cell that contains this location and the 3
      month window that contains the date. The reference values for the location
      and date depend on what kind of record was used to generate the vision
      results, so if it was an observation they come from the observation, but
      if just a photo they will come from the photo's metadata. For example,
      when generating a frequency_score for an observation observed on 1 June,
      2020 at lat: 1, lng: 1, we would look at observations made in May, June,
      and July and where latitude and longitude are greater than 0 or less than
      3. 
    `.replace( /\s+/m, " " ) ),
    vision_score: Joi.number( ).description( `
      Score based on the visual similarity of the provided photo to photos of
      taxa in the computer vision model.
    `.replace( /\s+/m, " " ) ),
    taxon: taxon.required( )
  } ) ).required( ).description( `
    Scores are provided without units and are intended for sorting the
    suggestions. One type of score is not necessarily comparable to another,
    e.g. a taxon with a frequency_score of 3 should not necessarily be shown
    before one with a vision_score of 1. None of the scores are probabilities of
    accuracy or measures of confidence.
  `.replace( /\s+/m, " " ) )
} ).unknown( false );
