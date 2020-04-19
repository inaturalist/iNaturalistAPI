const Joi = require( "@hapi/joi" );
const place = require( "./place" );

module.exports = Joi.object( ).keys( {
  description: Joi.string( ).valid( null ),
  place,
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  created_at: Joi.string( ),
  updated_at: Joi.string( ),
  comments_count: Joi.number( ).integer( ),
  occurrence_status_level: Joi.number( ).integer( )
    .valid( null )
    .description(
      "Assessment of occurrence frequency in this place. 60 = present, "
      + "50 = common, 40 = uncommon, 30 = irregular, 20 = doubtful, "
      + "10 = absent"
    ),
  establishment_means: Joi.string( )
    .valid( "native", "endemic", "introduced" )
    .description( "How this taxon became established in this place" ),
  observations_count: Joi.number( ).integer( ),
  manually_added: Joi.boolean( )
    .description( "Whether this taxon was added to this list by a person or not" ),
  primary_listing: Joi.boolean( )
    .description( "Whether or not this is the primary listing for this taxon in this place (places can have multiple checklists that contain the same taxa)" ),
  establishment_means_label: Joi.string( )
    .description( "Localized version of the establishment means" ),
  establishment_means_description: Joi.string( )
    .description( "Localized description of the establishment means" )

} ).unknown( false ).meta( { className: "ListedTaxon" } )
  .valid( null );
