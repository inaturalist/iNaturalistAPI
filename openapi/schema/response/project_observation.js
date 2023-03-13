const Joi = require( "joi" );
const project = require( "./project" );
const projectUser = require( "./project_user" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  preferences: Joi.object( ).keys( {
    allows_curator_coordinate_access: Joi.boolean( )
  } ),
  project,
  project_id: Joi.number( ).integer( ),
  project_user: projectUser,
  user,
  user_id: Joi.number( ).integer( ).valid( null ),
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).required( )
} ).unknown( false );
