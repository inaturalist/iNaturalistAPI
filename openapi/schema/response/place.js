const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  admin_level: Joi.number( ).integer( ).valid( null ),
  ancestor_place_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ),
  display_name: Joi.string( ),
  name: Joi.string( ),
  place_type: Joi.number( ).integer( ).valid( null ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } )
} ).unknown( false ).meta( { className: "Place" } )
  .valid( null );
