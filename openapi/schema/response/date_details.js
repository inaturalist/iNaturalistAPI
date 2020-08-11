const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  date: Joi.string( ).required( ),
  day: Joi.number( ).integer( ).required( ),
  hour: Joi.number( ).integer( ).required( ),
  month: Joi.number( ).integer( ).required( ),
  week: Joi.number( ).integer( ).required( ),
  year: Joi.number( ).integer( ).required( )
} ).unknown( false ).meta( { className: "DateDetails" } )
  .valid( null );
