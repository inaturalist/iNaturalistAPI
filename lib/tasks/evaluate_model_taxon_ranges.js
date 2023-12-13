/* eslint-disable no-console */
const yargs = require( "yargs" );
const ModelTaxonRangeProcessor = require( "../model_taxon_range_processor" );

console.log( "" );
const { argv } = yargs.usage( "Usage: $0 --dir [[output-dir]] --taxonomy-path [[taxonomy-path]]" )
  .string( ["dir", "taxonomy-path"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .describe( "taxonomy-path", "Path to taxonomy.csv file containing taxa to process" )
  .describe( "vision-exports-path",
    "Path to vision exports directory where latest export taxonomy can be found" )
  .demandOption( ["dir"] );

if ( !( argv["taxonomy-path"] || argv["vision-exports-path"] ) ) {
  console.log( "You must provide a value for argument `taxonomy-path` or `vision-exports-path`\n\n" );
  process.exit( );
}

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
