const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ),
  icon_url: Joi.string( ),
  locale: Joi.string( ).valid( null ),
  name: Joi.string( ),
  place_id: Joi.number( ).integer( ).valid( null ),
  site_name_short: Joi.string( ),
  url: Joi.string( )
} ).unknown( false ).meta( { className: "Site" } );
