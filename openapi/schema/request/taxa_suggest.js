const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  featured_observation_id: Joi.string( ).guid( )
    .description( "When `source` is `observations`, ignore this observation" ),
  fields: Joi.any( ),
  limit: Joi.number( ).min( 0 ).description( "Number of results to return" ),
  lat: Joi.number( ).min( -90 ).max( 90 )
    .description( "Coordinate used when fetching nearby results `source` is `visual` or `*observations`" ),
  lng: Joi.number( ).min( -180 ).max( 180 )
    .description( "Coordinate used when fetching nearby results `source` is `visual` or `*observations`" ),
  locale: Joi.string( ),
  observation_id: Joi.string( ).guid( )
    .description( `
      Automatically set place and taxon filters based on this observation; this
      will override the values of \`place_id\` and \`taxon_id\` if these values
      can be derived from the observation
    `.replace( /\s+/m, " " ) ),
  observed_on: Joi.string( )
    .description( `
      Date the subject was observed (YYYY-MM-DD), used to refine suggestions to
      those observed at a similar time of year
    `.replace( /\s+/m, " " ) ),
  order_by: Joi.string( ).valid( "taxonomy", "default", "sciname" )
    .description( `
      How the suggestions will be ordered. The default is to order by whatever default
      a source uses, e.g. the score when \`source\` is \`visual\`, or the number of
      observations (frequency) when the \`source\` is \`*observations\`. Ordering by
      \`taxonomy\` will group the results by their closeness in the taxonomic
      tree, but continue to use default ordering for siblings (e.g. species in the
      same genus).
    `.replace( /\s+/m, " " ) ),
  place_id: Joi.number( ).integer( )
    .description( `
      Only retrieve suggestions from this place when \`source\` is \`checklist\`
      or \`*observations\`
    `.replace( /\s+/m, " " ) ),
  place_lat: Joi.number( ).min( -90 ).max( 90 )
    .description( `
      Coordinate used to set a place filter when source is \`*observations\` by
      choosing the place whose boundary contains the coordinate. Only chooses
      from places curated by staff (aka "standard" places) and only sets the
      place when lat, lng, and place_id are blank
    `.replace( /\s+/m, " " ) ),
  place_lng: Joi.number( ).min( -180 ).max( 180 ).description( "See `place_lat`" ),
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
      Only retrieve suggestions in this taxon. If taxon is below genus level it
      will be replaced with the genus that contains it. When \`source\` is
      \`misidentifications\`, suggestions will be species commonly misidentified
      as this taxon
    `.replace( /\s+/m, " " ) )
} );
