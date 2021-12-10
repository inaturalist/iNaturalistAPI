const Joi = require( "joi" );
const message = require( "./message" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( message ).required( ),
  thread_id: Joi.number( ).integer( ),
  flaggable_message_id: Joi.number( ).integer( ),
  reply_to_user: user
} ).unknown( false );
