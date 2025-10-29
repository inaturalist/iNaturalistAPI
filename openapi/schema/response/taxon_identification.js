const Joi = require( "joi" );
const annotation = require( "./annotation" );
const photo = require( "./photo" );
const vote = require( "./vote" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  identification: Joi.object( ).keys( {
    uuid: Joi.string( ).guid( { version: "uuidv4" } ).required( ),
    body: Joi.string( ).valid( null ),
    created_at: Joi.string( ),
    observation: Joi.object( {
      id: Joi.number( ).integer( ),
      discussion_count: Joi.number( ).integer( ),
      annotations: Joi.array( ).items( annotation ),
      photos: Joi.array( ).items( photo )
    } ),
    user: Joi.object( {
      id: Joi.number( ).integer( ),
      login: Joi.string( ),
      name: Joi.string( ).valid( null ),
      icon: Joi.string( ).valid( null )
    } )
  } ),
  nominated_by_user: Joi.object( {
    id: Joi.number( ).integer( ),
    login: Joi.string( ),
    name: Joi.string( ).valid( null ),
    icon: Joi.string( ).valid( null )
  } ).valid( null ),
  nominated_at: Joi.string( ).valid( null ),
  votes: Joi.array( ).items( vote ),
  cached_votes_total: Joi.number( ).integer( )
} ).unknown( true ).meta( { className: "TaxonIdentification" } )
  .valid( null );
