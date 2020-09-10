const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  prefers_hide_obs_show_identifiers: Joi.boolean( )
} );
