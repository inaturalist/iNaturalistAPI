const Joi = require( "@hapi/joi" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const moderatorAction = require( "./moderator_action" );
const taxon = require( "./taxon" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  body: Joi.string( ).valid( null ),
  category: Joi.string( ).valid( null ),
  created_at: Joi.string( ),
  created_at_details: dateDetails,
  current: Joi.boolean( ),
  disagreement: Joi.boolean( ).valid( null ),
  flags: Joi.array( ).items( flag ),
  moderator_actions: Joi.array( ).items( moderatorAction ),
  own_observation: Joi.boolean( ),
  previous_observation_taxon_id: Joi.number( ).integer( ).valid( null ),
  previous_observation_taxon: taxon,
  spam: Joi.boolean( ),
  taxon,
  taxon_change: Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    type: Joi.string( ).required( )
  } ).unknown( false ).valid( null ),
  taxon_id: Joi.number( ).integer( ),
  user,
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  vision: Joi.boolean( )
} ).unknown( false ).meta( { className: "Identification" } );
