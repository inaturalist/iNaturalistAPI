const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  fields: Joi.any( ),
  observation: Joi.object( ).keys( {
    uuid: Joi.string( ).guid( { version: "uuidv4" } ),
    captive_flag: Joi.boolean( ),
    coordinate_system: Joi.string( ),
    description: Joi.string( ),
    geo_x: Joi.number( ),
    geo_y: Joi.number( ),
    geoprivacy: Joi.string( ),
    latitude: Joi.number( ),
    license: Joi.string( ),
    location_is_exact: Joi.boolean( ),
    longitude: Joi.number( ),
    make_license_default: Joi.boolean( ),
    make_licenses_same: Joi.boolean( ),
    map_scale: Joi.number( ).integer( ),
    observation_field_values_attributes: Joi.object( ).keys( {
      observation_field_id: Joi.number( ).integer( ).required( ),
      value: Joi.any( ).required( )
    } ).unknown( false ),
    observed_on_string: Joi.string( ),
    owners_identification_from_vision: Joi.boolean( ),
    place_guess: Joi.string( ),
    positional_accuracy: Joi.number( ),
    positioning_device: Joi.string( ),
    positioning_method: Joi.string( ),
    project_id: Joi.number( ).integer( ),
    prefers_community_taxon: Joi.boolean( ),
    site_id: Joi.number( ).integer( ),
    species_guess: Joi.string( )
      .description( "The name of the organism observed. If the taxon ID is absent, iNat will "
        + "try to choose a single taxon based on this string, but it may fail if "
        + "there's some taxonomic amgiguity." ),
    tag_list: Joi.string( ),
    taxon_id: Joi.number( ),
    taxon_name: Joi.number( ),
    time_zone: Joi.string( )
  } )
} );
