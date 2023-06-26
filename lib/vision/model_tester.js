/* eslint-disable no-console */
const _ = require( "lodash" );
const CVParser = require( "./cv_parser" );

const percentage = function ( numeratorArr, divisorArr ) {
  const numerator = _.isArray( numeratorArr ) ? numeratorArr.length : numeratorArr;
  const denominator = _.isArray( divisorArr ) ? divisorArr.length : divisorArr;
  return _.round( ( numerator * 100 ) / denominator, 2 );
};

const ModelTester = class ModelTester {
  constructor( argv ) {
    this.matchingIndexes = [];
    this.matchingScores = [];
    this.commonAncestors = [];
    this.resultsCounts = [];
    this.sumAncestorDistanceScores = [];
    this.meanAncestorDistanceScores = [];
    this.matchingCommonAncestors = [];
    this.runOptions = ModelTester.runOptions( argv );
  }

  static runOptions( argv ) {
    const customArgs = _.pickBy( argv, ( value, key ) => ( key !== "_" && key !== "$0" ) );
    const options = _.mapKeys( customArgs, ( value, key ) => _.snakeCase( key ) );
    // console.log( options );
    if ( argv.nofreq ) {
      options.skip_frequencies = true;
    }
    if ( argv.redis ) {
      options.redis_frequencies = true;
    }
    if ( argv.local ) {
      options.must_be_in_frequency = true;
    }
    return options;
  }

  async photoJob( imageData ) {
    try {
      if ( this.runOptions.download ) {
        await CVParser.cachePhoto( imageData );
        return;
      }
      if ( this.runOptions.id && Number( imageData.observation_id ) !== this.runOptions.id ) {
        return;
      }
      const cachePath = await CVParser.cachePhoto( imageData );
      const scores = await CVParser.cachedScoreImage( cachePath, imageData, this.runOptions );
      let matchingIndex;
      const resultAncestorDistanceScores = [];

      if ( scores.common_ancestor && scores.common_ancestor.taxon ) {
        this.commonAncestors.push( true );
        if ( _.includes( imageData.taxon_ancestry.split( "/" ), _.toString( scores.common_ancestor.taxon.id ) ) ) {
          this.matchingCommonAncestors.push( true );
        }
      }
      const targetAncestorsReversed = imageData.taxon_ancestry.split( "/" ).reverse( );
      let countOfResultsUsed = 0;
      _.each( scores.results, ( r, index ) => {
        if ( this.runOptions.must_be_in_frequency && !r.frequency_score ) {
          return;
        }
        if ( index < 8 ) {
          countOfResultsUsed += 1;
        }
        const retultAncestors = r.taxon.ancestry.split( "/" );
        retultAncestors.push( r.taxon.id.toString( ) );
        let resultAncestorMatchIndex;
        _.each( targetAncestorsReversed, ( targetAncestorID, ancestorIndex ) => {
          if ( !_.isUndefined( resultAncestorMatchIndex ) ) { return; }
          if ( _.includes( retultAncestors, targetAncestorID ) ) {
            resultAncestorMatchIndex = ancestorIndex;
          }
        } );
        resultAncestorMatchIndex ||= targetAncestorsReversed.length;
        const resultAncestorDistanceScore = ( 1 - (
          resultAncestorMatchIndex / targetAncestorsReversed.length ) ) ** 2;
        resultAncestorDistanceScores.push( resultAncestorDistanceScore );

        if ( !_.isUndefined( matchingIndex ) ) { return; }
        if ( Number( r.taxon.id ) === Number( imageData.taxon_id ) ) {
          matchingIndex = index;
          this.matchingIndexes.push( index );
          this.matchingScores.push( r.combined_score );
        }
      } );
      this.resultsCounts.push( countOfResultsUsed );
      if ( _.isUndefined( matchingIndex ) ) {
        this.matchingIndexes.push( 100 );
        this.matchingScores.push( 0 );
      }
      this.sumAncestorDistanceScores.push( _.sum( resultAncestorDistanceScores ) );
      if ( !_.isEmpty( resultAncestorDistanceScores ) ) {
        this.meanAncestorDistanceScores.push( _.mean( resultAncestorDistanceScores ) );
      }
    } catch ( e ) {
      console.debug( e );
      console.log( e.name || e.message );
    }
  }

  summaryMetrics( startTime ) {
    const timeElapsed = _.round( ( Date.now( ) - startTime ) / 1000, 2 );
    const totalProcessed = _.size( this.matchingIndexes );
    const metrics = {
      total: _.size( this.matchingIndexes ),
      top1: _.size( _.filter( this.matchingIndexes, i => i < 1 ) ),
      top2: _.size( _.filter( this.matchingIndexes, i => i < 2 ) ),
      top3: _.size( _.filter( this.matchingIndexes, i => i < 3 ) ),
      top5: _.size( _.filter( this.matchingIndexes, i => i < 5 ) ),
      top10: _.size( _.filter( this.matchingIndexes, i => i < 10 ) ),
      top20: _.size( _.filter( this.matchingIndexes, i => i < 20 ) ),
      top100: _.size( _.filter( this.matchingIndexes, i => i < 100 ) ),
      notIn: totalProcessed - _.size( _.filter( this.matchingIndexes, i => i < 100 ) ),
      withCA: _.size( this.commonAncestors ),
      withRightCA: _.size( this.matchingCommonAncestors ),
      "top1%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 1 ) ), totalProcessed ),
      "top2%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 2 ) ), totalProcessed ),
      "top3%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 3 ) ), totalProcessed ),
      "top5%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 5 ) ), totalProcessed ),
      "top10%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 10 ) ), totalProcessed ),
      "top20%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 20 ) ), totalProcessed ),
      "top100%": percentage( _.size( _.filter( this.matchingIndexes, i => i < 100 ) ), totalProcessed ),
      "notIn%": percentage(
        totalProcessed - _.size( _.filter( this.matchingIndexes, i => i < 100 ) ),
        totalProcessed
      ),
      "withCA%": percentage( _.size( this.commonAncestors ), totalProcessed ),
      "withRightCA%": percentage( _.size( this.matchingCommonAncestors ), totalProcessed ),
      "withRightCAWhenPresent%": percentage( _.size( this.matchingCommonAncestors ), _.size( this.commonAncestors ) ),
      sumIndices: _.sum( this.matchingIndexes ),
      meanIndex: _.mean( this.matchingIndexes ),
      meanIndexWhenPresent: _.mean( _.filter( this.matchingIndexes, i => i < 100 ) ),
      sumScores: _.sum( this.matchingScores ),
      meanScore: _.mean( this.matchingScores ),
      meanScoreWhenPresent: _.mean( _.filter( this.matchingScores, i => i > 0 ) ),
      score: _.mean( _.filter( this.matchingScores, i => i > 0 ) ),
      meanAncestorDistanceSum: _.mean( this.sumAncestorDistanceScores ),
      meanAncestorDistanceMean: _.mean( this.meanAncestorDistanceScores ),
      avgResultCount: _.mean( this.resultsCounts ),
      timeInSeconds: timeElapsed
    };
    return metrics;
  }

  startParsing( ) {
    // eslint-disable-next-line global-require
    require( "events" ).EventEmitter.defaultMaxListeners = ( this.runOptions.concurrency || 1 ) * 10;
    const parser = new CVParser( );
    const startTime = Date.now( );
    parser.readTestData( this.runOptions.path, this.runOptions.limit )
      .then( ( ) => parser.parallelProcessPhotos(
        this.photoJob.bind( this ),
        this.runOptions.concurrency || 1,
        Number( this.runOptions.limit )
      ) )
      .then( ( ) => {
        if ( this.runOptions.download ) {
          // no need to output stats if none have been collected
          process.exit( );
        }
        setTimeout( ( ) => {
          console.log( "Done processing\n" );
          const output = this.summaryMetrics( startTime );
          console.log( `\t${_.keys( output ).join( "\t" )}` );
          console.log( `${this.runOptions.label}\t${
            _.map( _.values( output ), v => _.round( v, 4 ) ).join( "\t" )
          }\n` );
          _.each( output, ( v, k ) => {
            console.log( [k, _.round( v, 4 )] );
          } );
          console.log( "\nFinished\n" );
          process.exit( );
        }, 3000 );
      } );
  }
};

module.exports = ModelTester;
