const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  featured_observation_id: Joi.string( ).guid( )
    .description( "When `source` is `observations`, ignore this observation" ),
  fields: Joi.any( ),
  image_url: Joi.string( ).uri( ).description( "URL for image to use when `source` is `visual`" ),
  lat: Joi.number( ).min( -90 ).max( 90 )
    .description( "Coordinate used when fetching nearby results `source` is `visual` or `*observations`" ),
  lng: Joi.number( ).min( -180 ).max( 180 )
    .description( "Coordinate used when fetching nearby results `source` is `visual` or `*observations`" ),
  locale: Joi.string( ),
  observation_id: Joi.string( ).guid( )
    .description( "Automatically set place and taxon filters based on this observation" ),
  order_by: Joi.string( ).valid( "taxonomy", "default" )
    .description( `
      How the suggestions will be ordered. The default is to order by whatever default
      a source uses, e.g. the score when \`source\` is \`visual\`, or the number of
      observations (frequency) when the \`source\` is \`*observations\`. Ordering by
      \`taxonomy\` will group the results by their closeness in the taxonomic
      tree, but continue to use default ordering for siblings (e.g. species in the
      same genus).
    `.replace( /\s+/m, " " ) ),
  place_id: Joi.number( ).integer( )
    .description( "Only retrieve suggestions from this place when `source` is `checklist` or `*observations`" ),
  source: Joi.string( )
    .valid(
      "captive_observations",
      "checklist",
      "misidentifications",
      "observations",
      "rg_observations",
      "visual",
      null
    ).description( `
      Source of the suggestions. Note that different sources support different
      search parameters. See each parameter for details
    `.replace( /\s+/m, " " ) ),
  taxon_id: Joi.number( ).integer( )
    .description( `
      Only retrieve suggestions in this taxon. When \`source\` is
      \`misidentifications\`, suggestions will be species commonly misidentified
      as this taxon
    `.replace( /\s+/m, " " ) )
} );
