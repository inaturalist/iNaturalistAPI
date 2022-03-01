/* eslint no-console: 0 */
const _ = require( "lodash" );
const squel = require( "safe-squel" );
const Promise = require( "bluebird" );
const ComputervisionController = require( "../controllers/v1/computervision_controller" );
const ImageCache = require( "./image_cache" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
global.config = require( "../../config" );

const rankLevels = {
  100: "root",
  70: "kingdom",
  60: "phylum",
  57: "subphylum",
  53: "superclass",
  50: "class",
  47: "subclass",
  43: "superorder",
  40: "order",
  37: "suborder",
  35: "infraorder",
  33: "superfamily",
  32: "epifamily",
  30: "family",
  27: "subfamily",
  26: "supertribe",
  25: "tribe",
  24: "subtribe",
  20: "genus",
  15: "subgenus",
  10: "species",
  5: "subspecies"
};

const CVStats = class CVStats {
  constructor( ) {
    this.startPhotoProcessing = this.startPhotoProcessing.bind( this );
  }

  process( testImages, options, callback ) {
    this.testImages = _.shuffle( testImages );
    setTimeout( ( ) => {
      this.lookupTaxonAncestors( );
      this.observationMetadata( );
      setTimeout( ( ) => {
        this.startPhotoProcessing( options, callback );
      }, 10000 );
    }, 4000 );
  }

  reprocess( testImages, options, callback ) {
    this.testImages = _.shuffle( testImages );
    this.startPhotoProcessing( options, callback );
  }

  startPhotoProcessing( options, callback ) {
    this.startTime = Date.now( );
    this.allScores = [];
    let countScored = 0;
    // TODO: dumb hack. I just want to loop through all of these
    // promises asynchonously, including the first and last
    this.testImages.push( { some: "thing" } );
    this.testImages.unshift( { some: "thing" } );
    Promise.reduce( this.testImages, ( total, ti ) => {
      if ( _.isEmpty( ti.photoID ) ) { return null; }
      return this.scoreThisImage( ti, options ).then( scores => {
        if ( scores ) {
          countScored += 1;
          this.allScores.push( scores );
          if ( countScored % 10000 === 0 ) {
            const results = this.getStats( );
            CVStats.statsOutput( results );
          }
        }
      } ).catch( e => { util.debug( e ); } );
    } ).then( () => {
      callback( null, this.getStats( ) );
    } ).catch( e => {
      util.debug( e );
      callback( e );
    } );
  }

  lookupTaxonAncestors( ) {
    util.debug( "Looking up ancestors..." );
    this.testTaxonAncestors = { };
    const taxonIDs = _.compact( _.map( this.testImages, "taxonID" ) );
    const idChunks = _.chunk( taxonIDs, 500 );
    _.each( idChunks, idChunk => {
      const query = squel.select( ).field( "id, ancestry" ).from( "taxa" )
        .where( "id IN ?", idChunk );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
        if ( err ) { return; }
        _.each( result.rows, row => {
          const taxonID = row.id;
          if ( !row.ancestry ) { return; }
          const ancestors = row.ancestry.split( "/" );
          _.each( ancestors, ancestorID => {
            this.testTaxonAncestors[taxonID] = this.testTaxonAncestors[taxonID] || {};
            this.testTaxonAncestors[taxonID][Number( ancestorID )] = true;
          } );
        } );
      } );
    } );
  }

  observationMetadata( ) {
    util.debug( "Looking up observations..." );
    this.testObservationMetadata = { };
    const observationIDs = _.compact( _.map( this.testImages, "observationID" ) );
    const idChunks = _.chunk( observationIDs, 500 );
    _.each( idChunks, idChunk => {
      const query = squel.select( )
        .field( "o.id, o.latitude, o.longitude, o.observed_on, o.iconic_taxon_id" )
        .from( "observations o" )
        .where( "o.id IN ?", idChunk );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
        if ( err ) { return; }
        _.each( result.rows, row => {
          const observationID = row.id;
          this.testObservationMetadata[observationID] = row;
        } );
      } );
    } );
  }

  scoreThisImage( ti, options ) {
    options = options ? Object.assign( { }, options ) : { };
    return new Promise( ( resolve, reject ) => {
      const url = `http://static.inaturalist.org/photos/${ti.photoID}/medium.${ti.extension}`;
      const fileName = `${ti.photoID}_medium.${ti.extension}`;
      ImageCache.cacheURL( url, fileName, ( err, path ) => {
        if ( err ) { return void reject( err ); }
        const body = options.body ? Object.assign( { }, options.body ) : { };
        const metadata = this.testObservationMetadata[ti.observationID];
        if ( metadata ) {
          if ( metadata.iconic_taxon_id ) {
            body.taxon_id = metadata.iconic_taxon_id;
          }
          if ( metadata.latitude && metadata.longitude ) {
            body.lat = metadata.latitude;
            body.lng = metadata.longitude;
          }
          if ( metadata.observed_on ) {
            body.observed_on = metadata.observed_on;
          }
        }
        if ( options.skip_frequencies === true ) {
          body.skip_frequencies = true;
        }
        ComputervisionController.scoreImageUpload( path,
          {
            body,
            inat: { visionStats: true, visionCacheKey: `${ti.photoID}-${ti.observationID}` },
            query: { per_page: 100 },
            file: { }
          }, ( errr, response ) => {
            if ( errr ) { return void reject( errr ); }
            let matchingIndex;
            let matchingVisionScore;
            let matchingFrequencyScore;
            let testInCommonAncestor;
            let matchingCombinedScore;
            let firstCombinedScore;
            _.each( response.results, ( r, index ) => {
              if ( index === 0 ) {
                firstCombinedScore = r.count;
              }
              if ( !_.isUndefined( matchingIndex ) ) { return; }
              if ( Number( r.taxon_id ) === Number( ti.taxonID ) ) {
                matchingIndex = index;
                matchingVisionScore = r.vision_score;
                matchingFrequencyScore = r.frequency_score;
                matchingCombinedScore = r.count;
              }
            } );
            if ( response.common_ancestor ) {
              testInCommonAncestor = (
                ( Number( response.common_ancestor.taxon.id ) === Number( ti.taxonID ) )
                || ( this.testTaxonAncestors[ti.taxonID]
                  && this.testTaxonAncestors[ti.taxonID][response.common_ancestor.taxon.id] ) );
            }
            resolve( {
              matchingIndex,
              matchingVisionScore,
              matchingFrequencyScore,
              commonAncestor: response.common_ancestor,
              testInCommonAncestor,
              matchingCombinedScore,
              firstCombinedScore
            } );
          } );
      } );
    } );
  }

  getStats( ) {
    const inResultScores = [];
    const top10Scores = [];
    const top5Scores = [];
    const top2Scores = [];
    const top1Scores = [];
    const top1CombinedScores = [];
    let withCommonAncestor = 0;
    let withRightCommonAncestor = 0;
    const countsOfEachIndex = { };
    const allAncestorRankLevels = [];
    const countsOfEachAncestorRank = { };
    const topFirstCombinedScores = [];

    _.each( this.allScores, s => {
      if ( !_.isUndefined( s.matchingIndex ) ) {
        countsOfEachIndex[s.matchingIndex] = (
          countsOfEachIndex[s.matchingIndex] || 0 ) + 1;
        inResultScores.push( s.matchingIndex );
        topFirstCombinedScores.push( s.firstCombinedScore );
        if ( s.matchingIndex < 10 ) {
          top10Scores.push( s.matchingIndex );
        }
        if ( s.matchingIndex < 5 ) {
          top5Scores.push( s.matchingIndex );
        }
        if ( s.matchingIndex < 2 ) {
          top2Scores.push( s.matchingIndex );
        }
        if ( s.matchingIndex < 1 ) {
          top1Scores.push( s.matchingIndex );
          top1CombinedScores.push( s.matchingCombinedScore );
        }
      }
      if ( s.commonAncestor ) {
        withCommonAncestor += 1;
        allAncestorRankLevels.push( s.commonAncestor.taxon.rank_level );
        countsOfEachAncestorRank[s.commonAncestor.taxon.rank_level] = (
          countsOfEachAncestorRank[s.commonAncestor.taxon.rank_level] || 0 ) + 1;
      }
      if ( s.testInCommonAncestor ) { withRightCommonAncestor += 1; }
    } );
    return {
      total: this.allScores.length,
      top100: inResultScores.length,
      top10: top10Scores.length,
      top5: top5Scores.length,
      top2: top2Scores.length,
      top1: top1Scores.length,
      averageScore: CVStats.mean( _.map( this.allScores, "matchingIndex" ) ),
      withCommonAncestor,
      withRightCommonAncestor,
      averageAncestorRankLevel: CVStats.mean( allAncestorRankLevels ),
      countsOfEachIndex,
      countsOfEachAncestorRank,
      top1AverageScore: CVStats.mean( top1CombinedScores ),
      averageFirstCombinedScore: CVStats.mean( topFirstCombinedScores ),
      averageInResultScores: CVStats.mean( inResultScores )
    };
  }

  printStats( ) {
    const stats = this.getStats( );
    const elapsedTime = _.round( ( Date.now( ) - this.startTime ) / 1000, 2 );
    util.debug( `\n\nElapsed time: ${elapsedTime}s` );
    util.debug( `Total Photos Processed : ${stats.total}` );
    util.debug( `# in top 100           : ${stats.top100} (${CVStats.percentage( stats.top100, stats.total )} )` );
    util.debug( `# in top 10            : ${stats.top10} (${CVStats.percentage( stats.top10, stats.total )} )` );
    util.debug( `# w/ common ancestor   : ${stats.withCommonAncestor} (${CVStats.percentage( stats.withCommonAncestor, stats.total )} )` );
    util.debug( `# w/ right ancestor    : ${stats.withRightCommonAncestor} (${CVStats.percentage( stats.withRightCommonAncestor, stats.total )} )` );
    util.debug( `# % right ancestor     : ${CVStats.percentage( stats.withRightCommonAncestor, stats.withCommonAncestor )}` );
    util.debug( `# avg anc. rank_level  : ${stats.averageAncestorRankLevel}` );

    util.debug( "Index frequencies:" );
    util.debug( "index\toccurrences\taverage score" );
    _.each( _.range( 0, 20 ), index => {
      const count = stats.countsOfEachIndex[index] || 0;
      util.debug( `${index + 1}\t${count}` );
    } );
    const notInResultCount = stats.total - stats.top100;
    util.debug( `N/A\t${notInResultCount}\t0` );
    util.debug( "\n" );

    util.debug( "Common Ancestor Rank frequencies:" );
    util.debug( "rank\toccurrences" );
    const ancestorRankLevels = _.keys( stats.countsOfEachAncestorRank );
    ancestorRankLevels.sort( );
    ancestorRankLevels.reverse( );
    _.each( ancestorRankLevels, rankLevel => {
      const count = stats.countsOfEachAncestorRank[rankLevel] || 0;
      console.log( `${rankLevels[rankLevel]}\t${count}` );
    } );
    console.log( "\n" );
  }

  static percentage( numeratorArr, divisorArr ) {
    const numerator = _.isArray( numeratorArr ) ? numeratorArr.length : numeratorArr;
    const denominator = _.isArray( divisorArr ) ? divisorArr.length : divisorArr;
    return `${_.round( ( numerator * 100 ) / denominator, 2 )}`;
  }

  static mean( arr ) {
    return _.round( _.sum( arr ) / arr.length, 3 );
  }

  static statsOutput( results ) {
    const withCA = CVStats.percentage( results.withCommonAncestor, results.total );
    const totalRight = CVStats.percentage( results.withRightCommonAncestor, results.total );
    const withRight = CVStats.percentage( results.withRightCommonAncestor,
      results.withCommonAncestor );
    const percentTop10 = CVStats.percentage( results.top10, results.total );
    const percentTop5 = CVStats.percentage( results.top5, results.total );
    const percentTop2 = CVStats.percentage( results.top2, results.total );
    const percentTop1 = CVStats.percentage( results.top1, results.total );
    console.log(
      `${results.total}\t${withCA}\t${totalRight}\t${withRight}\t${results.top10}\t`
      + `${results.top5}\t${results.top2}\t${results.top1}\t${results.averageScore}\t`
      + `${percentTop10}\t${percentTop5}\t${percentTop2}\t${percentTop1}\t${results.top1AverageScore}\t`
      + `${results.averageFirstCombinedScore}\t${results.averageInResultScores}`
    );
  }
};

module.exports = CVStats;
