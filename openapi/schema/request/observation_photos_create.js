const Joi = require( "joi" );

module.exports = Joi.object( )
  .keys( {
    fields: Joi.any( ),
    observation_photo: Joi.object( ).keys( {
      observation_id: Joi.string( ).guid( ).required( )
        .description( "UUID for the existing observation" ),
      photo_id: Joi.number( ).integer( )
        .description( "Sequential ID for the existing photo" ),
      uuid: Joi.string( ).guid( { version: "uuidv4" } )
        .description(
          "New UUID for the photo, helps prevent duplication in poor network conditions"
        )
    } )
  } )
  .description( "description inside of schema file" )
  .unknown( true );
