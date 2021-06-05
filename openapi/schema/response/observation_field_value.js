const Joi = require( "@hapi/joi" );
const observationField = require( "./observation_field" );
const user = require( "./user" );
const taxon = require( "./taxon" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ),
  field_id: Joi.number( ).integer( ),
  observation_field: observationField,
  taxon,
  taxon_id: Joi.string( ),
  user,
  user_id: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  value: Joi.string( )
} ).unknown( false ).meta( { className: "ObservationFieldValue" } );
