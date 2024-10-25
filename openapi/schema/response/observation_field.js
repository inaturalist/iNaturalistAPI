const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  allowed_values: Joi.string( ).valid( null ),
  datatype: Joi.string( ),
  description: Joi.string( ).valid( null ),
  description_autocomplete: Joi.string( ).valid( null ),
  name: Joi.string( ),
  name_autocomplete: Joi.string( ),
  users_count: Joi.number( ).integer( ).valid( null ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  values_count: Joi.number( ).integer( ).valid( null )
} ).unknown( false ).meta( { className: "ObservationField" } );
