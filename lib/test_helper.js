var fs = require( "fs" ),
    _ = require( "underscore" ),
    async = require( "async" ),
    Promise = require( "bluebird" ),
    expect = require( "chai" ).expect,
    sinon = require( "sinon" ),
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

testHelper.insertIntoIndex = function( index, type, statements, callback ) {
  esClient.connection.bulk({
    index: "test_" + index,
    type: type,
    body: statements,
    refresh: true
  }, callback );
};

testHelper.loadElasticsearchFixtures = function( callback ) {
  var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ));
  var insertPromise = Promise.promisify( testHelper.insertIntoIndex );
  Promise.mapSeries( _.pairs(fixtures.elasticsearch), function( pair ) {
    var index = pair[0];
    var type = _.keys( pair[1] )[ 0 ];
    var statements = [ ];
    _.each( pair[1][ type ], function( v ) {
      statements.push({ index:  { _index: "test_" + index, _type: type } });
      statements.push( v );
    });
    return insertPromise( index, type, statements );
  }).then( function( ) {
    callback( );
  });
};

testHelper.loadPostgresqlFixtures = function( callback ) {
  var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ));
  var queries = [ ];
  var queryPromise = Promise.promisify(
    pgClient.connection.query, { context: pgClient.connection } );
  _.each( fixtures.postgresql, function( values, table ) {
    queries.push([ "TRUNCATE TABLE " + table ]);
    _.each( values, function( v ) {
      var fields = _.keys( v );
      var interpolate = _.map( new Array( fields.length ), function( n, i ) {
        return "$" + ( i + 1 );
      });
      // e.g. INSERT INTO table (field1, field2) VALUES ($1, $2)
      queries.push(["INSERT INTO " + table + " (" +
        fields.join(",") + ") VALUES (" +
        interpolate.join(",") + ")", _.values( v )]);
    });
  });
  Promise.mapSeries( queries, function( q ) {
    return queryPromise( q[0], q[1] );
  }).then(function( ) {
    callback( );
  })
};

testHelper.testInatJSPreload = function( controller, endpoint, method, klass, done ) {
  var endpointStub = sinon.stub( endpoint, method ).callsFake( function ( ) {
    return new Promise( function( resolve ) {
      var r = { id: 1 }
      if( klass.modelName === "observation" &&
          ( method === "create" || method === "update" ) ) {
        r = [ r ];
      }
      resolve( r );
    });
  });
  var preloadStub = sinon.stub( klass, "preloadInto" ).callsFake( function( arr, l, cb ) {
    arr[0] = { [klass.modelName]: "success" };
    cb( );
  });
  controller[ method ]( { params: { id: 1 }, headers: { authorization: "auth" } }, function( e, c ) {
    expect( c ).to.deep.eq( "success" )
    endpointStub.restore( );
    preloadStub.restore( );
    done( );
  });
};

testHelper.testInatJSNoPreload = function( controller, endpoint, method, done ) {
  var endpointStub = sinon.stub( endpoint, method ).callsFake( function ( ) {
    return new Promise( function( resolve ) {
      resolve( "success" );
    });
  });
  controller[ method ]( { headers: { authorization: "auth" } }, function( e, c ) {
    expect( c ).to.eq( "success" )
    endpointStub.restore( );
    done( );
  });
};

module.exports = {
  createIndices: testHelper.createIndices,
  deleteIndices: testHelper.deleteIndices,
  loadElasticsearchFixtures: testHelper.loadElasticsearchFixtures,
  loadPostgresqlFixtures: testHelper.loadPostgresqlFixtures,
  testInatJSPreload: testHelper.testInatJSPreload,
  testInatJSNoPreload: testHelper.testInatJSNoPreload
};
