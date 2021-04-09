/* eslint no-console: 0 */
const _ = require( "lodash" );
const yargs = require( "yargs" );
const fs = require( "fs" );
const PromisePool = require( "es6-promise-pool" );
const { StringStream } = require( "scramjet" );
const RedisClient = require( "../redis_client" );

const { argv } = yargs.usage( "Usage: $0 --path [[path]] --taxa-path [[taxa-path]]" )
  .string( ["path", "taxa-path"] )
  .describe( "path", "Path to frequency CSV" )
  .describe( "taxa-path", "Path to  frequency taxa CSV" )
  .demandOption( ["path", "taxa-path"] );

const FrequencyImport = class FrequencyImport {
  static async readAncestryFile( ) {
    const testDataPath = argv["taxa-path"];
    const stream = fs.createReadStream( testDataPath );
    const taxonAncestries = { };
    let linesParsed = 0;
    await StringStream.from( stream )
      .lines( )
      .map( async line => {
        const row = line.split( "," );
        if ( linesParsed !== 0 ) {
          taxonAncestries[row[0]] = row[1];
        }
        linesParsed += 1;
      } )
      .run( );
    console.log( "Done readAncestryFile" );
    console.log( `Found ${_.size( taxonAncestries )} ancestries in ${linesParsed} lines` );
    return taxonAncestries;
  }

  static async readFrequencyFile( taxonAncestries, options = { } ) {
    const testDataPath = argv.path;
    const stream = fs.createReadStream( testDataPath );
    const startTime = Date.now( );
    let freqData = { };
    let lastKey;
    let linesParsed = 0;
    let linesParsedSinceInsert = 0;
    let columns;
    await StringStream.from( stream )
      .lines( )
      .map( async line => {
        const row = line.split( "," );
        if ( linesParsed === 0 ) {
          columns = row;
        } else if ( row[0] ) {
          const data = _.zipObject( columns, row );
          const key = options.skipMonth
            ? `${data.key}`
            : `${data.key}:${data.month}`;
          freqData[key] = freqData[key] || { };
          if ( !freqData[key][data.taxon_id] ) {
            freqData[key][data.taxon_id] = { c: 0 };
            if ( data.higher_taxon ) {
              freqData[key][data.taxon_id].h = true;
            }
            if ( taxonAncestries[data.taxon_id] ) {
              freqData[key][data.taxon_id].a = taxonAncestries[data.taxon_id];
            }
          }
          freqData[key][data.taxon_id].c += Number( data.count );
          if ( linesParsedSinceInsert >= 100000 && data.key !== lastKey ) {
            console.log( [key, data.key, lastKey] );
            await FrequencyImport.insertData( _.cloneDeep( freqData ) );
            freqData = { };
            linesParsedSinceInsert = 0;
          } else {
            linesParsedSinceInsert += 1;
          }
          lastKey = data.key;
        }
        linesParsed += 1;
        if ( linesParsed % 50000 === 0 ) {
          const timeElapsed = ( Date.now( ) - startTime ) / 1000;
          const perSecond = linesParsed / timeElapsed;
          console.log( `Processed ${linesParsed} keys in ${_.round( timeElapsed, 2 )}s;`
            + ` ${_.round( perSecond, 2 )}/s;` );
        }
      } )
      .setOptions( { maxParallel: 1 } )
      .run( );
    console.log( "Done readFrequencyFile" );
    return freqData;
  }

  static insertData( freqData ) {
    return new Promise( resolve => {
      const keys = _.keys( freqData );
      let processDataIndex = 0;
      const promiseProducer = ( ) => {
        const nextEntryKey = keys[processDataIndex];
        processDataIndex += 1;
        return nextEntryKey
          ? FrequencyImport.saveValue( nextEntryKey, freqData[nextEntryKey] )
          : null;
      };
      const pool = new PromisePool( promiseProducer, 3 );

      // start the promise pool to write the cell cache files
      pool.start( ).then( ( ) => {
        console.log( "Done insertData" );
        resolve( );
      } );
    } );
  }

  static saveValue( key, value ) {
    return new Promise( ( resolve, reject ) => {
      RedisClient.setCompressed( key, JSON.stringify( value ), 10000000 )
        .then( resolve )
        .catch( e => {
          console.log( e );
          reject( e );
        } );
    } );
  }
};

setTimeout( async ( ) => {
  const taxonAncestries = await FrequencyImport.readAncestryFile( );
  // insert all frequency data, keyed by month
  let remainingData = await FrequencyImport.readFrequencyFile( taxonAncestries );
  await FrequencyImport.insertData( remainingData );
  // now insert the same data, not grouped by month
  remainingData = await FrequencyImport.readFrequencyFile( taxonAncestries, { skipMonth: true } );
  await FrequencyImport.insertData( remainingData );
  process.exit( );
}, 1000 );
