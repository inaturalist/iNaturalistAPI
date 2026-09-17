/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
const _ = require( "lodash" );
const fs = require( "fs" );
const path = require( "path" );
const squel = require( "safe-squel" );
const moment = require( "moment" );
const stream = require( "stream" );
const { promisify } = require( "util" );
const { once } = require( "events" );
const PromisePool = require( "es6-promise-pool" );
const Taxon = require( "./models/taxon" );
const util = require( "./util" );

// allow a higher-than-normal number of simultaneous psql connections from this process
process.env.PG_POOL_MAX = 30;
const Pool = require( "./pg_pool" );

const fsPromises = fs.promises;

const finished = promisify( stream.finished );

const SoundExplorationDataExporter = class SoundExplorationDataExporter {
  constructor( options = { } ) {
    console.log( options );
    this.runOptions = options;
    this.soundsLookupConcurrency = 5;
  }

  async export( ) {
    // create a directory to hold the output files
    await this.createOutputDir( );
    // create and open streams for all output files
    await this.createCSVFiles( );
    // fetch data on all candidate taxa and their ancestors
    this.writtenUserIDs = [];
    this.writtenTaxonIDs = [];
    this.writtenOauthApplicationIDs = [];
    await this.lookupSoundsInBatches( );

    await this.closeOutputFiles( );
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
    const todaysDate = moment( ).format( "YYYYMMDDHHmmss" );
    this.outputDirName = `sound-exploration-export-${todaysDate}`;
    this.outputDir = path.join( this.runOptions.dir, this.outputDirName );
    if ( !fs.existsSync( this.outputDir ) ) {
      fs.mkdirSync( this.outputDir );
    }
  }

  async createCSVFiles( ) {
    this.soundsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "sounds.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.soundsFileStream,
      "id,url,file_content_type,subtype,flagged,hidden"
    );
    this.observationSoundsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "observation_sounds.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.observationSoundsFileStream,
      "observation_id,sound_id"
    );
    this.observationsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "observations.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.observationsFileStream,
      "id,uuid,description,quality_grade,observed_on,time_observed_at,time_zone,created_at,latitude,longitude,positional_accuracy,species_guess,taxon_id,num_identification_agreements,num_identification_disagreements,oauth_application_id,user_id,captive,fails_non_wild_metric,faves_count,annotations_count,tags_count,flagged,hidden"
    );
    this.identificationsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "identifications.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.identificationsFileStream,
      "id,uuid,observation_id,body,category,current,own_observation,disagreement,taxon_id,previous_observation_taxon_id,taxon_change_id,flagged,hidden"
    );
    this.commentsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "comments.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.commentsFileStream,
      "id,observation_id,user_id,body,flagged,hidden"
    );
    this.observationPhotosFileStream = fs.createWriteStream(
      path.join( this.outputDir, "observation_photos.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.observationPhotosFileStream,
      "observation_id,photo_id"
    );
    this.usersFileStream = fs.createWriteStream(
      path.join( this.outputDir, "users.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.usersFileStream,
      "id,created_at,observations_count,spammer"
    );
    this.taxaFileStream = fs.createWriteStream(
      path.join( this.outputDir, "taxa.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.taxaFileStream,
      "id,name,english_common_name,iconic_taxon_name,rank,rank_level"
    );
    this.oauthApplicationsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "oauth_applications.csv" ), { flags: "w" }
    );
    await this.writeToFile(
      this.oauthApplicationsFileStream,
      "id,name"
    );
  }

  async soundsProcessor( options = { } ) {
    const sounds = { };
    const query = squel.select( )
      .field( "id" )
      .field( "file_file_name" )
      .field( "file_content_type" )
      .field( "subtype" )
      .from( "sounds" )
      .where( "id > ? and id <= ?", options.startID, options.endID );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      if ( !row.file_file_name ) {
        return;
      }
      sounds[row.id] = row;
    } );
    await this.flaggedItems( "Sound", sounds );
    await this.hiddenItems( "Sound", sounds );
    await this.fetchObservationSounds( sounds );

    await util.forEachInSequence( _.values( sounds ), async sound => {
      const extension = sound.file_file_name.split( "." ).at( -1 );
      const soundFileFields = [
        sound.id,
        `https://static.inaturalist.org/sounds/${sound.id}.${extension}`,
        sound.file_content_type,
        sound.subtype,
        sound.flagged,
        sound.hidden
      ];
      await this.writeToFile( this.soundsFileStream, soundFileFields.join( "," ) );
    } );
  }

  async fetchObservationSounds( sounds ) {
    const query = squel.select( )
      .field( "observation_id" )
      .field( "sound_id" )
      .from( "observation_sounds" )
      .where( "sound_id IN ?", _.keys( sounds ) );
    const { rows } = await Pool.query( query.toString( ) );
    const observationIDs = _.map( rows, "observation_id" );
    await this.fetchObservations( observationIDs );

    await util.forEachInSequence( rows, async row => {
      const observationSoundsFileFields = [
        row.observation_id,
        row.sound_id
      ];
      await this.writeToFile(
        this.observationSoundsFileStream,
        observationSoundsFileFields.join( "," )
      );
    } );
  }

  async fetchObservations( observationIDs ) {
    const observations = { };
    const query = squel.select( )
      .field( "id" )
      .field( "uuid" )
      .field( "description" )
      .field( "quality_grade" )
      .field( "TO_CHAR(observed_on, 'YYYY-MM-DD') as observed_on" )
      .field( "TO_CHAR(time_observed_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') as time_observed_at" )
      .field( "time_zone" )
      .field( "zic_time_zone" )
      .field( "TO_CHAR(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') as created_at" )
      .field( "latitude" )
      .field( "longitude" )
      .field( "positional_accuracy" )
      .field( "species_guess" )
      .field( "taxon_id" )
      .field( "community_taxon_id" )
      .field( "num_identification_agreements" )
      .field( "num_identification_disagreements" )
      .field( "oauth_application_id" )
      .field( "user_id" )
      .from( "observations" )
      .where( "id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      observations[row.id] = row;
    } );
    await this.assignObservationMetrics( observations );
    await this.assignFavesCount( observations );
    await this.assignAnnotationsCount( observations );
    await this.assignTagsCount( observations );
    await this.flaggedItems( "Observation", observations );
    await this.hiddenItems( "Observation", observations );
    await this.fetchIdentifications( observations );
    await this.fetchComments( observationIDs );
    await this.fetchObservationPhotos( observationIDs );
    await this.fetchUsers( _.compact( _.uniq( _.map( observations, "user_id" ) ) ) );
    await this.fetchTaxa( _.compact( _.uniq( _.map( observations, "taxon_id" ) ) ) );
    await this.fetchOauthApplications(
      _.compact( _.uniq( _.map( observations, "oauth_application_id" ) ) )
    );

    await util.forEachInSequence( _.values( observations ), async observation => {
      const observationFileFields = [
        observation.id,
        observation.uuid,
        this.escapeForCSV( observation.description ),
        observation.quality_grade,
        observation.observed_on,
        observation.time_observed_at,
        observation.time_zone,
        observation.created_at,
        observation.latitude,
        observation.longitude,
        observation.positional_accuracy,
        this.escapeForCSV( observation.species_guess ),
        observation.taxon_id,
        observation.num_identification_agreements,
        observation.num_identification_disagreements,
        observation.oauth_application_id,
        observation.user_id,
        observation.captive,
        observation.fails_non_wild_metric,
        observation.faves_count || 0,
        observation.annotations_count || 0,
        observation.tags_count || 0,
        observation.flagged,
        observation.hidden
      ];
      await this.writeToFile( this.observationsFileStream, observationFileFields.join( "," ) );
    } );
  }

  async fetchIdentifications( observations ) {
    const observationIDs = _.keys( observations );
    const identifications = { };
    const query = squel.select( )
      .field( "id" )
      .field( "uuid" )
      .field( "observation_id" )
      .field( "body" )
      .field( "category" )
      .field( "current" )
      .field( "user_id" )
      .field( "disagreement" )
      .field( "taxon_id" )
      .field( "previous_observation_taxon_id" )
      .field( "taxon_change_id" )
      .field( "observation_id" )
      .from( "identifications" )
      .where( "observation_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      identifications[row.id] = row;
    } );
    await this.flaggedItems( "Identification", identifications );
    await this.hiddenItems( "Identification", identifications );

    await util.forEachInSequence( _.values( identifications ), async identification => {
      const identificationFileFields = [
        identification.id,
        identification.uuid,
        identification.observation_id,
        this.escapeForCSV( identification.body ),
        identification.category,
        identification.current,
        ( identification.user_id === observations[identification.observation_id]?.user_id ),
        identification.disagreement,
        identification.taxon_id,
        identification.previous_observation_taxon_id,
        identification.taxon_change_id,
        identification.flagged,
        identification.hidden
      ];
      await this.writeToFile( this.identificationsFileStream, identificationFileFields.join( "," ) );
    } );
  }

  async fetchComments( observationIDs ) {
    const comments = { };
    const query = squel.select( )
      .field( "id" )
      .field( "parent_id" )
      .field( "user_id" )
      .field( "body" )
      .from( "comments" )
      .where( "parent_type = ?", "Observation" )
      .where( "parent_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      comments[row.id] = row;
    } );
    await this.flaggedItems( "Comment", comments );
    await this.hiddenItems( "Comment", comments );

    await util.forEachInSequence( _.values( comments ), async comment => {
      const commentFileFields = [
        comment.id,
        comment.parent_id,
        comment.user_id,
        this.escapeForCSV( comment.body ),
        comment.flagged,
        comment.hidden
      ];
      await this.writeToFile( this.commentsFileStream, commentFileFields.join( "," ) );
    } );
  }

  async fetchObservationPhotos( observationIDs ) {
    const query = squel.select( )
      .field( "observation_id" )
      .field( "photo_id" )
      .from( "observation_photos" )
      .where( "observation_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );

    await util.forEachInSequence( rows, async row => {
      const observationPhotoFileFields = [
        row.observation_id,
        row.photo_id
      ];
      await this.writeToFile(
        this.observationPhotosFileStream,
        observationPhotoFileFields.join( "," )
      );
    } );
  }

  async fetchUsers( userIDs ) {
    const userIDsToFetch = _.difference( userIDs, this.writtenUserIDs );
    if ( _.isEmpty( userIDsToFetch ) ) {
      return;
    }
    this.writtenUserIDs = _.union( this.writtenUserIDs, userIDsToFetch );
    const query = squel.select( )
      .field( "id" )
      .field( "TO_CHAR(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') as created_at" )
      .field( "observations_count" )
      .field( "spammer" )
      .from( "users" )
      .where( "id IN ?", userIDsToFetch );
    const { rows } = await Pool.query( query.toString( ) );

    await util.forEachInSequence( rows, async row => {
      const userFileFields = [
        row.id,
        row.created_at,
        row.observations_count
      ];
      await this.writeToFile(
        this.usersFileStream,
        userFileFields.join( "," )
      );
    } );
  }

  async fetchTaxa( taxonIDs ) {
    const taxonIDsToFetch = _.difference( taxonIDs, this.writtenTaxonIDs );
    if ( _.isEmpty( taxonIDsToFetch ) ) {
      return;
    }
    this.writtenTaxonIDs = _.union( this.writtenTaxonIDs, taxonIDsToFetch );
    const taxa = { };
    const query = squel.select( )
      .field( "id" )
      .field( "name" )
      .field( "iconic_taxon_id" )
      .field( "rank" )
      .field( "rank_level" )
      .from( "taxa" )
      .where( "id IN ?", taxonIDsToFetch );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      taxa[row.id] = row;
    } );
    await this.assignCommonNames( taxa );

    await util.forEachInSequence( _.values( taxa ), async taxon => {
      const taxonFileFields = [
        taxon.id,
        taxon.name,
        this.escapeForCSV( taxon.common_name ),
        Taxon.iconicTaxaByID[taxon.iconic_taxon_id]?.name,
        taxon.rank,
        taxon.rank_level
      ];
      await this.writeToFile(
        this.taxaFileStream,
        taxonFileFields.join( "," )
      );
    } );
  }

  async fetchOauthApplications( oauthApplicationIDs ) {
    const oauthApplicationIDsToFetch = _.difference(
      oauthApplicationIDs,
      this.writtenOauthApplicationIDs
    );
    if ( _.isEmpty( oauthApplicationIDsToFetch ) ) {
      return;
    }
    this.writtenOauthApplicationIDs = _.union(
      this.writtenOauthApplicationIDs,
      oauthApplicationIDsToFetch
    );
    const query = squel.select( )
      .field( "id" )
      .field( "name" )
      .from( "oauth_applications" )
      .where( "id IN ?", oauthApplicationIDsToFetch );
    const { rows } = await Pool.query( query.toString( ) );

    await util.forEachInSequence( rows, async row => {
      const oauthApplicationFileFields = [
        row.id,
        row.name
      ];
      await this.writeToFile(
        this.oauthApplicationsFileStream,
        oauthApplicationFileFields.join( "," )
      );
    } );
  }

  async assignObservationMetrics( observations ) {
    const observationIDs = _.map( _.keys( observations ), k => Number( k ) );
    if ( _.isEmpty( observationIDs ) ) { return; }
    const scores = { };
    const query = squel.select( )
      .field( "observation_id" )
      .field( "metric" )
      .field( "agree" )
      .from( "quality_metrics" )
      .where( "observation_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      scores[row.observation_id] = scores[row.observation_id] || { };
      scores[row.observation_id][row.metric] = scores[row.observation_id][row.metric] || 0;
      scores[row.observation_id][row.metric] += row.agree ? 1 : -1;
    } );
    _.each( scores, ( metrics, observationID ) => {
      _.each( metrics, ( score, metric ) => {
        if ( score < 0 ) {
          if ( metric === "wild" ) {
            observations[observationID].captive = true;
          } else {
            observations[observationID].fails_non_wild_metric = true;
          }
        }
      } );
    } );
  }

  async assignFavesCount( observations ) {
    const observationIDs = _.map( _.keys( observations ), k => Number( k ) );
    if ( _.isEmpty( observationIDs ) ) { return; }
    const query = squel.select( )
      .field( "votable_id" )
      .from( "votes" )
      .where( "votable_type = ?", "Observation" )
      .where( "votable_id IN ?", observationIDs )
      .where( "vote_scope IS NULL" );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      observations[row.votable_id].faves_count = observations[row.votable_id].faves_count || 0;
      observations[row.votable_id].faves_count += 1;
    } );
  }

  async assignAnnotationsCount( observations ) {
    const observationIDs = _.map( _.keys( observations ), k => Number( k ) );
    if ( _.isEmpty( observationIDs ) ) { return; }
    const query = squel.select( )
      .field( "resource_id" )
      .from( "annotations" )
      .where( "resource_type = ?", "Observation" )
      .where( "resource_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      observations[row.resource_id].annotations_count = observations[row.resource_id]
        .annotations_count || 0;
      observations[row.resource_id].annotations_count += 1;
    } );
  }

  async assignTagsCount( observations ) {
    const observationIDs = _.map( _.keys( observations ), k => Number( k ) );
    if ( _.isEmpty( observationIDs ) ) { return; }
    const query = squel.select( )
      .field( "taggable_id" )
      .from( "taggings" )
      .where( "taggable_type = ?", "Observation" )
      .where( "taggable_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      observations[row.taggable_id].tags_count = observations[row.taggable_id].tags_count || 0;
      observations[row.taggable_id].tags_count += 1;
    } );
  }

  async assignCommonNames( taxa ) {
    const taxonIDs = _.map( _.keys( taxa ), k => Number( k ) );
    if ( _.isEmpty( taxonIDs ) ) { return; }
    const query = squel.select( )
      .field( "taxon_id" )
      .field( "name" )
      .from( "taxon_names" )
      .where( "lexicon = ?", "English" )
      .where( "is_valid = ?", true )
      .where( "taxon_id IN ?", taxonIDs )
      .order( "position, created_at" );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      if ( !taxa[row.taxon_id].common_name ) {
        taxa[row.taxon_id].common_name = row.name;
      }
    } );
  }

  async flaggedItems( type, objects ) {
    const ids = _.map( _.keys( objects ), k => Number( k ) );
    if ( _.isEmpty( ids ) ) { return; }
    const query = squel.select( )
      .field( "flaggable_id" )
      .from( "flags" )
      .where( "flaggable_type = ?", type )
      .where( "resolved = ?", false )
      .where( "flaggable_id IN ?", ids );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      objects[row.flaggable_id].flagged = true;
    } );
  }

  async hiddenItems( type, objects ) {
    const ids = _.map( _.keys( objects ), k => Number( k ) );
    if ( _.isEmpty( ids ) ) { return; }
    const query = squel.select( )
      .field( "resource_id" )
      .field( "action" )
      .field( "created_at" )
      .from( "moderator_actions" )
      .where( "resource_type = ?", type )
      .where( "resource_id IN ?", ids );
    const { rows } = await Pool.query( query.toString( ) );
    const sortedRows = _.reverse( _.sortBy( rows, "created_at" ) );
    _.each( sortedRows, row => {
      // the latest value of `action` represents the current hidden state of
      // the photo. Since this is sorting by created descending, if hidden
      // is set then the object's hidden state has already been captured
      if ( _.has( objects[row.resource_id], "hidden" ) ) {
        return;
      }
      objects[row.resource_id].hidden = ( row.action === "hide" );
    } );
  }

  async maxSoundID( ) {
    const query = squel.select( ).field( "MAX(id) AS max" ).from( "sounds" );
    const { rows } = await Pool.query( query.toString( ) );
    return rows[0].max;
  }

  async lookupSoundsInBatches( ) {
    let iterationStartID;
    const batchSize = 1000;
    const maxID = await this.maxSoundID( );
    const promiseProducer = ( ) => {
      iterationStartID = _.isUndefined( iterationStartID ) ? 0 : iterationStartID + batchSize;
      if ( iterationStartID > maxID ) {
        return null;
      }
      return this.soundsProcessor( {
        startID: iterationStartID,
        endID: iterationStartID + batchSize
      } );
    };
    // lookup candidate taxa in batches of 1000, running this.taxaConcurrency queries at once
    await this.asyncPromisePool( promiseProducer, this.soundsLookupConcurrency );
  }

  // basic logging of progress for a depth-first pass of taxon lookups
  outputProgress( ) {
    this.counter += 1;
    if ( this.counter % 100 !== 0 ) { return; }
    const timeElapsed = ( Date.now( ) - this.startTime ) / 1000;
    const perSecond = this.counter / timeElapsed;
    const secondsLeft = ( this.total - this.counter ) / perSecond;
    console.log( `Processed ${this.counter} of ${this.total} taxa in ${_.round( timeElapsed, 2 )}s; `
      + `${_.round( perSecond, 2 )}/s; ${_.round( secondsLeft, 2 )}s left; ` );
  }

  async closeOutputFiles( ) {
    this.soundsFileStream.end( );
    await finished( this.soundsFileStream );
    this.observationSoundsFileStream.end( );
    await finished( this.observationSoundsFileStream );
    this.observationsFileStream.end( );
    await finished( this.observationsFileStream );
    this.identificationsFileStream.end( );
    await finished( this.identificationsFileStream );
    this.commentsFileStream.end( );
    await finished( this.commentsFileStream );
    this.observationPhotosFileStream.end( );
    await finished( this.observationPhotosFileStream );
    this.usersFileStream.end( );
    await finished( this.usersFileStream );
    this.taxaFileStream.end( );
    await finished( this.taxaFileStream );
    this.oauthApplicationsFileStream.end( );
    await finished( this.oauthApplicationsFileStream );
  }

  async writeToFile( fileStream, line ) {
    if ( !fileStream.write( `${line}\n` ) ) {
      await once( fileStream, "drain" );
    }
  }

  escapeForCSV( string ) {
    if ( _.isEmpty( string ) ) {
      return string;
    }
    if ( !_.includes( string, "," ) && !_.includes( string, "\n" ) ) {
      return string.replace( /"/g, "\"\"" );
    }
    return `"${string.replace( /"/g, "\"\"" ).replace( /\n/g, "\\n" ).replace( /\r/g, "\\r" )}"`;
  }

  async asyncPromisePool( promiseProducer, concurrency ) {
    const pool = new PromisePool( promiseProducer, concurrency );
    await pool.start( );
  }
};

module.exports = SoundExplorationDataExporter;
