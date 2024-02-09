const Joi = require( "joi" );
const annotation = require( "./annotation" );
const comment = require( "./comment" );
const dateDetails = require( "./date_details" );
const flag = require( "./flag" );
const pointGeojson = require( "./point_geo_json" );
const identification = require( "./identification" );
const observationFieldValue = require( "./observation_field_value" );
const photo = require( "./photo" );
const observationPhoto = require( "./observation_photo" );
const observationSound = require( "./observation_sound" );
const project = require( "./project" );
const projectObservation = require( "./project_observation" );
const qualityMetric = require( "./quality_metric" );
const sound = require( "./sound" );
const taxon = require( "./taxon" );
const user = require( "./user" );
const vote = require( "./vote" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .valid( null ),
  annotations: Joi.array( ).items( annotation ),
  application: Joi.object( ).keys( {
    id: Joi.number( ).integer( ).required( ),
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
  geojson: pointGeojson,
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
  non_traditional_projects: Joi.array( ).items( Joi.object( ).keys( {
    current_user_is_member: Joi.boolean( ),
    project,
    projectUser: Joi.object( ).keys( {
      role: Joi.string( ),
      prefers_curator_coordinate_access_for: Joi.string( )
    } )
  } ) ),
  num_identification_agreements: Joi.number( ).integer( ),
  num_identification_disagreements: Joi.number( ).integer( ),
  oauth_application_id: Joi.number( ).integer( ).valid( null ),
  obscured: Joi.boolean( ),
  observation_photos: Joi.array( ).items( observationPhoto ),
  observation_sounds: Joi.array( ).items( observationSound ),
  observed_on: Joi.string( ).valid( null ),
  observed_on_details: dateDetails,
  observed_on_string: Joi.string( ).valid( null ),
  observed_time_zone: Joi.string( ).valid( null ), // can be null if no date
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
  private_geojson: pointGeojson,
  private_location: Joi.string( ).valid( null ),
  private_place_guess: Joi.string( ).valid( null ),
  project_ids: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_ids_with_curator_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_ids_without_curator_id: Joi.array( ).items( Joi.number( ).integer( ) ),
  project_observations: Joi.array( ).items( projectObservation ),
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
  viewer_trusted_by_observer: Joi.boolean( ).valid( null )
    .description(
      "Observer trusts the authenticated user with access to hidden coordinates"
    ),
  votes: Joi.array( ).items( vote )
} ).unknown( false ).meta( { className: "Observation" } );
