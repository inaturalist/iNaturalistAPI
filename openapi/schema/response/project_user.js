const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  prefers_curator_coordinate_access_for: Joi.string( ),
  project_id: Joi.number( ).integer( ),
  role: Joi.string( ).valid( null ),
  user_id: Joi.number( ).integer( )
} ).unknown( false );
