/* eslint no-console: 0 */
const _ = require( "lodash" );
const yargs = require( "yargs" );
const csv = require( "fast-csv" );
const fs = require( "fs" );
const PromisePool = require( "es6-promise-pool" );
const RedisClient = require( "../redis_client" );

const { argv } = yargs.usage( "Usage: $0 --path [[path]] --taxa-path [[taxa-path]]" )
  .string( ["path", "taxa-path"] )
  .describe( "path", "Path to frequency CSV" )
  .describe( "taxa-path", "Path to  frequency taxa CSV" )
  .demandOption( ["path", "taxa-path"] );

const FrequencyImport = class FrequencyImport {
  static readAncestryFile( ) {
    return new Promise( resolve => {
      const testDataPath = argv["taxa-path"];
      const stream = fs.createReadStream( testDataPath );
      const taxonAncestries = { };
      csv.parseStream( stream, { headers: true } )
        .on( "data", data => {
          taxonAncestries[data.id] = data.ancestry;
        } ).on( "end", ( ) => {
          console.log( "Done readAncestryFile" );
          resolve( taxonAncestries );
        } );
    } );
  }

  static readFrequencyFile( taxonAncestries, options = { } ) {
    return new Promise( resolve => {
      const testDataPath = argv.path;
      const stream = fs.createReadStream( testDataPath );
      let freqData = { };
      let lastKey;
      csv.parseStream( stream, { headers: true } )
        .on( "data", data => {
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
          if ( _.size( freqData ) > 1000 && key !== lastKey ) {
            FrequencyImport.insertData( freqData ).then( { } );
            freqData = { };
          }
          lastKey = key;
        } ).on( "end", ( ) => {
          console.log( "Done readFrequencyFile" );
          resolve( freqData );
        } );
    } );
  }

  static insertData( freqData ) {
    return new Promise( resolve => {
      const keys = _.keys( freqData );
      const total = _.size( keys );
      let processDataIndex = 0;
      const startTime = Date.now( );
      const promiseProducer = ( ) => {
        const nextEntryKey = keys[processDataIndex];
        processDataIndex += 1;
        if ( processDataIndex % 100 === 0 ) {
          const timeElapsed = ( Date.now( ) - startTime ) / 1000;
          const perSecond = processDataIndex / timeElapsed;
          const secondsLeft = ( total - processDataIndex ) / perSecond;
          console.log( `Processed ${processDataIndex} keys in ${_.round( timeElapsed, 2 )}s;`
            + ` ${_.round( perSecond, 2 )}/s; ${_.round( secondsLeft, 2 )}s left` );
        }
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
  FrequencyImport.readFrequencyFile( taxonAncestries )
    // insert all frequency data, keyed by month
    .then( FrequencyImport.insertData )
    .then( ( ) => {
      // now insert the same data, not grouped by month
      FrequencyImport.readFrequencyFile( taxonAncestries, { skipMonth: true } )
        .then( FrequencyImport.insertData )
        .then( process.exit );
    } );
}, 1000 );
