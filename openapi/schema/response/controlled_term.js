const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  blocking: Joi.boolean( ),
  is_value: Joi.boolean( ),
  excepted_taxon_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ),
  label: Joi.string( ),
  labels: Joi.array( ).items(
    Joi.object( ).keys( {
      id: Joi.number( ).integer( ),
      definition: Joi.string( ),
      label: Joi.string( ),
      locale: Joi.string( ),
      valid_within_clade: Joi.number( ).integer( ).valid( null )
    } ).unknown( false )
  ),
  multivalued: Joi.boolean( ),
  ontology_uri: Joi.string( ),
  taxon_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ),
  uri: Joi.string( ),
  valid_within_clade: Joi.number( ).integer( ).valid( null ),
  values: Joi.array( ).items(
    Joi.object( ).meta( { className: "ControlledTerm" } )
  )
} ).unknown( false ).meta( { className: "ControlledTerm" } )
  .valid( null );
