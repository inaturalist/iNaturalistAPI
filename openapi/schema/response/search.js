const Joi = require( "joi" );
const place = require( "./place" );
const project = require( "./project" );
const taxon = require( "./taxon" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  score: Joi.number( ),
  type: Joi.string( ),
  matches: Joi.array( ).items( Joi.string( ) ),
  // TODO: try to use OpenAPI discriminators to get per-type validation working
  record: Joi.any( )
} ).unknown( true );
