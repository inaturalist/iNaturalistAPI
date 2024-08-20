const Joi = require( "joi" );
const taxon = require( "./taxon" );

module.exports = Joi.object( ).keys( {
  score: Joi.number( ).min( 0 ).max( 100 ).description( `
    Common ancestor scores are not directly comparable to the combined_score
    of results. Generally they are similar, factoring in both vision and spatial
    similarity, but are derived from a subset of the top results resulting in
    a value different than combined_score. Usually the common ancestor score
    will be above 70 as taxa need to have a high confidence in order to be
    considered a likely common ancestor.
  `.replace( /\s+/m, " " ) ),
  taxon: taxon.required( )
} ).description( `
  Common ancestor taxon of some of the top results weighted by combined score.
  If present, it generally has a much higher chance of being accurate (if not
  precise), often by as much as 30-40 percentage points.
`.replace( /\s+/m, " " ) ).meta( { className: "CommonAncestor" } );
