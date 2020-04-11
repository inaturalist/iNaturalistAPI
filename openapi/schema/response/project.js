const Joi = require( "@hapi/joi" );
const flag = require( "./flag" );
const observationField = require( "./observation_field" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  admins: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ),
    project_id: Joi.number( ).integer( ),
    role: Joi.string( ),
    user_id: Joi.number( ).integer( )
  } ).unknown( false ) ),
  banner_color: Joi.string( ).valid( null ),
  created_at: Joi.string( ),
  description: Joi.string( ),
  flags: Joi.array( ).items( flag ),
  header_image_contain: Joi.boolean( ),
  header_image_file_name: Joi.string( ).valid( null ),
  header_image_url: Joi.string( ).valid( null ),
  hide_title: Joi.boolean( ),
  icon: Joi.string( ).valid( null ),
  icon_file_name: Joi.string( ).valid( null ),
  is_umbrella: Joi.boolean( ),
  latitude: Joi.string( ),
  location: Joi.string( ).valid( null ),
  longitude: Joi.string( ),
  place_id: Joi.number( ).integer( ).valid( null ),
  project_observation_fields: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ),
    observation_field: observationField,
    position: Joi.number( ).integer( ),
    required: Joi.boolean( ).valid( null )
  } ).unknown( false ) ),
  project_observation_rules: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ),
    operand_id: Joi.number( ).integer( ).valid( null ),
    operand_type: Joi.string( ).valid( null ),
    operator: Joi.string( )
  } ).unknown( false ) ),
  project_type: Joi.string( ).valid( null ),
  rule_preferences: Joi.array( ).items( Joi.object( ).keys( {
    field: Joi.string( ).description( "Observation attribute this rule assesses" ),
    value: Joi.any( ).description( "Required observation attribute value(s)" )
  } ) ),
  search_parameters: Joi.array( ).items( Joi.object( ).keys( {
    field: Joi.string( ),
    value: Joi.any( ).description( "TODO: values can be single values or arrays" ),
    value_bool: Joi.boolean( ),
    value_date: Joi.array( ).items( Joi.string( ) ),
    value_keyword: Joi.any( ).description( "TODO: values can be single values or arrays" ),
    value_number: Joi.array( ).items( Joi.number( ) )
  } ).unknown( false ) ),
  site_features: Joi.array( ).items( Joi.date( ) ).description( "TODO: fix this" ),
  slug: Joi.string( ),
  title: Joi.string( ),
  updated_at: Joi.string( ),
  user_id: Joi.number( ).integer( ),
  user_ids: Joi.array( ).items( Joi.number( ).integer( ) )
} ).unknown( false ).meta( { className: "Project" } )
  .valid( null );
