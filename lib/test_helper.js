/* eslint-disable no-console */
const fs = require( "fs" );
const _ = require( "lodash" );
const timersPromises = require( "timers/promises" );
const { expect } = require( "chai" ); // eslint-disable-line import/no-extraneous-dependencies
const sinon = require( "sinon" ); // eslint-disable-line import/no-extraneous-dependencies
const pgClient = require( "./pg_client" );
const esClient = require( "./es_client" );

const testHelper = { };

testHelper.waitForPG = async numberOfAttempts => {
  console.log( "Awaiting PG connection..." );
  await timersPromises.setTimeout( 1000 );
  try {
    if ( await pgClient.connect( ) ) {
      return true;
    }
  } catch ( e ) {
    // Do nothing
  }
  numberOfAttempts -= 1;
  if ( numberOfAttempts === 0 ) {
    process.exit( );
  }
  return testHelper.waitForPG( numberOfAttempts );
};

testHelper.waitForES = async numberOfAttempts => {
  console.log( "Awaiting ES connection..." );
  await timersPromises.setTimeout( 1000 );
  try {
    await esClient.connect();
    if ( esClient.connection ) {
      if ( await esClient.connection.ping() ) {
        return true;
      }
    }
  } catch ( e ) {
    // Do nothing
  }
  numberOfAttempts -= 1;
  if ( numberOfAttempts === 0 ) {
    process.exit( );
  }
  return testHelper.waitForES( numberOfAttempts );
};

testHelper.closePGConnection = async ( ) => {
  await pgClient.connection.end( );
  delete pgClient.connection;
};

testHelper.reconnectPGConnection = async ( ) => {
  await pgClient.connect( );
};

testHelper.forEachIndex = async action => {
  if ( process.env.NODE_ENV !== "test" ) { return; }
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
  if ( process.env.NODE_ENV !== "test" ) { return; }
  await testHelper.deleteIndices( );
  await testHelper.forEachIndex( esClient.createIndexIfNotExists );
};

testHelper.deleteIndices = async ( ) => {
  if ( process.env.NODE_ENV !== "test" ) { return; }
  await testHelper.forEachIndex( esClient.deleteIndex );
};

testHelper.insertIntoIndex = async ( index, statements ) => {
  await esClient.connection.bulk( {
    index: `test_${index}`,
    body: statements,
    refresh: true
  } );
};

testHelper.deleteFromIndex = async ( index, id ) => {
  await esClient.connection.delete( {
    index: `test_${index}`,
    id,
    refresh: true
  } );
};

testHelper.loadElasticsearchFixtures = async ( ) => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  await Promise.all( _.map( fixtures.elasticsearch, ( values, index ) => {
    const type = _.keys( values )[0];
    const statements = [];
    _.each( values[type], v => {
      statements.push( { index: { _index: `test_${index}`, _id: v.id } } );
      statements.push( v );
    } );
    return testHelper.insertIntoIndex( index, statements );
  } ) );
};

testHelper.loadPostgresqlFixtures = async ( ) => {
  const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );
  await Promise.all( _.map( fixtures.postgresql, async ( values, table ) => {
    await pgClient.query( `TRUNCATE TABLE ${table} RESTART IDENTITY` );
    await Promise.all( _.map( values, async v => {
      const fields = _.keys( v );
      const interpolate = _.map( new Array( fields.length ), ( n, i ) => `$${( i + 1 )}` );
      // e.g. INSERT INTO table ("field1", "field2") VALUES ($1, $2)
      await pgClient.query(
        `INSERT INTO ${table} ("${fields.join( "\", \"" )}") VALUES (${interpolate.join( "," )})`,
        _.values( v )
      );
    } ) );
  } ) );
};

testHelper.insertJSObjectsIntoPostgresTable = async ( table, objects ) => Promise.all(
  _.map( objects, async object => {
    const fields = _.keys( object );
    const interpolate = _.map( new Array( fields.length ), ( n, i ) => `$${( i + 1 )}` );
    const { rows } = await pgClient.query(
      `INSERT INTO ${table} ("${fields.join( "\", \"" )}") VALUES (${interpolate.join( "," )}) RETURNING id`,
      _.values( object )
    );
    return rows[0].id;
  } )
);

testHelper.deleteIdsFromPostgresTable = async ( table, ids ) => {
  await pgClient.query( `DELETE FROM ${table} WHERE id IN (${ids.join( "," )})` );
};

testHelper.insertJSObjectsIntoESIndex = async ( index, objects ) => {
  const objectIds = _.map( objects, object => object.id );
  const statements = [];
  _.each( objects, obj => {
    statements.push( { index: { _index: `test_${index}`, _id: obj.id } } );
    statements.push( obj );
  } );
  await testHelper.insertIntoIndex( index, statements );
  return objectIds;
};

testHelper.deleteIdsFromESIndex = async ( index, ids ) => {
  await Promise.all( _.map( ids, async id => testHelper.deleteFromIndex( index, id ) ) );
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
  const preloadStub = sinon.stub( klass, "preloadInto" ).callsFake( ( ( req, arr ) => (
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
  waitForPG: testHelper.waitForPG,
  waitForES: testHelper.waitForES,
  closePGConnection: testHelper.closePGConnection,
  reconnectPGConnection: testHelper.reconnectPGConnection,
  createIndices: testHelper.createIndices,
  deleteIndices: testHelper.deleteIndices,
  loadElasticsearchFixtures: testHelper.loadElasticsearchFixtures,
  loadPostgresqlFixtures: testHelper.loadPostgresqlFixtures,
  testInatJSPreload: testHelper.testInatJSPreload,
  testInatJSNoPreload: testHelper.testInatJSNoPreload,
  insertJSObjectsIntoPostgresTable: testHelper.insertJSObjectsIntoPostgresTable,
  deleteIdsFromPostgresTable: testHelper.deleteIdsFromPostgresTable,
  insertJSObjectsIntoESIndex: testHelper.insertJSObjectsIntoESIndex,
  deleteIdsFromESIndex: testHelper.deleteIdsFromESIndex
};
