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
    "train-per-obs"
  ] )
  .boolean( ["skipAncestryMismatch"] )
  .describe( "dir", "Path to directory where archive will be created" )
  .describe( "taxa", "Comma-delimited list of taxon IDs to filter by" )
  .describe( "leaves", "Comma-delimited list of taxon IDs to stop at" )
  .describe( "train-min", `Min train photos per taxon. Default: ${VisionDataExporter.TRAIN_MIN}` )
  .describe( "train-max", `Min train photos per taxon. Default: ${VisionDataExporter.TRAIN_MAX}` )
  .describe( "val-min", `Min val photos per taxon. Default: ${VisionDataExporter.VAL_MIN}` )
  .describe( "val-max", `Min val photos per taxon. Default: ${VisionDataExporter.VAL_MAX}` )
  .describe( "test-min", `Min test photos per taxon. Default: ${VisionDataExporter.TEST_MIN}` )
  .describe( "test-max", `Min test photos per taxon. Default: ${VisionDataExporter.TEST_MAX}` )
  .describe( "train-per-obs", `Max train photos per observation. Default: ${VisionDataExporter.TRAIN_PHOTOS_PER_OBSERVATION}` )
  .describe( "skip-ancestry-mismatch", "Don't raise an error when ancestries mismatch" )
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
  new VisionDataExporter( argv ).initialize( )
    .catch( e => {
      console.log( "Failed with error:" );
      console.log( e );
    } ).finally( ( ) => {
      console.log( "" );
      console.log( "we're done" );
      process.exit( );
    } );
}, 2000 );
