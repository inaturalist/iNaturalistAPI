const Joi = require( "joi" );
const conservationStatus = require( "./conservation_status" );
const list = require( "./list" );
const photo = require( "./photo" );
const place = require( "./place" );

module.exports = Joi.object( ).keys( {
  id: Joi.number( ).integer( )
    .description( "Unique auto-increment integer identifier." )
    .required( ),
  // TODO make this required when we've added taxon.uuid to the ident index
  uuid: Joi.string( ).guid( { version: "uuidv4" } ),
  ancestors: Joi.array( ).items(
    Joi.object( ).meta( { className: "Taxon" } )
  ),
  ancestor_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ),
  ancestry: Joi.string( ).valid( null ),
  atlas_id: Joi.number( ).integer( ).valid( null ),
  children: Joi.array( ).items(
    Joi.object( ).meta( { className: "Taxon" } )
  ),
  complete_rank: Joi.string( ),
  complete_species_count: Joi.number( ).integer( ).valid( null ),
  conservation_status: conservationStatus,
  conservation_statuses: Joi.array( ).items(
    conservationStatus
  ),
  created_at: Joi.string( ),
  current_synonymous_taxon_ids: Joi.array( ).items(
    Joi.number( ).integer( )
  ).valid( null ),
  default_photo: photo,
  endemic: Joi.boolean( ),
  english_common_name: Joi.string( ),
  extinct: Joi.boolean( ),
  flag_counts: Joi.object( ).keys( {
    resolved: Joi.number( ).integer( ),
    unresolved: Joi.number( ).integer( )
  } ).unknown( false ),
  iconic_taxon_id: Joi.number( ).integer( ).valid( null ),
  iconic_taxon_name: Joi.string( ),
  introduced: Joi.boolean( ),
  is_active: Joi.boolean( ),
  listed_taxa: Joi.array( ).items(
    Joi.object( ).keys( {
      id: Joi.number( ).integer( ),
      establishment_means: Joi.string( ),
      list,
      taxon: Joi.object( ).meta( { className: "Taxon" } ),
      taxon_id: Joi.number( ).integer( ),
      place
    } ).unknown( false )
  ),
  listed_taxa_count: Joi.number( ).integer( ),
  matched_term: Joi.string( ),
  min_species_ancestry: Joi.string( ),
  min_species_taxon_id: Joi.number( ).integer( ),
  name: Joi.string( ),
  native: Joi.boolean( ),
  observations_count: Joi.number( ).integer( ),
  parent_id: Joi.number( ).integer( ).valid( null ),
  photos_locked: Joi.boolean( )
    .description( "Whether or not photos for this taxon can be edited" ),
  preferred_common_name: Joi.string( ).valid( null ),
  rank: Joi.string( ),
  rank_level: Joi.number( ),
  statuses: Joi.array( ).items(
    Joi.any( ).description( "TODO: status can be strings or objects" )
  ),
  taxon_changes_count: Joi.number( ).integer( ),
  taxon_photos: Joi.array( ).items(
    Joi.object( ).keys( {
      taxon: Joi.object( ).meta( { className: "Taxon" } ),
      taxon_id: Joi.number( ).integer( ),
      photo
    } ).unknown( false )
  ),
  taxon_schemes_count: Joi.number( ).integer( ),
  threatened: Joi.boolean( ),
  universal_search_rank: Joi.number( ).integer( ),
  vision: Joi.boolean( ),
  wikipedia_summary: Joi.string( ).valid( null ),
  wikipedia_url: Joi.string( ).valid( null )
} ).unknown( false ).meta( { className: "Taxon" } )
  .valid( null );
