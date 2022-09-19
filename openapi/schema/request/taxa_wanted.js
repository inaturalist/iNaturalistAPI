const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( )
} );
