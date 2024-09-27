const Joi = require( "joi" );
const flag = require( "./flag" );
const observationField = require( "./observation_field" );
const place = require( "./place" );
const taxon = require( "./taxon" );
const user = require( "./user" );

const project = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  admins: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ),
    project_id: Joi.number( ).integer( ),
    role: Joi.string( ),
    user,
    user_id: Joi.number( ).integer( )
  } ).unknown( false ) ),
  banner_color: Joi.string( ).valid( null ),
  created_at: Joi.string( ),
  description: Joi.string( ).valid( null ),
  flags: Joi.array( ).items( flag ),
  header_image_contain: Joi.boolean( ),
  header_image_file_name: Joi.string( ).valid( null ),
  header_image_url: Joi.string( ).valid( null ),
  hide_title: Joi.boolean( ),
  hide_umbrella_map_flags: Joi.boolean( ),
  icon: Joi.string( ).valid( null ),
  icon_file_name: Joi.string( ).valid( null ),
  is_umbrella: Joi.boolean( ),
  latitude: Joi.string( ),
  location: Joi.string( ).valid( null ),
  longitude: Joi.string( ),
  observation_requirements_updated_at: Joi.date( ).valid( null ),
  place_id: Joi.number( ).integer( ).valid( null ),
  prefers_user_trust: Joi.boolean( ).valid( null ),
  project_observation_fields: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    observation_field: observationField,
    position: Joi.number( ).integer( ),
    required: Joi.boolean( ).valid( null )
  } ).unknown( false ) ),
  project_observation_rules: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
    operand_id: Joi.number( ).integer( ).valid( null ),
    operand_type: Joi.string( ).valid( null ),
    operator: Joi.string( ),
    place,
    project: Joi.object( ).meta( { className: "Project" } ),
    taxon,
    user
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
  site_features: Joi.array( ).items( Joi.object( ).keys( {
    noteworthy: Joi.boolean( ),
    site_id: Joi.number( ).integer( ),
    featured_at: Joi.date( )
  } ) ).description( "TODO: fix this" ).valid( null ),
  slug: Joi.string( ),
  terms: Joi.string( ).valid( null ),
  title: Joi.string( ),
  updated_at: Joi.string( ),
  user,
  user_id: Joi.number( ).integer( ),
  user_ids: Joi.array( ).items( Joi.number( ).integer( ) )
} ).unknown( false ).meta( { className: "Project" } )
  .valid( null );

module.exports = project;
