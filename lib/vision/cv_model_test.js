/* eslint-disable no-console */
const _ = require( "lodash" );
const yargs = require( "yargs" );
const CVParser = require( "./cv_parser" );
global.config = require( "../../config" );

const { argv } = yargs.usage( "Usage: $0 --path [[path-to-csv]] ..." )
  .boolean( ["local", "vision", "nofreq", "noscale", "redis", "download"] )
  .string( ["label", "path", "cache-key", "ancestor-score-type"] )
  .number( ["limit", "concurrency", "id"] )
  .describe( "path", "Path to test dataset CSV" )
  .describe( "local", "Remove results for taxa not observed nearby" )
  .describe( "vision", "Ensure all results are in the vision model" )
  .describe( "nofreq", "Use the raw vision results only" )
  .describe( "noscale", "Ensure all results are in the vision model" )
  .describe( "noiconic", "Don't use iconic taxa from test data" )
  .describe( "redis", "Use redis for frequencies" )
  .describe( "label", "Run label used when printing results" )
  .describe( "limit", "Stop testing after this many lines" )
  .describe( "concurrency", "Number of parallel workers (same thread)" )
  .describe( "download", "Only download/cache photos and skip vision scoring" )
  .describe( "cache-key", "Will cache the scores for each photo with this key" )
  .describe( "geomodel", "Use geo model for scoring" )
  .describe( "ancestor-score-type", "TODO" )
  .describe( "ancestor-nearby-ignore", "TODO" )
  .describe( "vision-cache-key", "Will cache the raw vision scores for each photo with this key" )
  .describe( "id", "Test only this observation_id" )
  .demandOption( ["path", "label"] );

const matchingIndexes = [];
const matchingScores = [];
const commonAncestors = [];
const matchingCommonAncestors = [];

function runOptions( ) {
  const customArgs = _.pickBy( argv, ( value, key ) => ( key !== "_" && key !== "$0" ) );
  const options = _.mapKeys( customArgs, ( value, key ) => _.snakeCase( key ) );
  // console.log( options );
  if ( argv.nofreq ) {
    options.skip_frequencies = true;
  }
  if ( argv.redis ) {
    options.redis_frequencies = true;
  }
  if ( argv.noscale ) {
    options.frequency_only_remove = true;
  }
  if ( argv.local ) {
    options.must_be_in_frequency = true;
  }
  if ( argv.vision ) {
    options.must_be_in_vision = true;
  }
  return options;
}

async function photoJob( imageData ) {
  try {
    if ( argv.download ) {
      await CVParser.cachePhoto( imageData );
      return;
    }
    if ( argv.id && Number( imageData.observation_id ) !== argv.id ) {
      return;
    }
    const cachePath = await CVParser.cachePhoto( imageData );
    const scores = await CVParser.cachedScoreImage( cachePath, imageData, runOptions( ) );
    let matchingIndex;
    if ( scores.common_ancestor && scores.common_ancestor.taxon ) {
      commonAncestors.push( true );
      if ( _.includes( imageData.taxon_ancestry.split( "/" ), _.toString( scores.common_ancestor.taxon.id ) ) ) {
        matchingCommonAncestors.push( true );
      }
    }
    _.each( scores.results, ( r, index ) => {
      if ( !_.isUndefined( matchingIndex ) ) { return; }
      if ( Number( r.taxon.id ) === Number( imageData.taxon_id ) ) {
        matchingIndex = index;
        matchingIndexes.push( index );
        matchingScores.push( r.combined_score );
      }
    } );
    if ( _.isUndefined( matchingIndex ) ) {
      matchingIndexes.push( 100 );
      matchingScores.push( 0 );
    }
  } catch ( e ) {
    console.debug( e );
    console.log( e.name || e.message );
  }
}

function percentage( numeratorArr, divisorArr ) {
  const numerator = _.isArray( numeratorArr ) ? numeratorArr.length : numeratorArr;
  const denominator = _.isArray( divisorArr ) ? divisorArr.length : divisorArr;
  return _.round( ( numerator * 100 ) / denominator, 2 );
}

function startParsing( ) {
  const parser = new CVParser( );
  const startTime = Date.now( );
  parser.readTestData( argv.path, argv.limit ).then( ( ) => (
    parser.parallelProcessPhotos( photoJob, argv.concurrency || 1, argv.limit )
  ) ).then( ( ) => {
    if ( argv.download ) {
      // no need to output stats if none have been collected
      process.exit( );
    }
    setTimeout( ( ) => {
      console.log( "Done processing\n" );
      const timeElapsed = _.round( ( Date.now( ) - startTime ) / 1000, 2 );
      const totalProcessed = _.size( matchingIndexes );
      const output = {
        top1: _.size( _.filter( matchingIndexes, i => i < 1 ) ),
        top2: _.size( _.filter( matchingIndexes, i => i < 2 ) ),
        top3: _.size( _.filter( matchingIndexes, i => i < 3 ) ),
        top5: _.size( _.filter( matchingIndexes, i => i < 5 ) ),
        top10: _.size( _.filter( matchingIndexes, i => i < 10 ) ),
        top20: _.size( _.filter( matchingIndexes, i => i < 20 ) ),
        top100: _.size( _.filter( matchingIndexes, i => i < 100 ) ),
        notIn: totalProcessed - _.size( _.filter( matchingIndexes, i => i < 100 ) ),
        withCA: _.size( commonAncestors ),
        withRightCA: _.size( matchingCommonAncestors ),
        top1P: percentage( _.size( _.filter( matchingIndexes, i => i < 1 ) ), totalProcessed ),
        top2P: percentage( _.size( _.filter( matchingIndexes, i => i < 2 ) ), totalProcessed ),
        top3P: percentage( _.size( _.filter( matchingIndexes, i => i < 3 ) ), totalProcessed ),
        top5P: percentage( _.size( _.filter( matchingIndexes, i => i < 5 ) ), totalProcessed ),
        top10P: percentage( _.size( _.filter( matchingIndexes, i => i < 10 ) ), totalProcessed ),
        top20P: percentage( _.size( _.filter( matchingIndexes, i => i < 20 ) ), totalProcessed ),
        top100P: percentage( _.size( _.filter( matchingIndexes, i => i < 100 ) ), totalProcessed ),
        notInP: percentage(
          totalProcessed - _.size( _.filter( matchingIndexes, i => i < 100 ) ), totalProcessed
        ),
        withCAP: percentage( _.size( commonAncestors ), totalProcessed ),
        withRightCAP: percentage( _.size( matchingCommonAncestors ), totalProcessed ),
        score: _.round( _.mean( _.filter( matchingScores, i => i > 0 ) ), 3 ),
        index: _.round( _.mean( _.filter( matchingIndexes, i => i < 100 ) ), 4 )
      };
      console.log( `\t${_.keys( output ).join( "\t" )}\tTime` );
      console.log( `${argv.label}\t${_.values( output ).join( "\t" )}\t${timeElapsed}` );

      console.log( "\n" );
      console.log( ["TotalIndicesRecorded", _.size( matchingIndexes )] );
      console.log( ["SumIndices", _.sum( matchingIndexes )] );
      console.log( ["MeanIndex", _.mean( matchingIndexes )] );
      console.log( ["MeanIndexWhenPresent", _.mean( _.filter( matchingIndexes, i => i < 100 ) )] );
      console.log( ["TotalScoredRecorded", _.size( matchingScores )] );
      console.log( ["SumScores", _.sum( matchingScores )] );
      console.log( ["MeanScore", _.mean( matchingScores )] );
      console.log( ["MeanScoreWhenPresent", _.mean( _.filter( matchingScores, i => i > 0 ) )] );
      console.log( ["MeanIndexWhenPresent", _.mean( _.filter( matchingIndexes, i => i < 100 ) )] );
      console.log( ["CountCommonAncestor", _.size( commonAncestors )] );
      console.log( ["CountRightCommonAncestor", _.size( matchingCommonAncestors )] );
      console.log( ["RightCAP", percentage( _.size( matchingCommonAncestors ), totalProcessed )] );
      console.log( ["RightCAPWhenPresent", percentage( _.size( matchingCommonAncestors ), _.size( commonAncestors ) )] );
      console.log( ["CountInResults", _.size( _.filter( matchingIndexes, i => i < 100 ) )] );
      console.log( ["CountTop1", _.size( _.filter( matchingIndexes, i => i < 1 ) )] );
      console.log( ["CountTop3", _.size( _.filter( matchingIndexes, i => i < 3 ) )] );
      console.log( ["CountTop5", _.size( _.filter( matchingIndexes, i => i < 5 ) )] );
      console.log( ["CountTop10", _.size( _.filter( matchingIndexes, i => i < 10 ) )] );
      console.log( "\nTotally done now. Bye" );
      process.exit( );
    }, 3000 );
  } );
}

console.log( "\n\nRunning with these options:\n" );
console.log( runOptions( ) );

console.log( "\nDelaying to ensure everything is initialized...\n" );
setTimeout( ( ) => {
  require( "events" ).EventEmitter.defaultMaxListeners = ( argv.concurrency || 1 ) * 10;
  startParsing( );
}, 5000 );
