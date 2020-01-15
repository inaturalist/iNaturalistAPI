const Joi = require( "@hapi/joi" );
const annotation = require( "./annotation" );
const comment = require( "./comment" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const geojson = require( "./geo_json" );
const identification = require( "./identification" );
const observationFieldValue = require( "./observation_field_value" );
const photo = require( "./photo" );
const project = require( "./project" );
const qualityMetric = require( "./quality_metric" );
const sound = require( "./sound" );
const taxon = require( "./taxon" );
const user = require( "./user" );
const vote = require( "./vote" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." ),
  annotations: Joi.array( ).items( annotation ),
  application: Joi.object( ).keys( {
    id: Joi.number( ).integer( ),
    icon: Joi.string( ).valid( null ),
    name: Joi.string( ),
    url: Joi.string( )
  } ).unknown( false ),
  cached_votes_total: Joi.number( ).integer( ),
  captive: Joi.boolean( ),
  comments: Joi.array( ).items( comment ),
  comments_count: Joi.number( ).integer( ),
  community_taxon: taxon,
  community_taxon_id: Joi.number( ).integer( ).valid( null ),
  context_geoprivacy: Joi.string( ).valid( null ),
  context_taxon_geoprivacy: Joi.string( ).valid( null ),
  context_user_geoprivacy: Joi.string( ).valid( null ),
  created_at: Joi.string( ),
  created_at_details: dateDetails,
  created_time_zone: Joi.string( ),
  description: Joi.string( ).valid( null ),
  faves: Joi.array( ).items( vote ),
  faves_count: Joi.number( ).integer( ),
  flags: Joi.array( ).items( flag ),
  geojson,
  geoprivacy: Joi.string( ).valid( null ),
  id_please: Joi.boolean( ),
  ident_taxon_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
  identifications: Joi.array( ).items( identification ),
  identifications_count: Joi.number( ).integer( ),
  identifications_most_agree: Joi.boolean( ),
  identifications_most_disagree: Joi.boolean( ),
  identifications_some_agree: Joi.boolean( ),
  license_code: Joi.string( ).valid( null ),
  location: Joi.string( ).valid( null ),
  map_scale: Joi.number( ).integer( ).valid( null ),
  mappable: Joi.boolean( ),
  non_owner_ids: Joi.array( ).items( identification ),
  num_identification_agreements: Joi.number( ).integer( ),
  num_identification_disagreements: Joi.number( ).integer( ),
  oauth_application_id: Joi.number( ).integer( ).valid( null ),
  obscured: Joi.boolean( ),
  observation_photos: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ),
    photo,
    position: Joi.number( ).integer( ),
    uuid: Joi.string( ).guid( { version: "uuidv4" } )
  } ).unknown( false ) ),
  observed_on: Joi.string( ).valid( null ),
  observed_on_details: dateDetails,
  observed_on_string: Joi.string( ).valid( null ),
  observed_time_zone: Joi.string( ),
  ofvs: Joi.array( ).items( observationFieldValue ),
  out_of_range: Joi.boolean( ).valid( null ),
  outlinks: Joi.array( ).items( Joi.object( ).keys( {
    source: Joi.string( ),
    url: Joi.string( )
  } ).unknown( false ) ),
  owners_identification_from_vision: Joi.boolean( ).valid( null ),
  photos: Joi.array( ).items( photo ),
  place_guess: Joi.string( ).valid( null ),
  place_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
  positional_accuracy: Joi.number( ).integer( ).valid( null ),
  preferences: Joi.object( ).keys( {
    auto_obscuration: Joi.boolean( ),
    prefers_community_taxon: Joi.boolean( ).valid( null )
  } ).unknown( false ),
  project_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_ids_with_curator_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_ids_without_curator_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_observations: Joi.array( ).items( Joi.object( ).keys( {
    id: Joi.number( ).integer( ).description( "Unique auto-increment integer identifier." ),
    preferences: Joi.object( ).keys( {
      allows_curator_coordinate_access: Joi.boolean( )
    } ).unknown( false ),
    project,
    project_id: Joi.number( ).integer( ),
    user,
    user_id: Joi.number( ).integer( ).valid( null ),
    uuid: Joi.string( ).guid( { version: "uuidv4" } )
  } ).unknown( false ) ),
  public_positional_accuracy: Joi.number( ).integer( ).valid( null ),
  quality_grade: Joi.string( ),
  quality_metrics: Joi.array( ).items( qualityMetric ),
  reviewed_by: Joi.array( ).items( Joi.number( ).integer( ) ),
  site_id: Joi.number( ).integer( ).valid( null ),
  sounds: Joi.array( ).items( sound ),
  spam: Joi.boolean( ),
  species_guess: Joi.string( ).valid( null ),
  tags: Joi.array( ).items( Joi.string( ) ),
  taxon,
  taxon_geoprivacy: Joi.string( ).valid( null ),
  time_observed_at: Joi.string( ).valid( null ),
  time_zone_offset: Joi.string( ),
  updated_at: Joi.string( ),
  uri: Joi.string( ),
  user,
  uuid: Joi.string( ).guid( { version: "uuidv4" } ).required( ),
  votes: Joi.array( ).items( vote )
} ).unknown( false ).meta( { className: "Observation" } );
