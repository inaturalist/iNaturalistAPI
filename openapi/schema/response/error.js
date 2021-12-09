const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  status: Joi.string( ).description( "Unique auto-increment integer identifier." ),
  errors: Joi.array( ).items(
    Joi.object( ).keys( {
      errorCode: Joi.string( ),
      message: Joi.string( ),
      from: Joi.string( ).valid( null ),
      stack: Joi.string( ).valid( null )
    } ).unknown( false )
  )
} ).unknown( false ).meta( { className: "Error" } );
