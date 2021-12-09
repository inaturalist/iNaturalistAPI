const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ).required( ),
  project_id: Joi.number( ).integer( ),
  role: Joi.string( ).valid( null ),
  created_at: Joi.date( ),
  updated_at: Joi.date( ),
  prefers_curator_coordinate_access_for: Joi.string( ).valid( null ),
  prefers_updates: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "ProjectMembership" } );
