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
global.config = require( "../config" );

// allow a higher-than-normal number of simultaneous psql connections from this process
global.config.pgPoolMax = 30;
const Pool = require( "./pg_pool" );

const fsPromises = fs.promises;

const finished = promisify( stream.finished );

// Some rules/assumptions:
//   Never use taxa/clades which are known to be globally extinct
//   Never use taxa below species
//   Never use taxa/clades with rank hybrid or genushybrid
//   Never use inactive taxa
//   Only consider observations whose observation_photos_count is greater than 0
//   Never use leaf taxa whose observations_count is less than 50
//   Never use observations that have unresolved flags
//   Never use observations that fail quality metrics other than wild
//   Never use photos that have unresolved flags
//   Populating files:
//     Test and Val must have observations whose community_taxon_id matches the clade
//     Train can also use obs where just taxon_id matches the clade, as lower priority
//     One photo per obs in test and val, train can use 5 per obs
//     In train, start adding one photo per observation, and fill with additional 4 if there's room
//     If obs photos are used in any set, the obs' other photos cannot appear in other sets
//       Ideally if obs in train, not represented in other sets. Not too bad if obs in val and test

const VisionDataExporter = class VisionDataExporter {
  /* eslint-disable lines-between-class-members */
  static TRAIN_MIN = 50;
  static TRAIN_MAX = 1000;
  static TEST_MIN = 25;
  static TEST_MAX = 100;
  static VAL_MIN = 25;
  static VAL_MAX = 100;
  static SPATIAL_MAX = 100000;
  static MAX_POSITIONAL_ACCURACY = 1000;
  static TRAIN_PHOTOS_PER_OBSERVATION = 5;
  // how many taxa to process at one time
  static TAXA_CONCURRENCY = 5;
  // how many sets of observations, per-taxon, to lookup at one time
  static OBSERVATIONS_CONCURRENCY = 2;
  /* eslint-enable lines-between-class-members */

  constructor( options = { } ) {
    console.log( options );
    this.runOptions = options;
    this.selectTaxonIDs = options.taxa || [];
    this.customLeafTaxonIDs = options.leaves || [];
    this.trainMin = options["train-min"] || VisionDataExporter.TRAIN_MIN;
    this.trainMax = options["train-max"] || VisionDataExporter.TRAIN_MAX;
    this.valMin = options["val-min"] || VisionDataExporter.TEST_MIN;
    this.valMax = options["val-max"] || VisionDataExporter.TEST_MAX;
    this.testMin = options["test-min"] || VisionDataExporter.VAL_MIN;
    this.testMax = options["test-max"] || VisionDataExporter.VAL_MAX;
    this.spatialMax = options["spatial-max"] || VisionDataExporter.SPATIAL_MAX;
    this.maxPositionalAccuracy = options["accuracy-max"] || VisionDataExporter.MAX_POSITIONAL_ACCURACY;
    this.taxaConcurrency = options["taxa-concurrency"] || VisionDataExporter.TAXA_CONCURRENCY;
    this.observationsConcurrency = options["observations-concurrency"] || VisionDataExporter.OBSERVATIONS_CONCURRENCY;
    this.trainPhotosPerObservation = options["train-per-obs"] || VisionDataExporter.TRAIN_PHOTOS_PER_OBSERVATION;
    this.taxa = { };
    this.taxonChildren = { };
    this.taxonNames = { };
  }

  async export( ) {
    // create a directory to hold the output files
    await this.createOutputDir( );
    // create and open streams for all output files
    await this.createCSVFiles( );
    // fetch data on all candidate taxa and their ancestors
    await this.prepareCandidateTaxonomy( );
    await this.lookupFilePrefixes( );
    await this.lookupFileExtensions( );
    // lookup data and write to appropriate files
    await this.processEntireTree( );
    // write the taxonomy, iconic_taxa, and summary files
    await this.printTree( );
    await this.printStats( );
    await this.writeIconicTaxa( );
    // wait for all output files to be closed
    await this.closeOutputFiles( );
  }

  async prepareCandidateTaxonomy( ) {
    await this.lookupGloballyExtinctTaxonIDs( );
    await this.lookupCandidateTaxaInBatches( );
    const unnamedTaxonIDs = _.map( _.filter( this.taxa, t => !_.has( t, "name" ) ), "id" );
    await this.taxaProcessor( { ids: unnamedTaxonIDs } );

    const selectTaxonAncestries = _.compact( _.map( this.selectTaxonIDs, id => (
      this.taxa[id] ? this.taxonAncestry( this.taxa[id] ) : null
    ) ) );
    this.selectTaxonAncestors = _.map( _.uniq( _.flatten( _.map(
      selectTaxonAncestries, a => a.split( "/" )
    ) ) ), Number );
    // prepare variaibles for assining classIDs
    this.taxonLeafClasses = { };
    this.taxonIconicClasses = { };
    this.leafClassIndex = 0;
    this.iconicClassIndex = 0;
  }

  // main loop for fetching data for the export. Traverse depth-first through all
  // potentially eligible taxa, populating an array of taxa that need to be looked
  // up next, then processing any taxa that need processing that pass. Finishes
  // once all the root taxa have been processed
  async processEntireTree( ) {
    this.leafTaxaNeedingProcessing = [];
    this.depthFirstTraverse( );
    await this.processTaxaStack( );
    // all root taxa have been processed, so no need for another pass
    // NOTE: it is not safe to assume that if the process stack is empty then the
    // entire tree has been processed. Only when the roots have been processed is it done
    if ( _.every( _.keys( this.taxonChildren[0] ), rootID => this.taxa[rootID].status ) ) {
      return;
    }
    await this.processEntireTree( );
  }

  // process any taxa that need processing after the last depth-first pass
  async processTaxaStack( ) {
    this.counter = 0;
    this.total = _.size( this.leafTaxaNeedingProcessing );
    this.leafTaxaNeedingProcessing = _.shuffle( this.leafTaxaNeedingProcessing );
    const promiseProducer = ( ) => {
      const lookupTaxon = this.leafTaxaNeedingProcessing.shift( );
      return lookupTaxon ? this.startTaxonAssessment( lookupTaxon ) : null;
    };
    this.startTime = Date.now( );
    // lookup candidate taxa in batches of 1000, running this.taxaConcurrency queries at once
    await this.asyncPromisePool( promiseProducer, this.taxaConcurrency );
  }

  // main method for traversing the taxonomy. This method will look at children
  // of the supplied taxon. If any children need processing, it will run them
  // through this same method. If all children have been processed and any have
  // been fully populated or are complete because decendants are populated or
  // complete, the taxon will be marked as complete. If this is a leaf node in
  // the original taxonomy, or no children have been marked complete or
  // populated, then this is a leaf node in the working taxonomy and it needs to
  // be processed.
  depthFirstTraverse( taxon = null, spaces = 0, withinFilterBranch = false ) {
    let selectedBranch = false;
    if ( taxon ) {
      if ( this.extinctTaxonIDs[taxon.id] ) {
        taxon.status = "skipped";
      }
      selectedBranch = this.assessWithinFilterBranch( taxon, withinFilterBranch );
      if ( !this.taxonNeedsProcessing( taxon ) ) { return; }
    }
    const childIDs = taxon ? this.taxonChildren[taxon.id] : this.taxonChildren[0];
    if ( !_.isEmpty( childIDs ) && !( taxon && _.includes( this.customLeafTaxonIDs, taxon.id ) ) ) {
      const children = _.map( _.keys( childIDs ), childID => this.taxa[childID] );
      const unprocessedChildren = _.filter( children, child => !child.status );
      // if any children haven't not been processed at all, process them
      if ( !_.isEmpty( unprocessedChildren ) ) {
        _.each( unprocessedChildren, child => {
          this.depthFirstTraverse( child, spaces + 1, selectedBranch );
        } );
        return;
      }
      // at this point we know all children have been processed,
      // though some may still be under the photo threshold
      const unskippedChildren = _.filter( children, child => child.status !== "skipped" );
      // if any of the children are directly populated, or complete because decendants are
      // populated or complete, mark this branch as complete and skip it
      if ( _.some( unskippedChildren, child => (
        child.status === "complete" || child.status === "populated"
      ) ) ) {
        taxon.status = "complete";
        return;
      }
    }
    // this is a lowest-level taxon (leaf) in a branch that still needs processing
    if ( taxon ) {
      this.leafTaxaNeedingProcessing.push( taxon );
    }
  }

  async taxaProcessor( options = { } ) {
    // startID and endID are used when looking up the initial leaf taxa
    // and ids are used to backfill data for ancestors
    if ( _.isEmpty( options.ids ) && !(
      ( options.startID || options.startID === 0 ) && options.endID )
    ) {
      return;
    }
    let query = squel.select( )
      .field( "t.id" )
      .field( "t.ancestry" )
      .field( "t.rank" )
      .field( "t.rank_level" )
      .field( "t.name" )
      .field( "t.observations_count" )
      .field( "t.iconic_taxon_id" )
      .from( "taxa t" );
    if ( options.startID || options.startID === 0 ) {
      // requirements for the initial leaf taxa for consideration
      query = query.where( "t.observations_count >= 50" )
        .where( "t.rank_level >= 10" )
        .where( "t.is_active = ?", true )
        .where( "t.rank != ?", "hybrid" )
        .where( "t.rank != ?", "genushybrid" )
        .where( "t.id > ? and t.id <= ?", options.startID, options.endID );
    } else {
      query = query.where( "t.id IN ?", options.ids );
    }
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => this.taxaPopulate( row ) );
  }

  taxaPopulate( row ) {
    const ancestorIDs = _.isEmpty( row.ancestry ) ? [] : row.ancestry.split( "/" );
    ancestorIDs.push( row.id );
    this.taxa[row.id] = Object.assign( this.taxa[row.id] || { }, row );
    this.taxa[row.id].iconic_taxon_id = this.taxa[row.id].iconic_taxon_id || 0;
    let lastAncestorID = 0;
    _.each( ancestorIDs, ancestorID => {
      this.validateAncestry( ancestorID, lastAncestorID, row.id );
      this.taxonChildren[lastAncestorID] = this.taxonChildren[lastAncestorID] || { };
      this.taxonChildren[lastAncestorID][ancestorID] = true;
      this.taxa[ancestorID] = this.taxa[ancestorID] || { };
      this.taxa[ancestorID].id = Number( ancestorID );
      this.taxa[ancestorID].parentID = lastAncestorID;
      lastAncestorID = Number( ancestorID );
    } );
  }

  // raise or log an error if this childID, parentID combo doesn't match
  // ancestries that have already been looked up
  validateAncestry( childID, parentID, taxonID ) {
    if ( this.taxa[childID]
      && this.taxa[childID].parentID
      && this.taxa[childID].parentID !== parentID
    ) {
      const error = `Ancestry mismatch: ${childID} has parents [${parentID}, `
        + `${this.taxa[childID].parentID}] in ancestry of ${taxonID}`;
      if ( !this.runOptions["skip-ancestry-mismatch"] ) {
        throw new Error( error );
      } else {
        console.log( error );
      }
    }
  }

  taxonHasMinimumPhotos( taxon ) {
    if ( _.size( this.taxonData[taxon.id].test ) < this.testMin ) { return false; }
    if ( _.size( this.taxonData[taxon.id].val ) < this.valMin ) { return false; }
    if ( _.size( this.taxonData[taxon.id].train ) < this.trainMin ) { return false; }
    return true;
  }

  taxonHasMaximumPhotos( taxon ) {
    if ( _.size( this.taxonData[taxon.id].test ) < this.testMax ) { return false; }
    if ( _.size( this.taxonData[taxon.id].val ) < this.valMax ) { return false; }
    if ( _.size( this.taxonData[taxon.id].train ) < this.trainMax ) { return false; }
    return true;
  }

  taxonHasMaximumSpatial( taxon ) {
    if ( _.size( this.taxonData[taxon.id].spatial ) < this.spatialMax ) {
      return false;
    }
    return true;
  }

  taxonHasMaximumData( taxon ) {
    if ( !this.taxonHasMaximumPhotos( taxon ) ) { return false; }
    if ( !this.taxonHasMaximumSpatial( taxon ) ) { return false; }
    return true;
  }

  // return IDs of this taxon plus all its descendants
  async lookupTaxonIDs( taxon ) {
    const ancestry = this.taxonAncestry( taxon );
    const query = squel.select( )
      .field( "t.id" )
      .from( "taxa t" )
      .where( "t.is_active = ?", true )
      .where( "t.id = ? OR t.ancestry = ? OR t.ancestry LIKE ?", taxon.id, ancestry, `${ancestry}/%` );
    const { rows } = await Pool.query( query.toString( ) );
    return _.map( rows, "id" );
  }

  // return IDs of all observations of this taxon and its descendants
  // matching the minimum criteria for photos to be evaluated
  async validObservationsOfTaxon( taxon, options = { } ) {
    let query = squel.select( )
      .field( "o.id" )
      .field( "CASE WHEN o.private_longitude IS NULL THEN o.longitude ELSE o.private_longitude END AS longitude" )
      .field( "CASE WHEN o.private_latitude IS NULL THEN o.latitude ELSE o.private_latitude END AS latitude" )
      .field( "o.positional_accuracy" )
      .field( "o.observed_on" )
      .from( "observations o" )
      .where( "o.observation_photos_count > 0 " );
    if ( taxon.observations_count >= 100000 ) {
      if ( !options.community ) { return []; }
      const ancestry = this.taxonAncestry( taxon );
      query = query.join( "taxa t", null, "o.community_taxon_id = t.id" )
        .where( "t.is_active = ?", true )
        .where( "t.id = ? OR t.ancestry = ? OR t.ancestry LIKE ?", taxon.id, ancestry, `${ancestry}/%` )
        .limit( 200000 );
    }

    const taxonIDs = await this.lookupTaxonIDs( taxon );
    if ( options.community ) {
      query = query.field( "o.community_taxon_id AS taxon_id" )
        .where( "community_taxon_id IN ?", taxonIDs );
    } else {
      query = query.field( "o.taxon_id AS taxon_id" )
        .where( "taxon_id IN ?", taxonIDs )
        .where( "community_taxon_id IS NULL OR community_taxon_id NOT IN ?", taxonIDs );
    }
    const { rows } = await Pool.query( query.toString( ) );
    const observations = _.keyBy( rows, "id" );
    await this.assignObservationMetrics( observations );
    await this.flaggedItems( "Observation", observations );
    return _.omitBy( observations, o => o.flagged );
  }

  async lookupAndProcessTaxonData( taxon, options = { } ) {
    const observations = await this.validObservationsOfTaxon( taxon, options );
    const observationIDs = _.keys( observations );
    const randomIDs = _.shuffle( observationIDs );
    const randomChunks = _.chunk( randomIDs, 500 );
    const promiseProducer = ( ) => {
      if ( this.taxonHasMaximumData( taxon ) ) {
        return null;
      }
      const chunkIDs = randomChunks.shift( );
      const chunkObservations = _.pick( observations, chunkIDs );
      // there are no more observations, so end the promise pool
      if ( _.isEmpty( chunkObservations ) ) { return null; }
      return this.processTaxonDataBatch( taxon, chunkObservations, options );
    };
    await this.asyncPromisePool( promiseProducer, this.observationsConcurrency );
  }

  async processTaxonDataBatch( taxon, observations, options = { } ) {
    await this.distributeTaxonGeospatial( taxon, observations, options );
    await this.distributeTaxonPhotosFirstPass( taxon, observations, options );
  }

  async distributeTaxonGeospatial( taxon, observations, options = { } ) {
    if ( this.taxonHasMaximumSpatial( taxon ) ) { return; }
    _.each( _.shuffle( observations ), observation => {
      // observations must have coordinates
      if ( !observation.latitude || !observation.longitude || (
        observation.latitude === 0 && observation.longitude === 0 ) ) { return; }
      // coordinates much be within a certain accuracy
      if ( observation.positional_accuracy > this.maxPositionalAccuracy ) { return; }
      if ( this.taxonData[taxon.id].spatialUsed[observation.id] ) { return; }
      if ( _.size( this.taxonData[taxon.id].spatial ) >= this.spatialMax ) { return; }
      this.addObsToTaxonSpatialSet( observation, taxon, options );
    } );
  }

  // assess observations of this taxon and its descendants, ultimately fully
  // populating and writing data for this taxon, or marking it as incomplete
  async startTaxonAssessment( taxon ) {
    this.taxonData = this.taxonData || { };
    // prepare an object to hold data as it gets looked up, plus objects
    // used for more efficient checking what's already in the working sets
    this.taxonData[taxon.id] = {
      train: [],
      trainObs: {},
      val: [],
      valObs: {},
      test: [],
      testObs: {},
      allObsPhotos: [],
      photosUsed: {},
      spatialUsed: {},
      spatial: []
    };
    // lookup community ID matches first
    await util.forEachInSequence( [true, false], async community => {
      this.taxonData[taxon.id].allObsPhotos = [];
      // lookup observation photos and assign one per vision set
      await this.lookupAndProcessTaxonData( taxon, { community } );
      // assign additional photos per observation to train as needed
      this.distributeMultiplePhotos( taxon, { community } );
    } );
    if ( this.taxonHasMinimumPhotos( taxon ) ) {
      // there are enough photos in each set to use this as a final leaf taxon
      await this.writeTaxonData( taxon );
    } else {
      this.taxa[taxon.id].status = "incomplete";
    }
    this.taxa[taxon.id].trainCount = _.size( this.taxonData[taxon.id].train );
    this.taxa[taxon.id].testCount = _.size( this.taxonData[taxon.id].test );
    this.taxa[taxon.id].valCount = _.size( this.taxonData[taxon.id].val );
    this.taxa[taxon.id].spatialCount = _.size( this.taxonData[taxon.id].spatial );
    this.taxa[taxon.id].taxaCount = _.size( _.uniq( _.map(
      this.taxonData[taxon.id].train, obsPhoto => obsPhoto.observation.taxon_id
    ) ) );
    delete this.taxonData[taxon.id];
    this.outputProgress( );
  }

  async writeTaxonData( taxon ) {
    this.taxonLeafClasses[taxon.id] = this.leafClassIndex;
    this.leafClassIndex += 1;
    if ( !_.has( this.taxonIconicClasses, taxon.iconic_taxon_id ) ) {
      this.taxonIconicClasses[taxon.iconic_taxon_id] = this.iconicClassIndex;
      this.iconicClassIndex += 1;
    }
    const taxonData = this.taxonData[taxon.id];
    await this.writePhotosToFile( taxon, taxonData.train, this.trainFileStream );
    await this.writePhotosToFile( taxon, taxonData.test, this.testFileStream );
    await this.writePhotosToFile( taxon, taxonData.val, this.valFileStream );
    await this.writeSpatialToFile( taxon, taxonData.spatial );
    this.taxa[taxon.id].status = "populated";
  }

  async writePhotosToFile( taxon, observationPhotos, file ) {
    await util.forEachInSequence( observationPhotos, async observationPhoto => {
      const { photo } = observationPhoto;
      const photoFileFields = [
        photo.id,
        photo.medium_url,
        this.taxonLeafClasses[taxon.id],
        this.taxonIconicClasses[taxon.iconic_taxon_id],
        taxon.id,
        observationPhoto.observation.taxon_id,
        observationPhoto.community ? 1 : 0
      ];
      await this.writeToFile( file, photoFileFields.join( "," ) );
    } );
  }

  async writeSpatialToFile( taxon, observations ) {
    await util.forEachInSequence( observations, async observation => {
      const spatialFileFields = [
        observation.id,
        _.round( observation.latitude, 4 ),
        _.round( observation.longitude, 4 ),
        observation.observed_on ? observation.observed_on.toISOString( ).slice( 0, 10 ) : "",
        this.taxonLeafClasses[taxon.id],
        this.taxonIconicClasses[taxon.iconic_taxon_id],
        taxon.id,
        observation.taxon_id,
        observation.community ? 1 : 0,
        observation.isCaptive ? 1 : 0
      ];
      await this.writeToFile( this.spatialFileStream, spatialFileFields.join( "," ) );
    } );
  }

  addObsPhotoToTaxonSet( obsPhoto, taxon, set, options = { } ) {
    const taxonData = this.taxonData[taxon.id];
    taxonData[set].push( obsPhoto );
    taxonData[`${set}Obs`][obsPhoto.observation_id] = taxonData[`${set}Obs`][obsPhoto.observation_id] || 0;
    taxonData[`${set}Obs`][obsPhoto.observation_id] += 1;
    obsPhoto.community = !!options.community;
    taxonData.photosUsed[obsPhoto.photo_id] = true;
  }

  addObsToTaxonSpatialSet( observation, taxon, options = { } ) {
    observation.community = !!options.community;
    this.taxonData[taxon.id].spatial.push( observation );
    this.taxonData[taxon.id].spatialUsed[observation.id] = true;
  }

  obsOccursInTaxonSet( obsPhoto, taxon, set ) {
    const taxonData = this.taxonData[taxon.id];
    return taxonData[`${set}Obs`][obsPhoto.observation_id] || 0;
  }

  taxonCanUseObsPhotoForTrain( taxon, obsPhoto ) {
    const taxonData = this.taxonData[taxon.id];
    // this photo has already been used in any set for this taxon
    if ( taxonData.photosUsed[obsPhoto.photo_id] ) { return false; }
    // this taxon can't take any more train photos
    if ( _.size( taxonData.train ) >= this.trainMax ) { return false; }
    const obsInTestCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "test" );
    const obsInValCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "val" );
    const obsInTrainCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "train" );
    const obsInTest = obsInTestCount > 0;
    const obsInVal = obsInValCount > 0;
    const trainObsPhotosFull = obsInTrainCount >= this.trainPhotosPerObservation;
    // the observation is used at least once in test or train,
    // or train can't take any more photos from this observation
    if ( obsInTest || obsInVal || trainObsPhotosFull ) { return false; }
    return true;
  }

  taxonCanUseObsPhotoOnFirstPass( taxon, obsPhoto ) {
    const obsInTestCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "test" );
    const obsInValCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "val" );
    const obsInTrainCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "train" );
    const obsInTest = obsInTestCount > 0;
    const obsInVal = obsInValCount > 0;
    const obsInTrain = obsInTrainCount > 0;
    // if a photo from an observation is in test or val, don't use any more
    // photos from the same observation in any set
    if ( obsInTest || obsInVal || obsInTrain ) {
      return false;
    }
    return true;
  }

  // assign additional photos per observation to train as needed
  distributeMultiplePhotos( taxon, options = { } ) {
    if ( this.taxonHasMaximumData( taxon ) ) { return; }
    if ( this.trainPhotosPerObservation < 2 ) { return; }
    _.each( _.shuffle( this.taxonData[taxon.id].allObsPhotos ), obsPhoto => {
      if ( !this.taxonCanUseObsPhotoForTrain( taxon, obsPhoto ) ) { return; }
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "train", options );
    } );
  }

  async distributeTaxonPhotosFirstPass( taxon, observations, options = { } ) {
    if ( this.taxonHasMaximumPhotos( taxon ) ) { return; }
    let observationPhotos = await this.photosForObservations( taxon, observations );
    const taxonData = this.taxonData[taxon.id];
    taxonData.allObsPhotos = taxonData.allObsPhotos.concat( observationPhotos );
    if ( options.community ) {
      // sort photos so observations with fewer photos are first, leaving more observations with
      // multiple photos for train. Also sort by position so first photos get used first
      observationPhotos = _.sortBy( observationPhotos,
        op => [op.observationPhotoCount, op.position, _.random( 0.1, 1 )] );
    } else {
      // looking at non community ID observations, used only in train, so randomize
      observationPhotos = _.shuffle( observationPhotos );
    }
    _.each( observationPhotos, obsPhoto => {
      if ( taxonData.photosUsed[obsPhoto.photo_id] ) { return; }
      if ( !options.community ) {
        const obsInTrainCount = this.obsOccursInTaxonSet( obsPhoto, taxon, "train" );
        const obsInTrain = obsInTrainCount > 0;
        if ( obsInTrain ) { return; }
        if ( _.size( taxonData.train ) < this.trainMax ) {
          this.addObsPhotoToTaxonSet( obsPhoto, taxon, "train", options );
        }
        return;
      }
      this.distributeTaxonPhotoFirstPass( taxon, obsPhoto, options );
    } );
  }

  distributeTaxonPhotoFirstPass( taxon, obsPhoto, options = { } ) {
    if ( !this.taxonCanUseObsPhotoOnFirstPass( taxon, obsPhoto ) ) { return; }
    const taxonData = this.taxonData[taxon.id];
    // test is below minimum threshold, so add to test
    if ( _.size( taxonData.test ) < this.testMin ) {
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "test", options );
      return;
    }
    // val is below minimum threshold, so add to val
    if ( _.size( taxonData.val ) < this.valMin ) {
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "val", options );
      return;
    }
    // train is below minimum threshold, so add to train
    if ( _.size( taxonData.train ) < this.trainMax ) {
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "train", options );
      return;
    }
    // train is completely full, but test isn't, so add to test
    if ( _.size( taxonData.test ) < this.testMax ) {
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "test", options );
      return;
    }
    // train and test are commpletely full, but val isn't, so add to val
    if ( _.size( taxonData.val ) < this.valMax ) {
      this.addObsPhotoToTaxonSet( obsPhoto, taxon, "val", options );
    }
  }

  // return IDs from the supplied array which fail any non-wild quality metric
  async assignObservationMetrics( observations ) {
    const observationIDs = _.keys( observations );
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
            observations[observationID].isCaptive = true;
          } else {
            observations[observationID].failsNonWildMetric = true;
          }
        }
      } );
    } );
  }

  // return IDs from the supplied array and type which have any unresolved flags
  async flaggedItems( type, objects ) {
    const ids = _.keys( objects );
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

  // return photo IDs from all observations in the supplied array that are
  // eligible for inclusion in the export
  async observationPhotos( taxon, observations ) {
    // never use photos from observations with failed quality metrics other than wild,
    // e.g. photos of captive organisms is OK but photos not showing evidence are not OK
    const observationIDs = _.keys( _.omitBy( observations, o => o.failsNonWildMetric ) );
    if ( _.isEmpty( observationIDs ) ) { return []; }
    const query = squel.select( )
      .field( "photo_id" )
      .field( "observation_id" )
      .field( "COALESCE( position, photo_id ) AS position" )
      .from( "observation_photos" )
      .where( "observation_id IN ?", observationIDs );
    const { rows } = await Pool.query( query.toString( ) );
    const observationPhotosCounts = _.countBy( rows, "observation_id" );
    let obsPhotoPosition = 0;
    let lastObsID = 0;
    const sortedRows = _.sortBy( rows, ["observation_id", "position"] );
    // ensure photo positions are in sequence starting at 0
    _.each( sortedRows, row => {
      if ( row.observation_id !== lastObsID ) {
        lastObsID = row.observation_id;
        obsPhotoPosition = 0;
      } else {
        obsPhotoPosition += 1;
      }
      row.observationPhotoCount = observationPhotosCounts[row.observation_id];
      row.position = obsPhotoPosition;
    } );
    const observationPhotos = _.keyBy( sortedRows, "photo_id" );
    await this.flaggedItems( "Photo", observationPhotos );
    return _.omitBy( observationPhotos, "flagged" );
  }

  // process photos of observations with the supplied IDs
  async photosForObservations( taxon, observations ) {
    const obsPhotos = await this.observationPhotos( taxon, observations );
    if ( _.isEmpty( obsPhotos ) ) { return []; }
    const query = squel.select( )
      .field( "id" )
      .field( "file_prefix_id" )
      .field( "file_extension_id" )
      .from( "photos p" )
      .where( "id IN ?", _.keys( obsPhotos ) );
    const { rows } = await Pool.query( query.toString( ) );
    _.each( rows, row => {
      if ( this.filePrefixes[row.file_prefix_id] && this.fileExtensions[row.file_extension_id] ) {
        obsPhotos[row.id].photo = row;
        const filePrefix = this.filePrefixes[row.file_prefix_id];
        const fileExtension = this.fileExtensions[row.file_extension_id];
        obsPhotos[row.id].photo.medium_url = `${filePrefix}/${row.id}/medium.${fileExtension}`;
        obsPhotos[row.id].observation = observations[obsPhotos[row.id].observation_id];
      }
    } );
    return _.filter( _.values( obsPhotos ), op => (
      !_.isEmpty( op.photo ) && !_.isEmpty( op.photo.medium_url )
    ) );
  }

  async maxTaxonID( ) {
    const query = squel.select( ).field( "MAX(id) AS max" ).from( "taxa" );
    const { rows } = await Pool.query( query.toString( ) );
    return rows[0].max;
  }

  taxonNeedsProcessing( taxon ) {
    // taxa that are fully "populated" or complete because
    // decendants are populated don't need to be processed
    return !_.includes( ["complete", "polulated", "skipped"], taxon.status );
  }

  // returns true if taxon is already in a filter branch
  assessWithinFilterBranch( taxon, withinFilterBranch ) {
    if ( withinFilterBranch ) { return true; }
    if ( _.isEmpty( this.selectTaxonIDs ) ) { return false; }
    // this is a filter taxon, so set selectedBranch
    if ( _.includes( this.selectTaxonIDs, taxon.id ) ) { return true; }
    if ( !_.includes( this.selectTaxonAncestors, taxon.id ) ) {
      // this isn't a filter taxon or a descendant of one, so skip this branch
      taxon.status = "skipped";
      return false;
    }
    return false;
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
    // const todaysDate = moment( ).format( "YYYYMMDDHHmmss" );
    // this.outputDirName = `vision-export-${todaysDate}`;
    this.outputDirName = "exporttest";
    this.outputDir = path.join( this.runOptions.dir, this.outputDirName );
    if ( !fs.existsSync( this.outputDir ) ) {
      fs.mkdirSync( this.outputDir );
    }
  }

  async createCSVFiles( ) {
    this.taxonomyFileStream = fs.createWriteStream(
      path.join( this.outputDir, "taxonomy.csv" ), { flags: "w" }
    );
    await this.writeToFile( this.taxonomyFileStream,
      "parent_taxon_id,taxon_id,rank_level,leaf_class_id,iconic_class_id,name" );

    this.taxonomyVisualFileStream = fs.createWriteStream(
      path.join( this.outputDir, "taxonomy_visual.txt" ), { flags: "w" }
    );
    await this.writeToFile( this.taxonomyVisualFileStream,
      "Name, ID, Rank, Status, (Train::Val::Test::Spatial)\n" );

    this.iconicFileStream = fs.createWriteStream(
      path.join( this.outputDir, "iconic_taxa.csv" ), { flags: "w" }
    );
    await this.writeToFile( this.iconicFileStream,
      "iconic_taxon_id,iconic_class_id,name" );

    this.spatialFileStream = fs.createWriteStream(
      path.join( this.outputDir, "spatial_data.csv" ), { flags: "w" }
    );
    await this.writeToFile( this.spatialFileStream,
      "observation_id,latitude,longitude,observed_on,leaf_class_id,iconic_class_id,taxon_id,obs_taxon_id,community,captive" );

    await util.forEachInSequence( ["train", "val", "test"], async set => {
      const streamName = `${set}FileStream`;
      this[streamName] = fs.createWriteStream(
        path.join( this.outputDir, `${set}_data.csv` ), { flags: "w" }
      );
      await this.writeToFile( this[streamName], "photo_id,photo_url,leaf_class_id,iconic_class_id,taxon_id,obs_taxon_id,community" );
    } );
  }

  taxonAncestry( taxon ) {
    if ( taxon && taxon.parentID ) {
      const parentAncestry = this.taxonAncestry( this.taxa[taxon.parentID] );
      return `${parentAncestry}/${taxon.id}`;
    }
    return `${taxon.id}`;
  }

  async lookupCandidateTaxaInBatches( ) {
    let iterationStartID;
    const batchSize = 1000;
    const maxID = await this.maxTaxonID( );
    const promiseProducer = ( ) => {
      iterationStartID = _.isUndefined( iterationStartID ) ? 0 : iterationStartID + batchSize;
      if ( iterationStartID > maxID ) {
        return null;
      }
      return this.taxaProcessor( {
        startID: iterationStartID,
        endID: iterationStartID + batchSize
      } );
    };
    // lookup candidate taxa in batches of 1000, running this.taxaConcurrency queries at once
    await this.asyncPromisePool( promiseProducer, this.taxaConcurrency );
  }

  //
  // lookup all file prefixes and populat an instance variable with the results
  //
  async lookupFilePrefixes( ) {
    const query = squel.select( )
      .field( "id" )
      .field( "prefix" )
      .from( "file_prefixes" );
    const { rows } = await Pool.query( query.toString( ) );
    this.filePrefixes = _.fromPairs( _.map( rows, r => ( [r.id, r.prefix] ) ) );
  }

  //
  // lookup all file extensions and populat an instance variable with the results
  //
  async lookupFileExtensions( ) {
    const query = squel.select( )
      .field( "id" )
      .field( "extension" )
      .from( "file_extensions" );
    const { rows } = await Pool.query( query.toString( ) );
    this.fileExtensions = _.fromPairs( _.map( rows, r => ( [r.id, r.extension] ) ) );
  }

  // lookup IDs of all globally extinct taxa and populate an instance variable with the results
  async lookupGloballyExtinctTaxonIDs( ) {
    const query = squel.select( )
      .field( "DISTINCT( taxon_id )" )
      .from( "conservation_statuses" )
      .where( "iucn = 70" )
      .where( "place_id IS NULL" );
    const { rows } = await Pool.query( query.toString( ) );
    this.extinctTaxonIDs = _.keyBy( _.map( rows, "taxon_id" ) );
  }

  // basic logging of progress for a depth-first pass of taxon lookups
  outputProgress( ) {
    this.counter += 1;
    if ( this.counter % 100 !== 0 ) { return; }
    const timeElapsed = ( Date.now( ) - this.startTime ) / 1000;
    const perSecond = this.counter / timeElapsed;
    const secondsLeft = ( this.total - this.counter ) / perSecond;
    console.log( `Processed ${this.counter} taxa in ${_.round( timeElapsed, 2 )}s; `
      + `${_.round( perSecond, 2 )}/s; ${_.round( secondsLeft, 2 )}s left; ` );
  }

  // write to the console a hierarchical representation of all taxa assessed for the export
  async printTree( taxon = null, ancestorLinePrefix = "", linePrefix = "" ) {
    if ( taxon ) {
      const taxaFileFields = [
        taxon.parentID === Taxon.life.id ? "" : taxon.parentID,
        taxon.id,
        taxon.rank_level,
        _.has( this.taxonLeafClasses, taxon.id ) ? this.taxonLeafClasses[taxon.id] : "",
        _.has( this.taxonLeafClasses, taxon.id ) ? this.taxonIconicClasses[taxon.iconic_taxon_id] : "",
        taxon.name ? taxon.name.replace( /,/g, "" ) : ""
      ];
      if ( taxon.parentID !== 0 && taxon.status !== "incomplete" ) {
        await this.writeToFile( this.taxonomyFileStream, taxaFileFields.join( "," ) );
      }

      let consoleOutput = `\x1b[33m${linePrefix}\x1b[0m\x1b[32m${taxon.name}\x1b[0m \x1b[34mID: ${taxon.id}\x1b[0m ${taxon.status}`;
      let fileOutput = `${linePrefix}${taxon.name}, ${taxon.id}, ${taxon.rank}, ${taxon.status}`;
      if ( taxon.status !== "complete" ) {
        const counts = `, ${taxon.trainCount}::${taxon.testCount}::${taxon.valCount}::${taxon.spatialCount}`;
        consoleOutput += counts;
        fileOutput += counts;
      }
      if ( _.has( this.runOptions, "print-taxonomy" ) ) { console.log( consoleOutput ); }
      await this.writeToFile( this.taxonomyVisualFileStream, fileOutput );
    }

    const childIDs = taxon ? this.taxonChildren[taxon.id] : this.taxonChildren[0];
    if ( !_.isEmpty( childIDs ) && !( taxon && _.includes( this.customLeafTaxonIDs, taxon.id ) ) ) {
      const children = _.map( _.keys( childIDs ), childID => this.taxa[childID] );
      const unskippedChildren = _.filter( children, child => (
        child.status !== "skipped"
      ) );
      const lastChild = _.last( unskippedChildren );

      await util.forEachInSequence( unskippedChildren, async child => {
        const lastInBranch = child.id === lastChild.id;
        let icon = lastInBranch ? "└──" : "├──";
        let prefixIcon = lastInBranch ? "   " : "│   ";
        if ( _.isEmpty( taxon ) ) {
          icon = "";
          prefixIcon = "";
        }
        await this.printTree( child, `${ancestorLinePrefix}${prefixIcon}`, `${ancestorLinePrefix}${icon}` );
      } );
    }
  }

  async printStats( ) {
    const speciesLeafCount = _.size( _.filter( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].rank_level === 10 ) );
    const taxaTotal = _.sum( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].taxaCount ) );
    const trainTotal = _.sum( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].trainCount ) );
    const avgTrain = _.mean( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].trainCount ) );
    const testTotal = _.sum( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].testCount ) );
    const valTotal = _.sum( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].valCount ) );
    const spatialTotal = _.sum( _.map( _.keys( this.taxonLeafClasses ),
      taxonID => this.taxa[taxonID].spatialCount ) );
    const stats = [
      `Total leaves: ${this.leafClassIndex}`,
      `Total species leaves: ${speciesLeafCount}`,
      `Total different taxa: ${taxaTotal}`,
      `Total train photos: ${trainTotal}`,
      `Total test photos: ${testTotal}`,
      `Total val photos: ${valTotal}`,
      `Total spatial points: ${spatialTotal}`,
      `Average train per leaf: ${avgTrain}`
    ];
    await util.forEachInSequence( stats, async stat => {
      console.log( stat );
      await this.writeToFile( this.taxonomyVisualFileStream, stat );
    } );
  }

  async writeIconicTaxa( ) {
    await util.forEachInSequence( _.keys( this.taxonIconicClasses ), async iconicTaxonID => {
      const taxon = this.taxa[iconicTaxonID];
      const iconicFileFields = [
        iconicTaxonID,
        this.taxonIconicClasses[iconicTaxonID],
        taxon ? taxon.name : "Unassigned"
      ];
      await this.writeToFile( this.iconicFileStream, iconicFileFields.join( "," ) );
    } );
  }

  async closeOutputFiles( ) {
    this.trainFileStream.end( );
    await finished( this.trainFileStream );
    this.testFileStream.end( );
    await finished( this.testFileStream );
    this.valFileStream.end( );
    await finished( this.valFileStream );
    this.spatialFileStream.end( );
    await finished( this.spatialFileStream );
    this.taxonomyFileStream.end( );
    await finished( this.taxonomyFileStream );
    this.iconicFileStream.end( );
    await finished( this.iconicFileStream );
  }

  async writeToFile( fileStream, line ) {
    if ( !fileStream.write( `${line}\n` ) ) {
      await once( fileStream, "drain" );
    }
  }

  async asyncPromisePool( promiseProducer, concurrency ) {
    const pool = new PromisePool( promiseProducer, concurrency );
    await pool.start( );
  }
};

module.exports = VisionDataExporter;
