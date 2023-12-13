/* eslint-disable no-console */
const yargs = require( "yargs" );
const ModelTaxonRangeProcessor = require( "../model_taxon_range_processor" );

console.log( "" );
const { argv } = yargs.usage( "Usage: $0 --dir [[output-dir]] --taxonomy-path [[taxonomy-path]]" )
  .string( ["dir", "taxonomy-path"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .describe( "taxonomy-path", "Path to taxonomy.csv file containing taxa to process" )
  .demandOption( ["dir", "taxonomy-path"] );

setTimeout( async ( ) => {
  new ModelTaxonRangeProcessor( argv ).start( )
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
}, 100 );
