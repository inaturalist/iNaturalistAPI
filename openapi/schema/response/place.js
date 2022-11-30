const Joi = require( "joi" );
const polygonGeojson = require( "./polygon_geo_json" );
const pointGeoJson = require( "./point_geo_json" );
const user = require( "./user" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  admin_level: Joi.number( ).integer( ).valid( null ),
  ancestor_place_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  bbox_area: Joi.number( ).valid( null ),
  bounding_box_geojson: polygonGeojson,
  display_name: Joi.string( ).valid( null ),
  display_name_autocomplete: Joi.string( ).valid( null ),
  geometry_geojson: polygonGeojson,
  location: Joi.string( ).valid( null ),
  matched_term: Joi.string( ).valid( null ),
  name: Joi.string( ),
  observations_count: Joi.number( ).integer( ),
  place_type: Joi.number( ).integer( ).valid( null ),
  point_geojson: pointGeoJson,
  slug: Joi.string( ).valid( null ),
  universal_search_rank: Joi.number( ).integer( ).valid( null ),
  user,
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  without_check_list: Joi.boolean( ).valid( null )
} ).unknown( false ).meta( { className: "Place" } )
  .valid( null );
