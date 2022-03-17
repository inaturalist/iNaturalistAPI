const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  project_observation: Joi.object( ).keys( {
    project_id: Joi.number( ).integer( ).min( 1 ).required( ),
    observation_id: Joi.string( ).guid( ).required( )
  } )
} );
