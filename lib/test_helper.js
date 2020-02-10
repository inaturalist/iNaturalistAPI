const fs = require( "fs" );
const _ = require( "lodash" );
const Promise = require( "bluebird" );
const { expect } = require( "chai" ); // eslint-disable-line import/no-extraneous-dependencies
const sinon = require( "sinon" ); // eslint-disable-line import/no-extraneous-dependencies
const pgClient = require( "./pg_client" );
const esClient = require( "./es_client" );

const environment = process.env.NODE_ENV || global.config.environment;
const testHelper = { };

testHelper.forEachIndex = async action => {
  if ( environment !== "test" ) { return; }
  const settings = JSON.parse( fs.readFileSync( "schema/settings.js" ) );
  const mappings = fs.readdirSync( "schema/indices" );
  await Promise.all( _.map( mappings, file => {
    const mapping = JSON.parse( fs.readFileSync( `schema/indices/${file}` ) );
    const name = file.replace( ".js", "" );
    const type = _.keys( mapping )[0];
    return action( {
      name, type, settings, mapping
    } );
  } ) );
};

testHelper.createIndices = async ( ) => {
  if ( environment !== "test" ) { return; }
  await testHelper.deleteIndices( );
  await testHelper.forEachIndex( esClient.createIndexIfNotExists );
};

testHelper.deleteIndices = async ( ) => {
  if ( environment !== "test" ) { return; }
  await testHelper.forEachIndex( esClient.deleteIndex );
};

testHelper.insertIntoIndex = async ( index, type, statements ) => {
  await esClient.connection.bulk( {
    index: `test_${index}`,
    body: statements,
    refresh: true
  } );
};

testHelper.loadElasticsearchFixtures = async ( ) => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  await Promise.all( _.map( fixtures.elasticsearch, ( values, index ) => {
    const type = _.keys( values )[0];
    const statements = [];
    _.each( values[type], v => {
      statements.push( { index: { _index: `test_${index}` } } );
      statements.push( v );
    } );
    return testHelper.insertIntoIndex( index, type, statements );
  } ) );
};

testHelper.loadPostgresqlFixtures = async ( ) => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  await Promise.all( _.map( fixtures.postgresql, async ( values, table ) => {
    await pgClient.connection.query( `TRUNCATE TABLE ${table}` );
    _.each( values, async v => {
      const fields = _.keys( v );
      const interpolate = _.map( new Array( fields.length ), ( n, i ) => `$${( i + 1 )}` );
      // e.g. INSERT INTO table (field1, field2) VALUES ($1, $2)
      await pgClient.connection.query(
        `INSERT INTO ${table} (${fields.join( "," )}) VALUES (${interpolate.join( "," )})`,
        _.values( v )
      );
    } );
  } ) );
};

testHelper.testInatJSPreload = async ( controller, endpoint, method, klass, done ) => {
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

testHelper.testInatJSNoPreload = async ( controller, endpoint, method, done ) => {
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
  testInatJSNoPreload: testHelper.testInatJSNoPreload
};
