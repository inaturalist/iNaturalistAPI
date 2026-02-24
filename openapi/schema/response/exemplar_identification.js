const Joi = require( "joi" );
const annotation = require( "./annotation" );
const photo = require( "./photo" );
const vote = require( "./vote" );
const identification = require( "./identification" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  identification: identification.keys( {
    observation: Joi.object( {
      id: Joi.number( ).integer( ),
      discussion_count: Joi.number( ).integer( ),
      annotations: Joi.array( ).items( annotation ),
      photos: Joi.array( ).items( photo )
    } )
  } ).meta( { className: "ExemplarIdentificationIdentification" } ),
  nominated_by_user: Joi.object( {
    id: Joi.number( ).integer( ),
    login: Joi.string( ),
    name: Joi.string( ).valid( null ),
    icon: Joi.string( ).valid( null )
  } ).valid( null ),
  nominated_at: Joi.string( ).valid( null ),
  votes: Joi.array( ).items( vote ),
  cached_votes_total: Joi.number( ).integer( )
} ).unknown( true ).meta( { className: "ExemplarIdentification" } )
  .valid( null );
