const Joi = require( "@hapi/joi" );
const taxon = require( "./taxon" );
const listedTaxon = require( "./listed_taxon" );

module.exports = Joi.object( ).keys( {
  comprehensiveness: Joi.object( )
    .keys( {
      list: Joi.object( )
        .keys( {
          id: Joi.number( ).integer( )
            .description( "Unique auto-increment integer identifier." )
            .required( ),
          title: Joi.string( ),
          url: Joi.string( ).uri( ),
          in_text: Joi.string( )
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
  results: Joi.array( ).items( Joi.object( ).keys( {
    sourceType: Joi.string( ).required( ),
    score: Joi.number( ).required( ),
    sourceDetails: Joi.object( ).keys( {
      combined_score: Joi.number( ),
      frequency_score: Joi.number( ),
      listed_taxon: listedTaxon,
      observations_count: Joi.number( ).integer( ),
      vision_score: Joi.number( )
    } ),
    taxon: taxon.required( )
  } ) ).required( ),
  query: Joi.object( )
    .description( `
      Query parameters used to generate these results. When \`source\` is
      \`*observations\` this may have some additional parameters used to set
      defaults for the observations query.
    `.replace( /\s+/m, " " ) )
} ).unknown( false );
