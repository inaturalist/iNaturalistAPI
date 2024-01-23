const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  observations_count: Joi.number( ).integer( ),
  prefers_curator_coordinate_access_for: Joi.string( ),
  project_id: Joi.number( ).integer( ),
  role: Joi.string( ).valid( null ),
  taxa_count: Joi.number( ).integer( ),
  user_id: Joi.number( ).integer( ),
  created_at: Joi.string( ).isoDate( ),
  created_at_utc: Joi.date( ),
  updated_at: Joi.string( ).isoDate( ),
  updated_at_utc: Joi.date( )
} ).unknown( false ).meta( { className: "ProjectUser" } );
