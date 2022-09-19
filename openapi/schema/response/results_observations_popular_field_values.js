const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( ).keys( {
    count: Joi.number( ).integer( ).required( ),
    // TODO: do something more explicit here
    week_of_year: Joi.any( ),
    month_of_year: Joi.any( ),
    controlled_attribute: Joi.object( {
      id: Joi.number( ).integer( ),
      ontology_uri: Joi.string( ),
      uri: Joi.string( ),
      is_value: Joi.boolean( ),
      multivalued: Joi.boolean( ),
      // uuid: Joi.string( ).guid( { version: "uuidv4" } ),
      values: Joi.array( ).items( Joi.object( {
        id: Joi.number( ).integer( ),
        ontology_uri: Joi.string( ),
        uri: Joi.string( ),
        blocking: Joi.boolean( ),
        // uuid: Joi.string( ).guid( { version: "uuidv4" } ),
        taxon_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
        label: Joi.string( )
      } ).unknown( false ) ),
      taxon_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
      excepted_taxon_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
      label: Joi.string( )
    } ).unknown( false ),
    controlled_value: Joi.object( {
      id: Joi.number( ).integer( ),
      ontology_uri: Joi.string( ),
      uri: Joi.string( ),
      is_value: Joi.boolean( ),
      blocking: Joi.boolean( ),
      taxon_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
      label: Joi.string( ),
      values: Joi.array( )
    } ).unknown( false )
  } ).unknown( false ) ).required( ),
  unannotated: Joi.object( ).pattern( /^/, [
    Joi.object( {
      count: Joi.number( ).integer( ),
      month_of_year: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) )
    } ),
    Joi.object( {
      count: Joi.number( ).integer( ),
      week_of_year: Joi.object( ).pattern( /^/, Joi.number( ).integer( ) )
    } )
  ] ).unknown( false )
} ).unknown( false );
