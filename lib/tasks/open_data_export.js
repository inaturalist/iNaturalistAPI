/* eslint-disable no-console */
const yargs = require( "yargs" );
const OpenDataArchive = require( "../open_data_archive" );

console.log( "" );
const { argv } = yargs.usage( "Usage: $0 --dir [[output-dir]] ..." )
  .string( ["dir"] )
  .number( ["concurrency", "max-rows"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .describe( "concurrency", "Number of parallel workers (same thread)" )
  .describe( "max-rows", "Maximum number of observations and taxa to process" )
  .demandOption( ["dir"] );

setTimeout( async ( ) => {
  new OpenDataArchive( argv ).createArchive( )
    .catch( e => {
      console.log( e );
    } ).finally( ( ) => {
      console.log( "" );
    } );
}, 2000 );
