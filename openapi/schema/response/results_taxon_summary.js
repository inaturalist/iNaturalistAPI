const Joi = require( "@hapi/joi" );
const conservationStatus = require( "./conservation_status" );
const listedTaxon = require( "./listed_taxon" );

module.exports = Joi.object( ).keys( {
  conservation_status: conservationStatus,
  listed_taxon: listedTaxon,
  wikipedia_summary: Joi.string( )
    .description( "Summary description of this taxon from Wikipedia" )
    .valid( null )
} ).unknown( false );
