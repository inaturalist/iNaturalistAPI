const Joi = require( "joi" );

// Keys are dynamic (whatever admins create in Flipper), so both maps are
// declared with additionalProperties rather than an enumerated key list. A
// missing key means the flag is off / the actor is not enrolled.
module.exports = Joi.object( ).keys( {
  flags: Joi.object( ).pattern( /^/, Joi.boolean( ) ).required( ),
  experiments: Joi.object( ).pattern( /^/, Joi.string( ).valid( null ) ).required( )
} ).unknown( false );
