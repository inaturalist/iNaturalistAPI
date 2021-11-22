const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  user_id: Joi.number( ).integer( ),
  resource_type: Joi.string( ),
  resource_id: Joi.number( ).integer( ),
  created_at: Joi.string( ),
  updated_at: Joi.string( ),
  taxon_id: Joi.number( ).integer( )
} );
