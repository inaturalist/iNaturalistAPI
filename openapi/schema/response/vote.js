const Joi = require( "@hapi/joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ),
  created_at: Joi.string( ),
  user,
  user_id: Joi.number( ).integer( ),
  vote_flag: Joi.boolean( ),
  vote_scope: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "Vote" } );
