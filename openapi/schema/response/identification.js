const Joi = require( "joi" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );
const taxon = require( "./taxon" );
const user = require( "./user" );
const vote = require( "./vote" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  body: Joi.string( ).valid( null ),
  category: Joi.string( ).valid( null ),
  created_at: Joi.date( ),
  created_at_details: dateDetails,
  current: Joi.boolean( ),
  disagreement: Joi.boolean( ).valid( null ),
  exemplar_identification: Joi.object( ).keys( {
    id: Joi.number( ).integer( )
      .description( "Unique auto-increment integer identifier." )
      .required( ),
    nominated_by_user: Joi.object( {
      id: Joi.number( ).integer( ),
      login: Joi.string( ),
      name: Joi.string( ).valid( null ),
      icon: Joi.string( ).valid( null )
    } ).valid( null ),
    nominated_at: Joi.string( ).valid( null ),
    votes: Joi.array( ).items( vote ),
    cached_votes_total: Joi.number( ).integer( )
  } ).valid( null ),
  flags: Joi.array( ).items( flag ),
  hidden: Joi.boolean( ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  observation_id: Joi.number( ).integer( ),
  own_observation: Joi.boolean( ),
  previous_observation_taxon_id: Joi.number( ).integer( ).valid( null ),
  previous_observation_taxon: taxon,
  spam: Joi.boolean( ),
  taxon,
  taxon_change: Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    type: Joi.string( ).required( )
  } ).unknown( false ).valid( null ),
  taxon_change_id: Joi.number( ).integer( ).valid( null ),
  taxon_change_type: Joi.string( ).valid( null ),
  taxon_id: Joi.number( ).integer( ),
  updated_at: Joi.date( ),
  user,
  user_id: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  vision: Joi.boolean( )
} ).unknown( false ).meta( { className: "Identification" } );
