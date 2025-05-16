const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  q: Joi.string( ),
  include_suspended: Joi.boolean( ).default( false ),
  per_page: Joi.number( ).integer( ),
  fields: Joi.any( )
} );
