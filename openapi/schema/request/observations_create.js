const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation: Joi.object( ).unknown( true )
  // observation: Joi.object( ).keys( {
  //   species_guess: Joi.string( )
  //     .description( `
  //       The name of the organism observed. If the taxon ID is absent, iNat will
  //       try to choose a single taxon based on this string, but it may fail if
  //       there's some taxonomic amgiguity."
  //     ` ),
  //   taxon_uuid: Joi.string( ).guid( { version: "uuidv4" } )
  //     .description( `
  //       UUID of the taxon to associate with this observation. An identification
  //       for this taxon will automatically be added for the user.
  //     ` )
  // } )
} );
