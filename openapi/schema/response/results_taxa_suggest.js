const Joi = require( "joi" );
const commonAncestor = require( "./common_ancestor" );
const place = require( "./place" );
const taxon = require( "./taxon" );
const listedTaxon = require( "./listed_taxon" );
const suggestRequest = require( "../request/taxa_suggest" );

module.exports = Joi.object( ).keys( {
  comprehensiveness: Joi.object( )
    .keys( {
      list: Joi.object( )
        .keys( {
          id: Joi.number( ).integer( )
            .description( "Unique auto-increment integer identifier." )
            .required( ),
          title: Joi.string( ),
          source: Joi.object( ).keys( {
            url: Joi.string( ).uri( ),
            in_text: Joi.string( )
          } )
        } )
        .description( "Source of these comprehensive suggestions" )
    } )
    .description( `
      Set when the suggestions are believed to be comprehensive given the search
      parameters, e.g. if retrieving suggestions for squirrels in California,
      these should represent *all* the squirrels known to occur in California.
      If blank or absent, that means the suggestions may or may not be
      comprehensive. Currently only set when \`source\` is \`checklist\`
    `.replace( /\s+/m, " " ) ),
  common_ancestor: commonAncestor,
  results: Joi.array( ).items( Joi.object( ).keys( {
    source_type: Joi.string( ).required( ),
    score: Joi.number( ).required( ),
    source_details: Joi.object( ).keys( {
      combined_score: Joi.number( ),
      frequency_score: Joi.number( ),
      listed_taxon: listedTaxon,
      observations_count: Joi.number( ).integer( ),
      vision_score: Joi.number( )
    } ),
    taxon: taxon.required( )
  } ) ).required( ),
  query: suggestRequest
    .description( `
      Query parameters used to generate these results. When \`source\` is
      \`*observations\` this may have some additional parameters used to set
      defaults for the observations query.
    `.replace( /\s+/m, " " ) ),
  queryTaxon: taxon
    .description( "If query contains `taxon_id`, this is the corresponding taxon object" ),
  queryPlace: place
    .description( "If query contains `place_id`, this is the corresponding place object" )
} ).unknown( false );
