const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  inat_site_id: Joi.number( ).integer( ).min( 1 )
} );
