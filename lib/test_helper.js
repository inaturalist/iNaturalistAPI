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
    indicesCreated = 0,
    settings = JSON.parse( fs.readFileSync( "schema/settings.js" ) ),
    mappings = fs.readdirSync( "schema/indices" );
  var indexOptions = _.map( mappings, function( file ) {
   mapping = JSON.parse( fs.readFileSync( "schema/indices/" + file ) );
   name = file.replace( ".js", "" );
   type = _.keys( mapping )[ 0 ];
   return { name: name, type: type, settings: settings, mapping: mapping };
  });
  async.map( indexOptions, action, function( err ) {
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
  pgClient.connection.query( "TRUNCATE TABLE projects", function( err, result ) {
  pgClient.connection.query( "TRUNCATE TABLE rules", function( err, result ) {
  pgClient.connection.query( "TRUNCATE TABLE lists", function( err, result ) {
  pgClient.connection.query( "INSERT INTO projects (id, slug, title, start_time, end_time) VALUES ($1, $2, $3, $4, $5)",
    [ 543, "a-project", "A Project", "2016-02-02 2:22:22", "2016-05-05 5:55:55" ], function( err, result ) {
  pgClient.connection.query( "INSERT INTO lists (id, title, project_id, type) VALUES ($1, $2, $3, $4)",
    [ 999, "AProjectList",  543, "ProjectList" ], function( err, result ) {
  pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
    [ 987, 999 ], function( err, result ) {
  pgClient.connection.query( "INSERT INTO listed_taxa (taxon_id, list_id) VALUES ($1, $2)",
    [ 876, 999 ], function( err, result ) {
  pgClient.connection.query( insert, [ "Place", 222, "observed_in_place?" ], function( e, r ) {
  pgClient.connection.query( insert, [ "Place", 333, "observed_in_place?" ], function( e, r ) {
  pgClient.connection.query( insert, [ "Taxon", 444, "in_taxon?" ], function( e, r ) {
  pgClient.connection.query( insert, [ "Taxon", 555, "in_taxon?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "on_list?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "identified?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "georeferenced?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "has_a_photo?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "has_a_sound?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "captive?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "identified?" ], function( e, r ) {
  pgClient.connection.query( insert, [ null, 1, "wild?" ], function( e, r ) {
    callback( );
  });});});});});});});});});});});});});});});});});});});
};

testHelper.createPlace = function( callback ) {
  pgClient.connection.query( "TRUNCATE TABLE places", function( err, result ) {
  pgClient.connection.query( "INSERT INTO places (id, display_name) VALUES ($1, $2)",
    [ 432, "a-place" ], function( err, result ) {
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
