/* eslint-disable no-console */
const _ = require( "lodash" );
const yargs = require( "yargs" );
const VisionDataExporter = require( "../vision_data_exporter" );
const Taxon = require( "../models/taxon" );

console.log( "" );
const { argv } = yargs.usage( "Usage: $0 --dir [[output-dir]] ..." )
  .string( ["dir", "taxa", "leaves"] )
  .number( [
    "train-min",
    "train-max",
    "val-min",
    "val-max",
    "test-min",
    "test-max",
    "spatial-max",
    "accuracy-max",
    "train-per-obs",
    "taxa-concurrency",
    "observations-concurrency",
    "print-taxonomy"
  ] )
  .boolean( ["skip-ancestry-mismatch"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .describe( "taxa", "Comma-delimited list of taxon IDs to filter by" )
  .describe( "leaves", "Comma-delimited list of taxon IDs to stop at" )
  .describe( "train-min", `Min train photos per taxon. Default: ${VisionDataExporter.TRAIN_MIN}` )
  .describe( "train-max", `Max train photos per taxon. Default: ${VisionDataExporter.TRAIN_MAX}` )
  .describe( "val-min", `Min val photos per taxon. Default: ${VisionDataExporter.VAL_MIN}` )
  .describe( "val-max", `Max val photos per taxon. Default: ${VisionDataExporter.VAL_MAX}` )
  .describe( "test-min", `Min test photos per taxon. Default: ${VisionDataExporter.TEST_MIN}` )
  .describe( "test-max", `Max test photos per taxon. Default: ${VisionDataExporter.TEST_MAX}` )
  .describe( "spatial-max", `Max spatial points per taxon. Default: ${VisionDataExporter.SPATIAL_MAX}` )
  .describe( "accuracy-max", `Max positional accuracy. Default: ${VisionDataExporter.MAX_POSITIONAL_ACCURACY}` )
  .describe( "train-per-obs", `Max train photos per observation. Default: ${VisionDataExporter.TRAIN_PHOTOS_PER_OBSERVATION}` )
  .describe( "taxa-concurrency", `Max simultaneous taxon queries. Default: ${VisionDataExporter.TAXA_CONCURRENCY}` )
  .describe( "observations-concurrency", `Max simultaneous obs queries per taxon. Default: ${VisionDataExporter.OBSERVATIONS_CONCURRENCY}` )
  .describe( "print-taxonomy", "Print visual taxonomy to console. Default: false" )
  .describe( "skip-ancestry-mismatch", "Don't raise an error when ancestries mismatch. Default: false" )
  .demandOption( ["dir"] );

const stringToArray = string => (
  _.compact( _.uniq( _.map( string.split( "," ), id => Number( id.trim( ) ) ) ) )
);

const stringToNumberArray = string => (
  _.map( stringToArray( string ), Number )
);

setTimeout( async ( ) => {
  await Taxon.loadReferencedTaxa( );
  argv.taxa = _.isEmpty( argv.taxa ) ? null : stringToNumberArray( argv.taxa );
  argv.leaves = _.isEmpty( argv.leaves ) ? null : stringToNumberArray( argv.leaves );
  new VisionDataExporter( argv ).export( )
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
