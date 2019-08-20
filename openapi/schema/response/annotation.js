const Joi = require( "@hapi/joi" );
const controlledTerm = require( "./controlled_term" );
const user = require( "./user" );
const vote = require( "./vote" );

module.exports = Joi.object( ).keys( {
  concatenated_attr_val: Joi.string( ),
  controlled_attribute: controlledTerm,
  controlled_attribute_id: Joi.number( ).integer( ),
  controlled_value: controlledTerm,
  controlled_value_id: Joi.number( ).integer( ),
  user,
  user_id: Joi.number( ).integer( ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).required( ),
  vote_score: Joi.number( ).integer( ),
  votes: Joi.array( ).items( vote )
} ).unknown( false ).meta( { className: "Annotation" } );
