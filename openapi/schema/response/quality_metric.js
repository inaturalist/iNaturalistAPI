const Joi = require( "@hapi/joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  agree: Joi.boolean( ),
  metric: Joi.string( ),
  user,
  user_id: Joi.number( ).integer( ).valid( null )
} ).unknown( false ).meta( { className: "QualityMetric" } );
