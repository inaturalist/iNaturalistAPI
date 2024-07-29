const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ).required( ),
  user_id: Joi.number( ).integer( ),
  latitude: Joi.number( ),
  longitude: Joi.number( ),
  title: Joi.string( ),
  positional_accuracy: Joi.number( ).integer( ),
  created_at: Joi.date( ),
  updated_at: Joi.date( ),
  geoprivacy: Joi.string( ).valid( "open", "obscured", "private" ).valid( null )
} ).unknown( false ).meta( { className: "SavedLocation" } );
