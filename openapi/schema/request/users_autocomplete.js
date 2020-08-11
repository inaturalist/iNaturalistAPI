const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  per_page: Joi.number( ).integer( )
} );
