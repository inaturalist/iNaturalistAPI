const _ = require( "lodash" );
const fs = require( "fs" );
const csv = require( "fast-csv" );
const PromisePool = require( "es6-promise-pool" );
const FileCache = require( "./file_cache" );
const ImageCache = require( "./image_cache" );
const ComputervisionController = require( "../controllers/v1/computervision_controller" );

const scoreImageOptions = [
  "skip_frequencies",
  "db_frequencies",
  "redis_frequencies",
  "must_be_in_frequency",
  "must_be_in_vision",
  "frequency_only_remove"
];

const CVParser = class CVParser {
  static lineParse( line ) {
    const splitLine = line.replace( /(\[|\]|"| )/g, "" ).split( "," );
    const data = _.map( splitLine, v => {
      const num = Number( v );
      return ( num || num === 0 ) ? num : v;
    } );
    return data;
  }

  readExportTestDataCSV( dataPath ) {
    return new Promise( resolve => {
      const stream = fs.createReadStream( dataPath );
      this.testData = [];
      csv.fromStream( stream, { headers: true } )
        .on( "data", data => {
          const matches = data.filename
            .match( /static.inaturalist.org\/photos\/([0-9]+)\/medium\.(jpe?g)[?\n]/i );
          if ( matches ) {
            this.testData.push( {
              photo_id: matches[1],
              photo_extension: matches[2],
              labels: CVParser.lineParse( data.multitask_labels ),
              texts: CVParser.lineParse( data.multitask_texts ),
              weights: CVParser.lineParse( data.multitask_weights )
            } );
          }
        } ).on( "end", ( ) => {
          console.log( "Done readCSV" );
          resolve( );
        } );
    } );
  }

  readTestData( dataPath, maxRows = 1000000 ) {
    return new Promise( resolve => {
      const stream = fs.createReadStream( dataPath );
      this.testData = [];
      csv.fromStream( stream, { headers: true } )
        .on( "data", data => {
          const matches = data.photo_url
            .match( /static.inaturalist.org\/photos\/([0-9]+)\/medium\.(jpe?g)/i );
          if ( matches && this.testData.length < maxRows ) {
            this.testData.push( Object.assign( data, {
              photo_id: matches[1],
              photo_extension: matches[2]
            } ) );
          }
        } ).on( "end", ( ) => {
          console.log( "Done readTestData" );
          resolve( );
        } );
    } );
  }

  static cachedScoreImage( imagePath, imageData, options = { } ) {
    return new Promise( ( resolve, reject ) => {
      let cacheKey;
      if ( options.cache_key ) {
        cacheKey = `${imagePath}-${options.cache_key}`;
        _.each( scoreImageOptions, option => {
          if ( options[option] ) {
            cacheKey += `-${option}`;
          }
        } );
        const cachedScores = FileCache.cacheExists( cacheKey );
        if ( cachedScores ) {
          const json = JSON.parse( cachedScores );
          return void resolve( json );
        }
      }
      CVParser.fetchScoresForImage( imagePath, imageData, options ).then( scores => {
        if ( cacheKey ) {
          FileCache.cacheFile( cacheKey, JSON.stringify( scores ) );
        }
        resolve( scores );
      } ).catch( e => {
        console.log( e );
        reject( e );
      } );
    } );
  }

  static fetchScoresForImage( imagePath, imageData, options = { } ) {
    return new Promise( ( resolve, reject ) => {
      const body = { };
      if ( imageData.iconic_taxon_id ) {
        body.taxon_id = imageData.iconic_taxon_id;
      }
      if ( imageData.lat && imageData.lng ) {
        body.lat = imageData.lat;
        body.lng = imageData.lng;
      }
      if ( imageData.observed_on ) {
        body.observed_on = imageData.observed_on;
      }
      _.each( scoreImageOptions, option => {
        if ( options[option] ) {
          // make the body property a string, since express params will be strings
          body[option] = "true";
        }
      } );
      ComputervisionController.scoreImageUpload( imagePath, {
        body,
        inat: { visionStats: true, visionCacheKey: `${imagePath}-cvparser-raw-vision` },
        query: { per_page: 100 },
        file: { }
      }, ( err, response ) => {
        if ( err ) { return void reject( err ); }
        resolve( response );
      } );
    } );
  }

  static cachePhoto( imageData ) {
    return new Promise( resolve => {
      const imageUrl = `https://static.inaturalist.org/photos/${imageData.photo_id}`
        + `/medium.${imageData.photo_extension}`;
      const fileName = `${imageData.photo_id}_medium.${imageData.photo_extension}`;
      ImageCache.cacheURL( imageUrl, fileName, ( err, cachePath ) => {
        if ( err ) {
          console.log( err );
          return resolve( );
        }
        return resolve( cachePath );
      } );
    } );
  }

  parallelProcessPhotos( processor, concurrency = 1, maxIterations = 0 ) {
    return new Promise( ( resolve, reject ) => {
      if ( processor.constructor.name !== "Function" ) {
        return void reject( new Error( "CVParser :: processor must be a Function" ) );
      }
      let processDataIndex = 0;
      const startTime = Date.now( );
      const promiseProducer = ( ) => {
        if ( maxIterations > 0 && processDataIndex >= maxIterations ) {
          return null;
        }
        const nextEntry = this.testData[processDataIndex];
        processDataIndex += 1;
        if ( processDataIndex % 100 === 0 ) {
          const timeElapsed = ( Date.now( ) - startTime ) / 1000;
          const perSecond = processDataIndex / timeElapsed;
          const secondsLeft = ( _.size( this.testData ) - processDataIndex ) / perSecond;
          console.log( `Processed ${processDataIndex} lines in ${_.round( timeElapsed, 2 )}s; `
            + `${_.round( perSecond, 2 )}/s; ${_.round( secondsLeft, 2 )}s left` );
        }
        return nextEntry ? processor( nextEntry ) : null;
      };
      const pool = new PromisePool( promiseProducer, concurrency );

      // start the promise pool to write the cell cache files
      pool.start( ).then( ( ) => {
        console.log( "Done parallelProcessPhotos" );
        resolve( );
      } );
    } );
  }
};

module.exports = CVParser;
