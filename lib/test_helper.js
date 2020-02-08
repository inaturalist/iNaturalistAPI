const fs = require( "fs" );
const _ = require( "lodash" );
const async = require( "async" );
const Promise = require( "bluebird" );
const { expect } = require( "chai" ); // eslint-disable-line import/no-extraneous-dependencies
const sinon = require( "sinon" ); // eslint-disable-line import/no-extraneous-dependencies
const pgClient = require( "./pg_client" );
const esClient = require( "./es_client" );

const environment = process.env.NODE_ENV || global.config.environment;
const testHelper = { };

testHelper.forEachIndex = ( action, callback ) => {
  if ( environment !== "test" ) { return void callback( ); }
  const settings = JSON.parse( fs.readFileSync( "schema/settings.js" ) );
  const mappings = fs.readdirSync( "schema/indices" );
  const indexOptions = _.map( mappings, file => {
    const mapping = JSON.parse( fs.readFileSync( `schema/indices/${file}` ) );
    const name = file.replace( ".js", "" );
    const type = _.keys( mapping )[0];
    return {
      name, type, settings, mapping
    };
  } );
  async.map( indexOptions, action, ( ) => {
    callback( );
  } );
};

testHelper.createIndices = callback => {
  if ( environment !== "test" ) { return void callback( ); }
  testHelper.deleteIndices( ( ) => {
    testHelper.forEachIndex( esClient.createIndexIfNotExists, callback );
  } );
};

testHelper.deleteIndices = callback => {
  if ( environment !== "test" ) { return void callback( ); }
  testHelper.forEachIndex( esClient.deleteIndex, callback );
};

testHelper.insertIntoIndex = ( index, type, statements, callback ) => {
  esClient.connection.bulk( {
    index: `test_${index}`,
    body: statements,
    refresh: true
  }, callback );
};

testHelper.loadElasticsearchFixtures = callback => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  const insertPromise = Promise.promisify( testHelper.insertIntoIndex );
  Promise.mapSeries( _.toPairs( fixtures.elasticsearch ), pair => {
    const index = pair[0];
    const type = _.keys( pair[1] )[0];
    const statements = [];
    _.each( pair[1][type], v => {
      statements.push( { index: { _index: `test_${index}` } } );
      statements.push( v );
    } );
    return insertPromise( index, type, statements );
  } ).then( ( ) => {
    callback( );
  } );
};

testHelper.loadPostgresqlFixtures = callback => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  const queries = [];
  const queryPromise = Promise.promisify(
    pgClient.connection.query, { context: pgClient.connection }
  );
  _.each( fixtures.postgresql, ( values, table ) => {
    queries.push( [`TRUNCATE TABLE ${table}`] );
    _.each( values, v => {
      const fields = _.keys( v );
      const interpolate = _.map( new Array( fields.length ), ( n, i ) => `$${( i + 1 )}` );
      // e.g. INSERT INTO table (field1, field2) VALUES ($1, $2)
      queries.push( [
        `INSERT INTO ${table} (${fields.join( "," )}) VALUES (${interpolate.join( "," )})`,
        _.values( v )
      ] );
    } );
  } );
  Promise
    .mapSeries( queries, q => queryPromise( q[0], q[1] ) )
    .then( ( ) => callback( ) );
};

testHelper.testInatJSPreload = ( controller, endpoint, method, klass, done ) => {
  const endpointStub = sinon.stub( endpoint, method ).callsFake( ( ) => (
    new Promise( resolve => {
      let r = { id: 1 };
      if ( klass.modelName === "observation"
        && ( method === "create" || method === "update" )
      ) {
        r = [r];
      }
      resolve( r );
    } )
  ) );
  const preloadStub = sinon.stub( klass, "preloadInto" ).callsFake( ( arr, l, cb ) => {
    arr[0] = { [klass.modelName]: "success" };
    cb( );
  } );
  controller[method]( { params: { id: 1 }, headers: { authorization: "auth" } }, ( e, c ) => {
    expect( c ).to.deep.eq( "success" );
    endpointStub.restore( );
    preloadStub.restore( );
    done( );
  } );
};

testHelper.testInatJSPreloadAsync = async ( controller, endpoint, method, klass, done ) => {
  const endpointStub = sinon.stub( endpoint, method ).callsFake( ( ) => (
    new Promise( resolve => {
      let r = { id: 1 };
      if ( klass.modelName === "observation"
        && ( method === "create" || method === "update" )
      ) {
        r = [r];
      }
      resolve( r );
    } )
  ) );
  const preloadStub = sinon.stub( klass, "preloadInto" ).callsFake( ( arr => (
    new Promise( resolve => {
      arr[0] = { [klass.modelName]: "success" };
      resolve( );
    } )
  ) ) );
  const c = await controller[method]( { params: { id: 1 }, headers: { authorization: "auth" } } );
  expect( c ).to.deep.eq( "success" );
  endpointStub.restore( );
  preloadStub.restore( );
  done( );
};

testHelper.testInatJSNoPreload = ( controller, endpoint, method, done ) => {
  const endpointStub = sinon.stub( endpoint, method ).callsFake( ( ) => (
    new Promise( resolve => {
      resolve( "success" );
    } )
  ) );
  controller[method]( { headers: { authorization: "auth" } }, ( e, c ) => {
    expect( ["success", true] ).to.include( c );
    endpointStub.restore( );
    done( );
  } );
};

testHelper.testInatJSNoPreloadAsync = async ( controller, endpoint, method, done ) => {
  const endpointStub = sinon.stub( endpoint, method ).callsFake( ( ) => (
    new Promise( resolve => {
      resolve( "success" );
    } )
  ) );
  const c = await controller[method]( { headers: { authorization: "auth" } } );
  expect( ["success", true] ).to.include( c );
  endpointStub.restore( );
  done( );
};

module.exports = {
  createIndices: testHelper.createIndices,
  deleteIndices: testHelper.deleteIndices,
  loadElasticsearchFixtures: testHelper.loadElasticsearchFixtures,
  loadPostgresqlFixtures: testHelper.loadPostgresqlFixtures,
  testInatJSPreload: testHelper.testInatJSPreload,
  testInatJSPreloadAsync: testHelper.testInatJSPreloadAsync,
  testInatJSNoPreload: testHelper.testInatJSNoPreload,
  testInatJSNoPreloadAsync: testHelper.testInatJSNoPreloadAsync
};
