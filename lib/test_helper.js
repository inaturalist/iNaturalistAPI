var fs = require( "fs" ),
    _ = require( "underscore" ),
    async = require( "async" ),
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

before( function( done ) {
  testHelper.createIndices( done );
});

after( function( done ) {
  testHelper.deleteIndices( done );
});

module.exports = { };
