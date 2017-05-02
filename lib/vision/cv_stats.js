"use strict";
/* eslint no-console: 0 */
var _ = require( "lodash" );
var ComputervisionController = require( "../controllers/v1/computervision_controller" );
var ImageCache = require( "./image_cache" );
var pgClient = require( "../pg_client" );
var squel = require( "squel" );
var Promise = require( "bluebird" );
global.config = require( "../../config" );

const rankLevels = {
  100: "root",
  70:  "kingdom",
  60:  "phylum",
  57:  "subphylum",
  53:  "superclass",
  50:  "class",
  47:  "subclass",
  43:  "superorder",
  40:  "order",
  37:  "suborder",
  35:  "infraorder",
  33:  "superfamily",
  32:  "epifamily",
  30:  "family",
  27:  "subfamily",
  26:  "supertribe",
  25:  "tribe",
  24:  "subtribe",
  20:  "genus",
  15:  "subgenus",
  10:  "species",
  5:   "subspecies"
};

var CVStats = class CVStats {

  constructor( ) {
    this.testTaxonAncestors = { };
    this.testObservationMetadata = { };
    this.allScores = [ ];
    this.startPhotoProcessing = this.startPhotoProcessing.bind( this );
  }

  process( testImages ) {
    this.testImages = testImages;
    setTimeout( ( ) => {
      this.lookupTaxonAncestors( );
      this.observationMetadata( );
      setTimeout( this.startPhotoProcessing, 5000 );
    }, 2000 );
  }

  startPhotoProcessing( ) {
    this.startTime = Date.now( );
    let countProcessed = 0;
    // TODO: dumb hack. I just want to loop through all of these
    // promises asynchonously, including the first and last
    this.testImages.push({ some: "thing" });
    this.testImages.unshift({ some: "thing" });
    console.log( "Starting photo processing..." + this.testImages.length );
    Promise.reduce( this.testImages, ( total, ti ) => {
      if ( _.isEmpty( ti.photoID ) ) { return; }
      console.log( {
        pID: ti.photoID,
        tID: ti.taxonID,
        oID: ti.observationID
      } );
      countProcessed += 1;
      if ( countProcessed % 100 === 0 ) {
        console.log( `\n\nProcessed : ${ countProcessed }` );
        this.printStats( );
      }
      return this.scoreThisImage( ti ).then( scores => {
        this.allScores.push( scores );
      }).catch( e => { console.log( e ); });
    }).then( () => {
      console.log( "All done" );
      this.printStats( );
      // this will stop the script
      pgClient.connection.end( err => {
        if ( err ) { console.log( err ); }
      });
    }).catch( e => { console.log( e ); });
  }

  lookupTaxonAncestors( ) {
    console.log( "Looking up ancestors..." );
    const taxonIDs = _.map( this.testImages, "taxonID" );
    const idChunks = _.chunk( taxonIDs, 500 );
    _.each( idChunks, idChunk => {
      var query = squel.select( ).field( "id, ancestry").from( "taxa" ).
        where( "id IN ?", idChunk );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
          if( err ) { return; }
          _.each( result.rows, row => {
            const taxonID = row.id;
            if ( !row.ancestry ) { return; }
            const ancestors = row.ancestry.split( "/" );
            _.each( ancestors, ancestorID => {
              this.testTaxonAncestors[taxonID] = this.testTaxonAncestors[taxonID] || {};
              this.testTaxonAncestors[taxonID][Number(ancestorID)] = true;
            });
          });
        }
      );
    });
  }

  observationMetadata( ) {
    console.log( "Looking up observations..." );
    const observationIDs = _.map( this.testImages, "observationID" );
    const idChunks = _.chunk( observationIDs, 500 );
    _.each( idChunks, idChunk => {
      var query = squel.select( ).
        field( "o.id, o.latitude, o.longitude, o.observed_on, o.iconic_taxon_id" ).
        from( "observations o" ).
        where( "o.id IN ?", idChunk );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
        if( err ) { return; }
        _.each( result.rows, row => {
          const observationID = row.id;
          this.testObservationMetadata[observationID] = row;
        });
      });
    });
  }

  scoreThisImage( ti ) {
    return new Promise( ( resolve, reject ) => {
      const url = `http://static.inaturalist.org/photos/${ti.photoID}/medium.${ti.extension}`;
      const fileName = `${ti.photoID}_medium.${ti.extension}`;
      ImageCache.cacheURL( url, fileName, ( err, path ) => {
        if ( err ) { return reject( err ); }
        let body = { };
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
        ComputervisionController.scoreImageUpload( path,
          {
            body,
            inat: { visionStats: true, visionCacheKey: `${ti.photoID}${ti.observationID}` },
            query: { per_page: 100 },
            file: { }
          }, ( err, response ) => {
            if ( err ) { return reject( err ); }
            let matchingIndex;
            let matchingVisionScore;
            let matchingFrequencyScore;
            let testInCommonAncestor;
            _.each( response.results, ( r, index ) => {
              if ( !_.isUndefined( matchingIndex ) ) { return; }
              if ( Number( r.taxon_id ) === Number( ti.taxonID ) ) {
                matchingIndex = index;
                matchingVisionScore = r.vision_score;
                matchingFrequencyScore = r.frequency_score;
              }
            });
            if ( response.common_ancestor ) {
              testInCommonAncestor =
                (( Number( response.common_ancestor.taxon.id ) === Number( ti.taxonID ) ) ||
                ( this.testTaxonAncestors[ti.taxonID] &&
                  this.testTaxonAncestors[ti.taxonID][response.common_ancestor.taxon.id]));
            }
            resolve( {
              matchingIndex,
              matchingVisionScore,
              matchingFrequencyScore,
              commonAncestor: response.common_ancestor,
              testInCommonAncestor
            } );
          }
        );
      });
    });
  }

  printStats( ) {
    const elapsedTime = _.round( ( Date.now( ) - this.startTime ) / 1000, 2 );
    const inResultScores = [ ];
    const top10Scores = [ ];
    const notTop10Scores = [ ];
    let withCommonAncestor = 0;
    let withRightCommonAncestor = 0;
    const countsOfEachIndex = { };
    const visionIndexScores = { };
    const allAncestorRankLevels = [ ];
    const countsOfEachAncestorRank = { };

    console.log( `\n\nElapsed time: ${ elapsedTime }s` );
    _.each( this.allScores, s => {
      if ( !_.isUndefined( s.matchingIndex ) ) {
        countsOfEachIndex[s.matchingIndex] =
          ( countsOfEachIndex[s.matchingIndex] || 0 ) + 1;
        visionIndexScores[s.matchingIndex] = visionIndexScores[s.matchingIndex] || [];
        visionIndexScores[s.matchingIndex].push( s.matchingVisionScore );
        inResultScores.push( s.matchingIndex  );
        if ( s.matchingIndex < 10 ) {
          top10Scores.push( s.matchingIndex  );
        } else {
          notTop10Scores.push( s.matchingIndex  );
        }
      }
      if ( s.commonAncestor ) {
        withCommonAncestor += 1;
        allAncestorRankLevels.push( s.commonAncestor.taxon.rank_level );
        countsOfEachAncestorRank[s.commonAncestor.taxon.rank_level] =
          ( countsOfEachAncestorRank[s.commonAncestor.taxon.rank_level] || 0 ) + 1;
      }
      if ( s.testInCommonAncestor ) { withRightCommonAncestor += 1; }
    });
    console.log( `Total Photos Processed : ${ this.allScores.length }` );
    console.log( `# in top 100           : ${ inResultScores.length } (${ CVStats.percentage( inResultScores, this.allScores ) })` );
    console.log( `# in top 10            : ${ top10Scores.length } (${ CVStats.percentage( top10Scores, this.allScores ) })` );
    console.log( `# w/ common ancestor   : ${ withCommonAncestor } (${ CVStats.percentage( withCommonAncestor, this.allScores ) })` );
    console.log( `# w/ right ancestor    : ${ withRightCommonAncestor } (${ CVStats.percentage( withRightCommonAncestor, this.allScores ) })` );
    console.log( `# % right ancestor     : ${ CVStats.percentage( withRightCommonAncestor, withCommonAncestor ) }` );
    console.log( `# avg anc. rank_level  : ${ CVStats.mean( allAncestorRankLevels ) }` );

    console.log( "Index frequencies:" );
    console.log( "index\toccurrences\taverage score" );
    _.each( _.range( 0, 20 ), index => {
      const count = countsOfEachIndex[ index ] || 0;
      const avg = visionIndexScores[ index ] ? CVStats.mean( visionIndexScores[ index ] ) : 0;
      console.log( `${ index + 1 }\t${ count }\t${ avg }`);
    });
    const notInResultCount = this.allScores.length - inResultScores.length;
    console.log( `N/A\t${ notInResultCount }\t0`);
    console.log( "\n" );

    console.log( "Common Ancestor Rank frequencies:" );
    console.log( "rank\toccurrences" );
    let ancestorRankLevels = _.keys( countsOfEachAncestorRank );
    ancestorRankLevels.sort( );
    ancestorRankLevels.reverse( );
    _.each( ancestorRankLevels, rankLevel => {
      const count = countsOfEachAncestorRank[ rankLevel ] || 0;
      console.log( `${ rankLevels[rankLevel] }\t${ count }`);
    });
    console.log( "\n" );
  }

  static percentage( numeratorArr, divisorArr ) {
    const numerator = _.isArray( numeratorArr ) ? numeratorArr.length : numeratorArr;
    const denominator = _.isArray( divisorArr ) ? divisorArr.length : divisorArr;
    return `${ _.round( ( numerator * 100 ) / denominator, 2 ) }%`;
  }

  static mean( arr ) {
    return _.round( _.sum( arr ) / arr.length, 3 );
  }

}

module.exports = CVStats;
