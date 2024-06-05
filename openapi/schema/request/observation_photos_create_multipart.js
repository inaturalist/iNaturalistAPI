const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  "observation_photo[observation_id]": Joi.string( ).guid( ).required( )
    .description( "UUID for the existing observation" ),
  "observation_photo[uuid]": Joi.string( ).guid( { version: "uuidv4" } )
    .description(
      "New UUID for the photo, helps prevent duplication in poor network conditions"
    ),
  "observation_photo[position]": Joi.number( ).integer( ),
  file: Joi.binary( ).required( )
} ).unknown( true );
