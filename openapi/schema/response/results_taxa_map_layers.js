const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( )
      .description( "Unique auto-increment integer identifier." )
      .required( ),
    ranges: Joi.boolean( ).required( ),
    gbif_id: Joi.number( ).integer( ).valid( null ).required( ),
    listed_places: Joi.boolean( ).required( ),
    geomodel: Joi.boolean( ).required( )
  } ) ).required( )
} ).unknown( false );
