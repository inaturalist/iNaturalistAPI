const Joi = require( "joi" ).extend( require( "@joi/date" ) );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  since: Joi.date( ).format( "YYYY-MM-DD" ).required( )
} );
