var _ = require( "underscore" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    Fave = require( "./fave" ),
    Identification = require( "./identification" ),
    Taxon = require( "./taxon" ),
    User = require( "./user" ),
    Observation = { };

Observation = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
  this.obscured = !!(this.geoprivacy === "obscured" || this.private_location);
  if( this.obscured ) {
    delete this.place_guess
  }
  delete this.private_location;
  delete this.private_geojson;
};

Observation.modelName = "observation";
Observation.indexName = "observations";
Observation.tableName = "observations";

Observation.preloadUsers = function( obs, callback ) {
  DBModel.fetchBelongsTo( obs, User, callback );
};

Observation.preloadIdentifications = function( obs, callback ) {
  DBModel.fetchHasMany( obs, Identification, "observation_id", callback );
};

Observation.preloadFaves = function( obs, callback ) {
  DBModel.fetchHasMany( obs, Fave, "votable_id", callback );
};

Observation.preloadAllAssociations = function( obs, localeOpts, callback ) {
  Observation.preloadIdentifications( obs, function( err ) {
    if( err ) { return callback( err ); }
    Observation.preloadFaves( obs, function( err ) {
      if( err ) { return callback( err ); }
      Observation.preloadTaxaAndUsers( obs, localeOpts, callback );
    });
  });
};

Observation.preloadTaxaAndUsers = function( obs, localeOpts, callback ) {
  var prepareTaxon = function( t ) {
    t.prepareForResponse( localeOpts );
  }
  var obsAndIDs = _.filter(
    _.flatten( [ obs, _.pluck( obs, "identifications" ) ] ), _.identity
  );
  var obsFavesAndIDs = _.filter(
    _.flatten( [ obsAndIDs, _.pluck( obs, "faves" ) ] ), _.identity
  );
  ESModel.fetchBelongsTo( obsAndIDs, Taxon, prepareTaxon, function( err ) {
    if( err ) { return callback( err ); }
    DBModel.fetchBelongsTo( obsFavesAndIDs, User, callback );
  });
};

module.exports = Observation;
