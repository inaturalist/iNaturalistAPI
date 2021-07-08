const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  allowed_values: Joi.string( ).valid( null ),
  datatype: Joi.string( ),
  description: Joi.string( ),
  name: Joi.string( ),
  users_count: Joi.number( ).integer( ).valid( null ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  values_count: Joi.number( ).integer( ).valid( null )
} ).unknown( false ).meta( { className: "ObservationField" } );
