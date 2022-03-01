/* eslint-disable no-console */
const _ = require( "lodash" );
const fs = require( "fs" );
const zlib = require( "zlib" );
const tar = require( "tar" );
const path = require( "path" );
const squel = require( "safe-squel" );
const PromisePool = require( "es6-promise-pool" );
const moment = require( "moment" );
const { S3Client } = require( "@aws-sdk/client-s3" );
const { Upload } = require( "@aws-sdk/lib-storage" );
const Pool = require( "./pg_pool" );
const util = require( "./util" );
const config = require( "../config" );

const fsPromises = fs.promises;

const BATCH_SIZE = 10000;

const VALID_EXTENSIONS = {
  png: true,
  jpg: true,
  jpeg: true,
  gif: true
};

const S3client = new S3Client( { region: config.aws.openDataRegion || "us-east-1" } );

const PHOTO_DOMAIN = ( config.aws && config.aws.openDataDomain )
  ? config.aws.openDataDomain : null;

const LICENSES = {
  0: "all rights reserved",
  1: "CC-BY-NC-SA",
  2: "CC-BY-NC",
  3: "CC-BY-NC-ND",
  4: "CC-BY",
  5: "CC-BY-SA",
  6: "CC-BY-ND",
  7: "PD",
  8: "GFDL",
  9: "CC0"
};

const OPEN_LICENSES = _.pickBy( LICENSES, l => l.match( "(CC|PD)" ) );

const PHOTOS_COLUMNS = [
  "photo_uuid",
  "photo_id",
  "observation_uuid",
  "observer_id",
  "extension",
  "license",
  "width",
  "height",
  "position"
];

const OBSERVATIONS_COLUMNS = [
  "observation_uuid",
  "observer_id",
  "latitude",
  "longitude",
  "positional_accuracy",
  "taxon_id",
  "quality_grade",
  "observed_on"
];

const OBSERVERS_COLUMNS = [
  "observer_id",
  "login",
  "name"
];

const TAXA_COLUMNS = [
  "taxon_id",
  "ancestry",
  "rank_level",
  "rank",
  "name",
  "active"
];

const userIDsWritten = { };

const license = code => {
  if ( !code || !LICENSES[code] ) {
    return LICENSES[0];
  }
  return LICENSES[code];
};

const OpenDataArchive = class OpenDataArchive {
  constructor( options = { } ) {
    this.runOptions = options;
  }

  async createArchive( ) {
    await this.initialize( );
    await this.parallelProcessPhotos( this.runOptions.concurrency || 1 );
    await this.parallelProcessTaxa( this.runOptions.concurrency || 1 );
    if ( _.isEmpty( config.aws.openDataBucket ) ) {
      return;
    }
    await this.uploadGzippedFiles( );
    await this.uploadGzippedArchive( );
  }

  async initialize( ) {
    if ( _.isEmpty( PHOTO_DOMAIN ) ) {
      throw new Error( "config.aws.open_data_domain is undefined" );
    }
    if ( _.isEmpty( this.runOptions.dir ) ) {
      throw new Error( "output dir is undefined" );
    }
    if ( _.isEmpty( config.aws.openDataBucket ) ) {
      console.log( "NOTE: config.aws.openDataBucket is undefined. The archive will not be uploaded to S3" );
    }
    if ( _.isEmpty( config.aws.openDataRegion ) ) {
      console.log( "NOTE: config.aws.openDataRegion is undefined. us-east-1 is the assumed default" );
    }
    console.log( "" );

    await this.createOutputDir( );
    this.createCSVFiles( );
  }

  async createOutputDir( ) {
    try {
      /* eslint-disable-next-line no-bitwise */
      await fsPromises.access( this.runOptions.dir, fs.constants.R_OK | fs.constants.W_OK );
    } catch ( err ) {
      throw new Error(
        `output dir [${this.runOptions.dir}] does not exist or you do not have read/write permission`
      );
    }
    const todaysDate = moment( ).format( "YYYYMMDD" );
    this.outputDirName = `inaturalist-open-data-${todaysDate}`;
    this.outputDir = path.join( this.runOptions.dir, this.outputDirName );
    if ( !fs.existsSync( this.outputDir ) ) {
      fs.mkdirSync( this.outputDir );
    }
  }

  createCSVFiles( ) {
    this.photoFileStream = fs.createWriteStream(
      path.join( this.outputDir, "photos.csv" ), { flags: "w" }
    );
    this.photoFileStream.write( `${PHOTOS_COLUMNS.join( "\t" )}\n` );

    this.obsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "observations.csv" ), { flags: "w" }
    );
    this.obsFileStream.write( `${OBSERVATIONS_COLUMNS.join( "\t" )}\n` );

    this.observersFileStream = fs.createWriteStream(
      path.join( this.outputDir, "observers.csv" ), { flags: "w" }
    );
    this.observersFileStream.write( `${OBSERVERS_COLUMNS.join( "\t" )}\n` );

    this.taxaFileStream = fs.createWriteStream(
      path.join( this.outputDir, "taxa.csv" ), { flags: "w" }
    );
    this.taxaFileStream.write( `${TAXA_COLUMNS.join( "\t" )}\n` );
  }

  async uploadGzippedArchive( ) {
    await this.gzipArchive( );
    console.log( `Uploading ${this.outputDir}.tar.gz` );

    const datedArchiveUpload = new Upload( {
      client: S3client,
      queueSize: 4,
      partSize: 500 * 1024 * 1024,
      leavePartsOnError: false,
      params: {
        Bucket: config.aws.openDataBucket,
        Key: `metadata/${this.outputDirName}.tar.gz`,
        Body: fs.createReadStream( `${this.outputDir}.tar.gz` ),
        ACL: config.aws.openDataACL || "public-read",
        ContentEncoding: "gzip"
      }
    } );
    datedArchiveUpload.on( "httpUploadProgress", progress => {
      console.log( progress );
    } );
    await datedArchiveUpload.done();

    // upload again to inaturalist-open-data-latest. The file can unfortunately be too large to copy
    const mainArchiveUpload = new Upload( {
      client: S3client,
      queueSize: 4,
      partSize: 500 * 1024 * 1024,
      leavePartsOnError: false,
      params: {
        Bucket: config.aws.openDataBucket,
        Key: "metadata/inaturalist-open-data-latest.tar.gz",
        Body: fs.createReadStream( `${this.outputDir}.tar.gz` ),
        ACL: config.aws.openDataACL || "public-read",
        ContentEncoding: "gzip"
      }
    } );
    mainArchiveUpload.on( "httpUploadProgress", progress => {
      console.log( progress );
    } );
    await mainArchiveUpload.done();
  }

  async uploadGzippedFiles( ) {
    const files = ["observations", "photos", "taxa", "observers"];
    console.log( "Uploading individual files" );
    await util.forEachInSequence( files, file => this.uploadGzippedFile( `${file}.csv`, `${file}.csv.gz` ) );
  }

  async uploadGzippedFile( localFileName, uploadName ) {
    await this.gzipFile( localFileName, uploadName );
    const fileUpload = new Upload( {
      client: S3client,
      queueSize: 4,
      partSize: 500 * 1024 * 1024,
      leavePartsOnError: false,
      params: {
        Bucket: config.aws.openDataBucket,
        Key: uploadName,
        Body: fs.createReadStream( path.join( this.outputDir, uploadName ) ),
        ACL: config.aws.openDataACL || "public-read",
        ContentEncoding: "gzip"
      }
    } );
    fileUpload.on( "httpUploadProgress", progress => {
      console.log( progress );
    } );
    await fileUpload.done();

    await fsPromises.unlink( path.join( this.outputDir, uploadName ) );
  }

  gzipFile( localFileName, uploadName ) {
    return new Promise( ( resolve, reject ) => {
      const fileContents = fs.createReadStream( path.join( this.outputDir, localFileName ) );
      const writeStream = fs.createWriteStream( path.join( this.outputDir, uploadName ) );
      const zip = zlib.createGzip();
      fileContents.pipe( zip ).pipe( writeStream ).on( "finish", err => {
        if ( err ) return reject( err );
        return resolve( );
      } );
    } );
  }

  gzipArchive( ) {
    return tar.c( {
      gzip: true,
      file: `${this.outputDir}.tar.gz`,
      cwd: this.runOptions.dir
    }, [this.outputDirName] );
  }

  async photosProcessor( beginningID, startID, maxPhotoID ) {
    const endID = startID + BATCH_SIZE;
    // search observations to ensure we can catch observation uniqueness
    const query = squel.select( )
      .field( "op.observation_id" )
      .field( "op.photo_id" )
      .field( "op.position" )
      .field( "p.uuid photo_uuid" )
      .field( "p.license" )
      .field( "p.width" )
      .field( "p.height" )
      .field( "fp.prefix" )
      .field( "fe.extension" )
      .field( "p.user_id photo_user_id" )
      .field( "o.uuid obs_uuid" )
      .from( "observation_photos op" )
      .join( "photos p", null, "op.photo_id = p.id" )
      .join( "users u", null, "p.user_id = u.id" )
      .join( "observations o", null, "op.observation_id = o.id" )
      .left_join( "flags photo_flags", null,
        "op.photo_id = photo_flags.flaggable_id AND photo_flags.flaggable_type='Photo' AND photo_flags.flag='spam'" )
      .left_join( "flags observation_flags", null,
        "op.observation_id = observation_flags.flaggable_id AND observation_flags.flaggable_type='Observation' AND observation_flags.flag='spam'" )
      .left_join( "file_prefixes fp", null, "p.file_prefix_id = fp.id" )
      .left_join( "file_extensions fe", null, "p.file_extension_id = fe.id" )
      .where( "op.observation_id > ? and op.observation_id <= ?", startID, endID )
      .where( "u.spammer = false" )
      .where( "u.suspended_at IS NULL" )
      .where( "photo_flags.id IS NULL" )
      .where( "observation_flags.id IS NULL" )
      .where( "p.license IN ?", _.keys( OPEN_LICENSES ) )
      .order( "op.observation_id" )
      .order( "op.position" );
    const { rows } = await Pool.query( query.toString( ) );
    const userIDs = { };
    const observationIDs = { };
    const photoRegex = new RegExp( `${_.escapeRegExp( PHOTO_DOMAIN )}\\/photos` );
    let lastObservationID = 0;
    let photoPosition = 0;
    _.each( rows, row => {
      if ( row.prefix ) {
        if ( row.observation_id === lastObservationID ) {
          photoPosition += 1;
        } else {
          photoPosition = 0;
        }
        if ( row.prefix.match( photoRegex ) ) {
          if ( VALID_EXTENSIONS[_.toLower( row.extension )] ) {
            const photoFileFields = [
              row.photo_uuid,
              row.photo_id,
              row.obs_uuid,
              row.photo_user_id,
              row.extension,
              license( row.license ),
              row.width,
              row.height,
              photoPosition
            ];
            this.photoFileStream.write( `${photoFileFields.join( "\t" )}\n` );
            userIDs[row.photo_user_id] = true;
            observationIDs[row.observation_id] = true;
          } else {
            // invalid extension
            // console.log( extension );
          }
        }
        lastObservationID = row.observation_id;
      }
    } );

    await this.fetchObservations(
      _.compact( _.map( _.keys( observationIDs ), Number ) ), userIDs
    );
    await this.fetchUsers(
      _.compact( _.map( _.keys( userIDs ), Number ) )
    );

    OpenDataArchive.outputProgress( this.startTime, beginningID, endID, maxPhotoID, "photos" );
  }

  async fetchObservations( observationIDs, userIDs ) {
    if ( _.isEmpty( observationIDs ) ) { return; }
    const query = squel.select( )
      .field( "o.uuid obs_uuid" )
      .field( "o.user_id obs_user_id" )
      .field( "o.latitude" )
      .field( "o.longitude" )
      .field( "o.public_positional_accuracy" )
      .field( "o.community_taxon_id" )
      .field( "o.taxon_id" )
      .field( "o.quality_grade" )
      .field( "o.observed_on" )
      .from( "observations o" )
      .where( "o.id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      let formattedDate;
      if ( row.observed_on ) {
        const date = moment.utc( row.observed_on );
        // don't write invalid or out of range dates
        if ( date.isValid( ) && date.isAfter( "1800-01-01" ) ) {
          formattedDate = date.format( "YYYY-MM-DD" );
        }
      }
      const obsFileFields = [
        row.obs_uuid,
        row.obs_user_id,
        row.latitude,
        row.longitude,
        row.public_positional_accuracy,
        row.community_taxon_id || row.taxon_id || "",
        row.quality_grade,
        formattedDate || ""
      ];
      userIDs[row.obs_user_id] = true;
      this.obsFileStream.write( `${obsFileFields.join( "\t" )}\n` );
    } );
  }

  async fetchUsers( userIDs ) {
    const lookupUserIDs = _.filter( userIDs, id => !userIDsWritten[id] );
    if ( _.isEmpty( lookupUserIDs ) ) {
      return;
    }
    _.each( lookupUserIDs, id => {
      userIDsWritten[id] = true;
    } );
    const query = squel.select( )
      .field( "u.id" )
      .field( "u.login" )
      .field( "u.name" )
      .from( "users u" )
      .where( "u.id IN ?", lookupUserIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      const observerFileFields = [
        row.id,
        row.login,
        row.name ? row.name.trim( ) : null
      ];
      this.observersFileStream.write( `${observerFileFields.join( "\t" )}\n` );
    } );
  }

  async taxaProcessor( beginningID, startID, maxID ) {
    const endID = startID + BATCH_SIZE;
    const query = squel.select( )
      .field( "t.id" )
      .field( "t.ancestry" )
      .field( "t.rank_level" )
      .field( "t.rank" )
      .field( "t.name" )
      .field( "t.is_active" )
      .from( "taxa t" )
      .where( "t.id > ? and t.id <= ?", startID, endID );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      const taxaFileFields = [
        row.id,
        row.ancestry,
        row.rank_level,
        row.rank,
        row.name,
        row.is_active
      ];
      this.taxaFileStream.write( `${taxaFileFields.join( "\t" )}\n` );
    } );
    OpenDataArchive.outputProgress( this.startTime, beginningID, endID, maxID, "taxa" );
  }

  async parallelProcessPhotos( concurrency = 1 ) {
    const startID = 0;
    let maxID;
    if ( this.runOptions["max-rows"] ) {
      maxID = Number( this.runOptions["max-rows"] );
    } else {
      const query = squel.select( )
        .field( "max(id) as max" )
        .from( "observations" );
      const { rows } = await Pool.query( query.toString( ) );
      maxID = rows[0].max;
    }
    await this.parallelProcess( this.photosProcessor, startID, maxID, concurrency );
  }

  async parallelProcessTaxa( concurrency = 1 ) {
    const startID = 0;
    let maxID;
    if ( this.runOptions["max-rows"] ) {
      maxID = Number( this.runOptions["max-rows"] );
    } else {
      const query = squel.select( )
        .field( "max(id) as max" )
        .from( "taxa" );
      const { rows } = await Pool.query( query.toString( ) );
      maxID = rows[0].max;
    }
    await this.parallelProcess( this.taxaProcessor, startID, maxID, concurrency );
  }

  async parallelProcess( method, startID, maxID, concurrency = 1 ) {
    let iterationStartID;
    const promiseProducer = ( ) => {
      iterationStartID = _.isUndefined( iterationStartID )
        ? startID
        : iterationStartID + BATCH_SIZE;
      if ( iterationStartID >= maxID ) {
        return null;
      }
      return method.bind( this )( startID, iterationStartID, maxID );
    };
    const pool = new PromisePool( promiseProducer, concurrency );

    try {
      this.startTime = Date.now( );
      await pool.start( );
    } catch ( err ) {
      console.log( err );
      console.trace( );
    }
  }

  static outputProgress( startTime, beginningID, endID, maxID, label = "rows" ) {
    const timeElapsed = ( Date.now( ) - startTime ) / 1000;
    const perSecond = ( endID - beginningID ) / timeElapsed;
    const secondsLeft = ( maxID - endID ) / perSecond;
    console.log( `Processed ${endID - beginningID} ${label} in ${_.round( timeElapsed, 2 )}s; `
      + `${_.round( perSecond, 2 )}/s; ${_.round( secondsLeft, 2 )}s left` );
  }
};

module.exports = OpenDataArchive;
