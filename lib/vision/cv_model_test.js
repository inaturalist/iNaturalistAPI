/* eslint-disable no-console */
const yargs = require( "yargs" );
const ModelTester = require( "./model_tester" );

const { argv } = yargs.usage( "Usage: $0 --path [[path-to-csv]] ..." )
  .boolean( ["local", "vision", "nofreq", "noscale", "redis", "download"] )
  .string( ["label", "path", "cache-key", "ancestor-score-type"] )
  .number( ["limit", "concurrency", "id"] )
  .describe( "path", "Path to test dataset CSV" )
  .describe( "local", "Remove results for taxa not observed nearby" )
  .describe( "nofreq", "Use the raw vision results only" )
  .describe( "noiconic", "Don't use iconic taxa from test data" )
  .describe( "redis", "Use redis for frequencies" )
  .describe( "label", "Run label used when printing results" )
  .describe( "limit", "Stop testing after this many lines" )
  .describe( "concurrency", "Number of parallel workers (same thread)" )
  .describe( "download", "Only download/cache photos and skip vision scoring" )
  .describe( "cache-key", "Will cache the scores for each photo with this key" )
  .describe( "geomodel", "Use geo model for scoring" )
  .describe( "geothresholds", "Use geo model for seen nearby thresholds" )
  .describe( "ancestor-score-type", "TODO" )
  .describe( "ancestor-nearby-ignore", "TODO" )
  .describe( "vision-cache-key", "Will cache the raw vision scores for each photo with this key" )
  .describe( "id", "Test only this observation_id" )
  .demandOption( ["path", "label"] );

const tester = new ModelTester( argv );

console.log( "\n\nRunning with these options:\n" );
console.log( tester.runOptions );

console.log( "\nDelaying to ensure everything is initialized...\n" );
setTimeout( ( ) => {
  tester.startParsing( );
}, 5000 );
