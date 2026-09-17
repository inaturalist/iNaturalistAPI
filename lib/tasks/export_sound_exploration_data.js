/* eslint-disable no-console */
const yargs = require( "yargs" );
const SoundExplorationDataExporter = require( "../sound_exploration_data_exporter" );
const Taxon = require( "../models/taxon" );

console.log( "" );
const { argv } = yargs.usage( "Usage: $0 --dir [[output-dir]] ..." )
  .string( ["dir"] )
  .boolean( ["skip-ancestry-mismatch"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .demandOption( ["dir"] );

setTimeout( async ( ) => {
  await Taxon.loadIconicTaxa( );
  new SoundExplorationDataExporter( argv ).export( )
    .catch( e => {
      console.log( "Failed with error:" );
      console.log( e );
      console.log( e.stack );
      process.exit( );
    } ).finally( ( ) => {
      console.log( "" );
      console.log( "we're done" );
      process.exit( );
    } );
}, 2000 );
