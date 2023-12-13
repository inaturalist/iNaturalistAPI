/* eslint-disable no-console */
const _ = require( "lodash" );
const h3 = require( "h3-js" );
const fs = require( "fs" );
const csv = require( "fast-csv" );
const squel = require( "safe-squel" );
const PromisePool = require( "es6-promise-pool" );
const path = require( "path" );
const shape2geohash = require( "shape2geohash" );
const moment = require( "moment" );
const Pool = require( "./pg_pool" );
const esClient = require( "./es_client" );
const ObservationsController = require( "./controllers/v1/observations_controller" );

const fsPromises = fs.promises;

const ModelTaxonRangeProcessor = class ModelTaxonRangeProcessor {
  constructor( options = { } ) {
    console.log( options );
    this.runOptions = options;
    this.taxonomyPath = options["taxonomy-path"];
  }

  async start( ) {
    await this.createOutputDir( );
    const taxonIDs = await this.modelLeafTaxonIDs( );

    this.taxaProcessed = 0;
    this.startTime = Date.now( );
    this.totalTaxa = _.size( taxonIDs );
    const promiseProducer = ( ) => {
      if ( _.isEmpty( taxonIDs ) ) {
        return null;
      }
      this.outputProgress( );
      const taxonID = taxonIDs.shift( );
      return this.processTaxon( taxonID );
    };
    const pool = new PromisePool( promiseProducer, 1 );
    await pool.start( );
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
    this.outputDirName = `taxon_range_eval-${todaysDate}`;
    this.outputDir = path.join( this.runOptions.dir, this.outputDirName );
    if ( !fs.existsSync( this.outputDir ) ) {
      fs.mkdirSync( this.outputDir );
    }

    this.taxonRangeDirName = "taxon_range_csvs";
    this.taxonRangeDir = path.join( this.outputDir, this.taxonRangeDirName );
    if ( !fs.existsSync( this.taxonRangeDir ) ) {
      fs.mkdirSync( this.taxonRangeDir );
    }

    this.taxonRangeRecallsFileStream = fs.createWriteStream(
      path.join( this.outputDir, "taxon_range_recalls.csv" ), { flags: "w" }
    );
    this.taxonRangeRecallsFileStream.write(
      "taxon_id,recall,observation_count,range_cell_count,observation_cell_count,"
      + "intersection_cell_count,intersection_observation_count,observation_recall\n"
    );
  }

  async modelLeafTaxonIDs( ) {
    return new Promise( resolve => {
      const taxonIDs = [];
      const readStream = fs.createReadStream( this.taxonomyPath );
      csv.parseStream( readStream, { headers: true } )
        .on( "data", row => {
          if ( row.leaf_class_id ) {
            taxonIDs.push( Number( row.taxon_id ) );
          }
        } ).on( "end", ( ) => {
          resolve( taxonIDs );
        } );
    } );
  }

  geoJSONCoordinatesToH3Cells( coordinates, resolution = 5 ) {
    let h3Cells = [];
    if ( _.isArray( coordinates[0][0] ) ) {
      _.each( coordinates, subCoordinates => {
        h3Cells = h3Cells.concat( this.geoJSONCoordinatesToH3Cells( subCoordinates, resolution ) );
      } );
    } else {
      h3Cells = _.map(
        h3.polygonToCells( coordinates, resolution, true ), cell => h3.cellToParent( cell, 4 )
      );
    }
    return _.uniq( h3Cells );
  }

  static async evaluateTaxonRangeRecall( taxonID, geojson ) {
    // turn the taxon range GeoJSON into an array of Geohashes at resolution 3
    const taxonRangeGeohashes = await shape2geohash( geojson, {
      precision: 3
    } );

    // query Elasticsearch for Geohashes where the taxon has been observed
    const queryRequest = {
      query: {
        taxon_id: taxonID,
        verifiable: "any",
        captive: "false"
      }
    };
    const elasticQuery = await ObservationsController.reqToElasticQuery( queryRequest );
    const searchHash = esClient.searchHash( elasticQuery );
    const elasticSearchBody = {
      size: 0,
      query: searchHash.query,
      aggregations: {
        zoom1: {
          geohash_grid: {
            field: "location",
            size: 100000,
            precision: 3
          }
        }
      }
    };
    const result = await esClient.search( "observations", {
      body: {
        ...elasticSearchBody,
        track_total_hits: false
      }
    } );

    // compare observation Geohashes to the taxon range Geohashes
    const observationGeohashes = _.map( result.aggregations.zoom1.buckets, "key" );
    const observationCount = _.sum( _.map( result.aggregations.zoom1.buckets, "doc_count" ) );
    const intersectionGeohashes = _.intersection( taxonRangeGeohashes, observationGeohashes );
    const intersectionObservationCount = _.sum( _.map( _.filter( result.aggregations.zoom1.buckets,
      b => _.includes( intersectionGeohashes, b.key ) ), "doc_count" ) );
    const cellRecall = _.isEmpty( observationGeohashes )
      ? 0 : _.round( _.size( intersectionGeohashes ) / _.size( observationGeohashes ), 6 );
    const observationsRecall = observationCount === 0
      ? 0 : _.round( intersectionObservationCount / observationCount, 6 );
    return {
      observationCount,
      observationCellCount: _.size( observationGeohashes ),
      intersectionCellCount: _.size( intersectionGeohashes ),
      cellRecall,
      intersectionObservationCount,
      observationsRecall
    };
  }

  async processTaxon( taxonID ) {
    // fetch the taxon range for this taxon, if available, as GeoJSON
    const query = squel
      .select( )
      .field( "taxon_id" )
      .field( "ST_AsGeoJSON(geom) as geojson" )
      .from( "taxon_ranges" )
      .where( "taxon_id = ?", taxonID )
      .order( "ST_MemSize(geom)", false )
      .limit( 1 );
    const { rows } = await Pool.query( query.toString( ) );
    if ( _.isEmpty( rows ) ) {
      return;
    }
    if ( _.isEmpty( rows[0].geojson ) ) {
      return;
    }

    try {
      console.log( `taxonID: ${taxonID}` );
      const geojson = JSON.parse( rows[0].geojson );
      // turn the GeoJSON into an array of H3 cell IDs at resolution 5
      const h3Cells = _.sortBy( this.geoJSONCoordinatesToH3Cells( geojson.coordinates, 5 ) );
      if ( _.isEmpty( h3Cells ) ) {
        return;
      }
      // evaluate the taxon range compared to observations of the taxon
      const evaluation = await ModelTaxonRangeProcessor.evaluateTaxonRangeRecall(
        taxonID, geojson
      );

      if ( evaluation.cellRecall ) {
        // if there is a recall to report, write it to the output, and save the taxon range H3 cells
        this.taxonRangeRecallsFileStream.write(
          `${taxonID},${evaluation.cellRecall},${evaluation.observationCount},${_.size( h3Cells )},`
          + `${evaluation.observationCellCount},${evaluation.intersectionCellCount},`
          + `${evaluation.intersectionObservationCount},${evaluation.observationsRecall}\n`
        );
        const taxonRangeCellsPath = path.join( this.taxonRangeDir, `${taxonID}.csv` );
        fs.writeFileSync( taxonRangeCellsPath, h3Cells.join( "\n" ) );
      }
    } catch ( e ) {
      console.log( e );
    }
  }

  outputProgress( ) {
    this.taxaProcessed += 1;
    if ( this.taxaProcessed % 10 === 0 ) {
      const timeElapsed = ( Date.now( ) - this.startTime ) / 1000;
      const perSecond = this.taxaProcessed / timeElapsed;
      const secondsLeft = ( this.totalTaxa - this.taxaProcessed ) / perSecond;
      console.log( `Processed ${this.taxaProcessed} of ${this.totalTaxa} taxa in `
        + `${_.round( timeElapsed, 2 )}s; ${_.round( perSecond, 2 )}/s; `
        + `${_.round( secondsLeft, 2 )}s left; ` );
    }
  }
};

module.exports = ModelTaxonRangeProcessor;
