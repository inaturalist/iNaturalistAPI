const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.string( ).label( "fields" ).meta( { in: "query" } ),
  taxon_id: Joi.array( ).items( Joi.string( ) )
    .description( "ID taxa must match the given taxa or their descendants" ),
  quality_grade: Joi.array( ).items( Joi.string( ).valid(
    "research",
    "needs_id",
    "casual"
  ) ).description(
    "Observation must have this quality grade"
  )
} ).unknown( false );
