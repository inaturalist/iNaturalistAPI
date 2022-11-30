const Joi = require( "joi" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ),
  page: Joi.number( ).integer( ).required( ),
  per_page: Joi.number( ).integer( ).required( ),
  results: Joi.array( ).items( Joi.object( {
    id: Joi.number( ).integer( ),
    parent_id: Joi.number( ).integer( ),
    parent_type: Joi.string( ).valid(
      "Project"
    ),
    published_at: Joi.date( ),
    title: Joi.string( ),
    body: Joi.string( ),
    created_at: Joi.date( ),
    updated_at: Joi.date( ),
    type: Joi.string( ).valid( null ),
    start_time: Joi.date( ).valid( null ),
    stop_time: Joi.date( ).valid( null ),
    place_id: Joi.number( ).integer( ).valid( null ),
    latitude: Joi.number( ).valid( null ),
    longitude: Joi.number( ).valid( null ),
    radius: Joi.number( ).valid( null ),
    distance: Joi.number( ).valid( null ),
    uuid: Joi.string( ).guid( { version: "uuidv4" } ).valid( null ),
    user
  } ) ).required( )
} ).unknown( false );
