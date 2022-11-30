const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .example( 1 )
    .required( ),
  icon_url: Joi.string( ).uri( )
    .description( "URL of an icon image for the site" )
    .example( "https://static.inaturalist.org/sites/1-logo_square.png" ),
  locale: Joi.string( ).valid( null )
    .description( "Default language code for users of this site" )
    .example( "en" ),
  name: Joi.string( ).description( "Full name of the site" ).example( "iNaturalist" ),
  place_id: Joi.number( ).integer( ).valid( null )
    .description( "Integer ID of the default search place for this site" ),
  site_name_short: Joi.string( ).valid( null )
    .description( "Short name for this site" )
    .example( "iNat" ),
  url: Joi.string( ).uri( ).example( "https://www.inaturalist.org" )
} ).unknown( false ).meta( { className: "Site" } );
