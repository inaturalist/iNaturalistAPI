var fs = require( "fs" ),
    _ = require( "underscore" ),
    async = require( "async" ),
    pgClient = require( "./pg_client" ),
    esClient = require( "./es_client" ),
    environment = process.env.NODE_ENV || global.config.environment,
    testHelper = { };

testHelper.forEachIndex = function( action, callback ) {
  if( environment !== "test" ) { return callback( ); }
  var name, type, mapping,
    settings = JSON.parse( fs.readFileSync( "schema/settings.js" ) ),
    mappings = fs.readdirSync( "schema/indices" );
  var indexOptions = _.map( mappings, function( file ) {
   mapping = JSON.parse( fs.readFileSync( "schema/indices/" + file ) );
   name = file.replace( ".js", "" );
   type = _.keys( mapping )[ 0 ];
   return { name: name, type: type, settings: settings, mapping: mapping };
  });
  async.map( indexOptions, action, function( ) {
    callback( );
  });
};

testHelper.createIndices = function( callback ) {
  if( environment !== "test" ) { return callback( ); }
  testHelper.deleteIndices( function( ) {
    testHelper.forEachIndex( esClient.createIndexIfNotExists, callback );
  });
};

testHelper.deleteIndices = function( callback ) {
  if( environment !== "test" ) { return callback( ); }
  testHelper.forEachIndex( esClient.deleteIndex, callback );
};

testHelper.projectWithRules = function( callback ) {
  var insert = "INSERT INTO rules (type, ruler_type, ruler_id, operand_type, operand_id, operator) " +
    "VALUES ('ProjectObservationRule', 'Project', 543, $1, $2, $3)";
  pgClient.connection.query( "TRUNCATE TABLE projects", function( ) {
  pgClient.connection.query( "TRUNCATE TABLE rules", function( ) {
  pgClient.connection.query( "TRUNCATE TABLE lists", function( ) {
  pgClient.connection.query( "INSERT INTO projects (id, slug, title, start_time, end_time) VALUES ($1, $2, $3, $4, $5)",
    [ 543, "a-project", "A Project", "2016-02-02 2:22:22", "2016-05-05 5:55:55" ], function( ) {
  pgClient.connection.query( "INSERT INTO lists (id, title, project_id, type) VALUES ($1, $2, $3, $4)",
    [ 999, "AProjectList",  543, "ProjectList" ], function( ) {
  pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
    [ 987, 999 ], function( ) {
  pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
    [ 876, 999 ], function( ) {
  pgClient.connection.query( insert, [ "Place", 222, "observed_in_place?" ], function( ) {
  pgClient.connection.query( insert, [ "Place", 333, "observed_in_place?" ], function( ) {
  pgClient.connection.query( insert, [ "Taxon", 444, "in_taxon?" ], function( ) {
  pgClient.connection.query( insert, [ "Taxon", 555, "in_taxon?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "on_list?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "identified?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "georeferenced?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "has_a_photo?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "has_a_sound?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "captive?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "identified?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "wild?" ], function( ) {
  pgClient.connection.query( insert, [ null, 1, "verifiable?" ], function( ) {
    callback( );
  });});});});});});});});});});});});});});});});});});});});
};

testHelper.createPlace = function( callback ) {
  pgClient.connection.query( "TRUNCATE TABLE places", function( ) {
  pgClient.connection.query( "INSERT INTO places (id, display_name) VALUES ($1, $2)",
    [ 432, "a-place" ], function( ) {
    callback( );
  });});
};

before( function( done ) {
  testHelper.createIndices( done );
});

after( function( done ) {
  testHelper.deleteIndices( done );
});

module.exports = {
  projectWithRules: testHelper.projectWithRules,
  createPlace: testHelper.createPlace
};
