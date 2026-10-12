const Joi = require( "joi" );

// Keys are dynamic Flipper names
module.exports = Joi.object( ).keys( {
  flags: Joi.object( ).pattern( /^/, Joi.boolean( ) ).required( ),
  experiments: Joi.object( ).pattern( /^/, Joi.string( ).valid( null ) ).required( )
} ).unknown( false );
