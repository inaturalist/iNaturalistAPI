const Joi = require( "joi" );
const place = require( "./place" );
const project = require( "./project" );
const taxon = require( "./taxon" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  score: Joi.number( ),
  type: Joi.string( ).required( ),
  matches: Joi.array( ).items( Joi.string( ) ),
  place: place.unknown( true ),
  project: project.unknown( true ),
  taxon: taxon.unknown( true ),
  user: user.unknown( true )
} ).unknown( true );
