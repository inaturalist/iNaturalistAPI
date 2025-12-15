// openapi/schema/request/taxon_id_summaries_search.js
const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  // --- primary filters ---
  active: Joi.boolean( )
    .description( "Filter by active=true/false" ),
  taxon_group: Joi.alternatives( ).try(
    Joi.string( ),
    Joi.array( ).items( Joi.string( ) )
  ).description( "Group or groups; comma-separated in the query becomes an array here" ),
  run_name: Joi.string( )
    .description( "Case-insensitive contains match on run_name" ),
  language: Joi.alternatives( ).try(
    Joi.string( ),
    Joi.array( ).items( Joi.string( ) )
  ).description( "Filter by one or more ISO language codes" ),

  // --- IDs / names ---
  taxon_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Filter by one or more taxon IDs" ),
  taxon_name: Joi.string( )
    .description( "Case-insensitive contains match on taxon_name" ),

  // --- date filters ---
  // run_generated_at
  run_generated_on: Joi.string( )
    .description( "YYYY-MM-DD. Records on this date (UTC day bucket)" ),
  run_generated_d1: Joi.string( )
    .description( "ISO 8601. Records on/after this time" ),
  run_generated_d2: Joi.string( )
    .description( "ISO 8601. Records on/before this time" ),

  // created_at
  created_on: Joi.string( ),
  created_d1: Joi.string( ),
  created_d2: Joi.string( ),

  // updated_at
  updated_on: Joi.string( ),
  updated_d1: Joi.string( ),
  updated_d2: Joi.string( ),

  // --- pagination + sort ---
  page: Joi.number( ).integer( ).default( 1 ),
  per_page: Joi.number( ).integer( ).default( 30 )
    .description( "Max 200" ),
  order: Joi.string( ).valid( "desc", "asc" ).default( "desc" ),
  order_by: Joi.string( ).valid(
    "run_generated_at",
    "created_at",
    "updated_at",
    "taxon_id"
  ).default( "updated_at" ),

  // --- misc ---
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
} ).unknown( false );
