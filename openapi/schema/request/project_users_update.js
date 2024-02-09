const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  project_user: Joi.object( ).keys( {
    prefers_curator_coordinate_access_for: Joi.string( ).valid(
      "none",
      "any",
      "taxon"
    ),
    prefers_updates: Joi.boolean( )
  } )
} );
