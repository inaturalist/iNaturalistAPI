const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  project_observation: Joi.object( ).keys( {
    prefers_curator_coordinate_access: Joi
      .boolean( )
      .description( "Whether the observer allows project curators to view the coordinates of this observation" )
  } )
} );
