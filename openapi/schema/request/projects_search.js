const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  page: Joi.number( ).integer( ),
  per_page: Joi.number( ).integer( )
} );
