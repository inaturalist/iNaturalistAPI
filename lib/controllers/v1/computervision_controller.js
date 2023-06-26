const _ = require( "lodash" );
const fs = require( "fs" );
const csv = require( "fast-csv" );
const fetch = require( "node-fetch" );
const FormData = require( "form-data" );
const path = require( "path" );
const squel = require( "safe-squel" );
const md5 = require( "md5" );
const PromisePool = require( "es6-promise-pool" );
const pgClient = require( "../../pg_client" );
const redisClient = require( "../../redis_client" );
const ObservationsController = require( "./observations_controller" );
const TaxaController = require( "./taxa_controller" );
const InaturalistAPI = require( "../../inaturalist_api" );
const config = require( "../../../config" );
const util = require( "../../util" );
const Taxon = require( "../../models/taxon" );
const FileCache = require( "../../vision/file_cache" );

// number of image results checked for common ancestor
const DEFAULT_ANCESTOR_WINDOW = 10;
// common ancestor score threshold
const DEFAULT_ANCESTOR_THRESHOLD = 80;
// common ancestor can be no higher than superfamily
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 33;

const TFServingTaxonDescendants = { };
const TFServingTaxonAncestries = { };
const TFServingThresholds = { };
let TFServingThresholdMedian = 2;

let thresholdsLoading = false;

const ComputervisionController = class ComputervisionController {
  static async cacheTaxonAncestries( taxonIDs ) {
    if ( _.isEmpty( taxonIDs ) ) {
      return;
    }
    const query = squel.select( ).field( "id, ancestry" ).from( "taxa" )
      .where( "id IN ?", taxonIDs );
    const { rows } = await pgClient.query( query.toString( ) );
    _.each( rows, row => {
      const taxonID = row.id;
      if ( !row.ancestry ) { return; }
      const ancestors = row.ancestry.split( "/" );
      TFServingTaxonAncestries[taxonID] = ancestors;
      TFServingTaxonDescendants[taxonID] = TFServingTaxonDescendants[taxonID] || {};
      TFServingTaxonDescendants[taxonID][taxonID] = true;
      _.each( ancestors, ancestorID => {
        TFServingTaxonDescendants[ancestorID] = TFServingTaxonDescendants[ancestorID] || {};
        TFServingTaxonDescendants[ancestorID][taxonID] = true;
      } );
    } );
  }

  static async loadThresholds( ) {
    return new Promise( resolve => {
      if ( !config.imageProcesing.thresholdsPath
        || !_.isEmpty( TFServingThresholds )
        || thresholdsLoading
        || !fs.existsSync( config.imageProcesing.thresholdsPath )
      ) {
        resolve( );
        return;
      }
      thresholdsLoading = true;
      const stream = fs.createReadStream( config.imageProcesing.thresholdsPath );
      this.testData = [];
      csv.parseStream( stream, { headers: true } )
        .on( "data", row => {
          TFServingThresholds[row.tid] = Number( row.thres ) * 100;
        } ).on( "end", ( ) => {
          TFServingThresholdMedian = util.median( _.values( TFServingThresholds ) );
          thresholdsLoading = false;
          resolve( );
        } );
    } );
  }

  static async cacheAllTaxonAncestries( ) {
    if ( !( config.imageProcesing && config.imageProcesing.taxaFilePath
         && fs.existsSync( config.imageProcesing.taxaFilePath ) ) ) {
      return;
    }
    if ( !_.isEmpty( TFServingTaxonAncestries ) ) {
      return;
    }
    await ComputervisionController.loadThresholds( );
    const TFServingTaxonIDs = fs.readFileSync( config.imageProcesing.taxaFilePath )
      .toString( ).split( "\n" ).map( l => {
        const parts = l.split( ":" );
        return parts[1] ? Number( parts[1].trim( ) ) : 0;
      } );
    const idChunks = _.chunk( TFServingTaxonIDs, 500 );
    const promiseProducer = ( ) => {
      const chunk = idChunks.shift( );
      if ( !chunk ) {
        return null;
      }
      return ComputervisionController.cacheTaxonAncestries( chunk );
    };
    const pool = new PromisePool( promiseProducer, 3 );
    await pool.start( );
  }

  static async scoreObservation( req ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    const obsID = Number( req.params.id );
    if ( !obsID ) {
      throw util.httpError( 422, "Missing observation ID or UUID" );
    }
    const searchReq = { query: { id: obsID } };
    // fetch the obs metadata
    const response = await ObservationsController.search( searchReq );
    if ( !response || _.isEmpty( response.results ) ) {
      throw util.httpError( 422, "Unknown observation" );
    }
    const observation = response.results[0];
    let photoURL;
    _.each( observation.photos, p => {
      if ( photoURL ) { return; }
      if ( !p.url ) { return; }
      photoURL = p.url;
      if ( photoURL.match( /\/square\./i ) ) {
        photoURL = p.url.replace( "/square.", "/medium." );
      }
    } );
    if ( !photoURL ) {
      throw util.httpError( 422, "Observation has no scorable photos" );
    }
    req.query.image_url = photoURL;
    return ComputervisionController.scoreImageURL( req, { observation } );
  }

  static async scoreImageURL( req, options = { } ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    const photoURL = req.query.image_url;
    if ( !photoURL ) {
      throw util.httpError( 422, "No scorable photo" );
    }
    // download the JPG
    const parsedPhotoURL = path.parse( photoURL );
    const tmpFilename = `${md5( photoURL )}${parsedPhotoURL.ext.replace( /\?.+/, "" )}`;
    const tmpPath = path.resolve( config.imageProcesing.uploadsDir, tmpFilename );

    const imageRequestAbortController = new AbortController( );
    const imageRequestTimeout = setTimeout( ( ) => {
      imageRequestAbortController.abort( );
    }, 10000 );
    let response;
    try {
      response = await fetch( photoURL, {
        signal: imageRequestAbortController.signal
      } );
      if ( !response.ok ) {
        throw util.httpError( 500, "Image download failed" );
      }
    } catch ( error ) {
      throw util.httpError( 500, "Image download failed" );
    } finally {
      clearTimeout( imageRequestTimeout );
    }
    await fs.promises.writeFile( tmpPath, response.body, "binary" );
    const scoreImageReq = Object.assign( req, {
      file: {
        filename: tmpFilename,
        mimetype: "image/jpeg",
        path: tmpPath
      }
    } );
    if ( !scoreImageReq.body ) { scoreImageReq.body = { }; }
    scoreImageReq.body.lat = scoreImageReq.body.lat || req.query.lat;
    scoreImageReq.body.lng = scoreImageReq.body.lng || req.query.lng;
    scoreImageReq.body.radius = scoreImageReq.body.radius || req.query.radius;
    scoreImageReq.body.taxon_id = scoreImageReq.body.taxon_id || req.query.taxon_id;
    if ( options.observation ) {
      scoreImageReq.body.observation_id = options.observation.id;
      if ( !scoreImageReq.body.lat && options.observation.location ) {
        const latLng = options.observation.location.split( "," );
        scoreImageReq.body.lat = latLng[0];
        scoreImageReq.body.lng = latLng[1];
      }
      if ( !scoreImageReq.body.observed_on && options.observation.observed_on ) {
        scoreImageReq.body.observed_on = options.observation.observed_on;
      }
      if ( !scoreImageReq.body.taxon_id
           && options.observation.taxon
           && options.observation.taxon.iconic_taxon_id ) {
        scoreImageReq.body.taxon_id = options.observation.taxon.iconic_taxon_id;
      }
    }
    // score the downloaded JPG
    return ComputervisionController.scoreImage( scoreImageReq );
  }

  static async scoreImage( req ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    req.file = req.file || (
      req.files
      && req.files.image
      && req.files.image.length > 0
      && req.files.image[0]
    );
    if ( !req.file ) {
      throw util.httpError( 422, "No image provided" );
    }
    return ComputervisionController.scoreImageUpload( req.file.path, req );
  }

  static async scoreImagePath( uploadPath, req ) {
    if ( req.inat && req.inat.visionCacheKey ) {
      const cachedScores = FileCache.cacheExists( req.inat.visionCacheKey );
      if ( cachedScores ) {
        return JSON.parse( cachedScores );
      }
    }
    const formData = new FormData();
    formData.append( "image", fs.createReadStream( uploadPath ), {
      type: req.file.mimetype,
      knownLength: fs.statSync( uploadPath ).size
    } );
    if ( config.imageProcesing.geomodel || req.query.geomodel ) {
      formData.append( "geomodel", "true" );
      if ( !req.body.skip_frequencies && req.body.lat && req.body.lng ) {
        formData.append( "lat", req.body.lat );
        formData.append( "lng", req.body.lng );
      }
    }

    const requestAbortController = new AbortController( );
    const requestTimeout = setTimeout( ( ) => {
      requestAbortController.abort( );
    }, 5000 );
    let json;
    try {
      const response = await fetch( config.imageProcesing.tensorappURL, {
        method: "POST",
        body: formData,
        signal: requestAbortController.signal
      } );
      if ( !response.ok ) {
        throw util.httpError( 500, "Error scoring image" );
      }
      json = await response.json( );
    } catch ( error ) {
      throw util.httpError( 500, "Error scoring image" );
    } finally {
      clearTimeout( requestTimeout );
    }

    let scores;
    let numericalCompareProperty;
    if ( config.imageProcesing.geomodel || req.query.geomodel ) {
      scores = _.map( json, score => ( {
        taxon_id: Number( score.id ),
        vision_score: score.vision_score,
        combined_score: score.combined_score,
        original_geo_score: score.geo_score,
        original_combined_score: score.combined_score,
        geo_threshold: score.geo_threshold
      } ) );
      numericalCompareProperty = "combined_score";
      const sumOfCombinedScores = _.sum( _.map( scores, "combined_score" ) );
      if ( sumOfCombinedScores === 0 ) {
        _.each( scores, s => { s.combined_score = s.vision_score; } );
      }
    } else {
      scores = _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        vision_score: score
      } ) );
      numericalCompareProperty = "count";
    }

    // replace inactive taxa with their active counterparts, remove remaining inactive
    const r = await TaxaController.replaceInactiveTaxa( scores, {
      removeInactive: true,
      numericalCompareProperty
    } );
    const { updatedObjects: activeTaxonScores, newTaxonIDs } = r;

    if ( req.inat && req.inat.visionCacheKey ) {
      FileCache.cacheFile( req.inat.visionCacheKey, JSON.stringify( activeTaxonScores ) );
    }
    // if there were taxa added to the counts to replace inactive taxa,
    // their ancestries need to be cached for fast common ancestor lookups.
    // Lookup only the taxa that haven't aleady been cached
    await ComputervisionController.cacheAllTaxonAncestries( );
    const allResultTaxonIDs = _.map( activeTaxonScores, "taxon_id" ).concat( newTaxonIDs );
    const newIDsToCache = _.filter( allResultTaxonIDs,
      taxonID => _.isEmpty( TFServingTaxonAncestries[taxonID] ) );
    await ComputervisionController.cacheTaxonAncestries( newIDsToCache );
    return activeTaxonScores;
  }

  static async filterScoresByTaxon( req, scores ) {
    if ( parseInt( req.body.taxon_id, 10 ) > 0 ) {
      await ComputervisionController.cacheAllTaxonAncestries( );
      if ( !TFServingTaxonDescendants[req.body.taxon_id] ) {
        return [];
      }
      return _.filter( scores, s => TFServingTaxonDescendants[req.body.taxon_id][s.taxon_id] );
    }
    return scores;
  }

  static async combinedModelScoresProcessing( req, scores ) {
    ComputervisionController.normalizeScores( scores, "combined_score" );

    if ( config.imageProcesing.combinedThreshold ) {
      // set the threshold to a percentage of the top combined_score
      const thresholdScore = config.imageProcesing.combinedThreshold
        * _.max( _.map( scores, "combined_score" ) );
      // ignore scores below the threshold
      scores = _.filter( scores, s => s.combined_score > thresholdScore );
    }

    if ( req.query.test_feature === "geo_elevation" ) {
      _.each( scores, s => {
        s.frequency_score = s.original_geo_score > s.geo_threshold ? 1 : 0;
        delete s.geo_threshold;
      } );
    } else if ( !req.body.skip_frequencies && req.body.lat && req.body.lng ) {
      const includeTaxonIDs = _.map( scores, "taxon_id" );
      // excluding date for now
      const nearbyReq = {
        inat: { includeTaxonIDs },
        query: {
          lat: req.body.lat,
          lng: req.body.lng,
          taxon_id: includeTaxonIDs
        }
      };
      const { results: nearbyTaxonCounts } = await TaxaController.nearby( nearbyReq );
      const nearbyTaxonIDs = _.map( nearbyTaxonCounts, c => c.taxon.id );
      _.each( scores, s => {
        let scoredTaxonIsNearby;
        if ( config.imageProcesing.geoThresholds
          && req.query.geothresholds
          && !_.isEmpty( TFServingThresholds )
        ) {
          scoredTaxonIsNearby = TFServingThresholds[s.taxon_id]
            ? s.original_geo_score > TFServingThresholds[s.taxon_id]
            : s.original_geo_score > TFServingThresholdMedian;
        } else {
          scoredTaxonIsNearby = _.includes( nearbyTaxonIDs, s.taxon_id );
        }
        s.frequency_score = scoredTaxonIsNearby ? 1 : 0;
      } );
    }

    const commonAncestor = await ComputervisionController.commonAncestor( req, scores, {
      scoreForCalculation: req.body.ancestor_score_type === "vision" ? "vision_score" : "combined_score"
    } );

    return ComputervisionController.scoreImageResponse(
      req, commonAncestor, _.reverse( _.sortBy( scores, "combined_score" ) )
    );
  }

  static async scoreImageUpload( uploadPath, req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const imageScores = await ComputervisionController.scoreImagePath( uploadPath, req );
    let scores = _.filter( imageScores, s => s.vision_score > 0 );
    scores = await ComputervisionController.filterScoresByTaxon( req, scores );
    if ( _.isEmpty( scores ) ) {
      return InaturalistAPI.basicResponse( req );
    }

    if ( config.imageProcesing.geomodel || req.query.geomodel ) {
      return ComputervisionController.combinedModelScoresProcessing( req, scores );
    }
    return ComputervisionController.traditionalScoresProcessing( req, scores );
  }

  static async traditionalScoresProcessing( req, scores ) {
    scores = _.sortBy( scores, "vision_score" ).reverse( );
    ComputervisionController.normalizeScores( scores, "vision_score" );
    const commonAncestor = await ComputervisionController.commonAncestor( req, scores );
    let frequencyFunction;
    // if the redis client is configured and the app is configured to,
    // or the request asks for it, query Redis for frequency data
    if ( !_.isEmpty( redisClient )
      && ( req.body.redis_frequencies === "true" || config.imageProcesing.frequencyBackend === "redis" ) ) {
      frequencyFunction = ComputervisionController.nearbyTaxonFrequenciesRedis;
    } else {
      // otherwise query Elasticsearch for frequency data
      frequencyFunction = ComputervisionController.nearbyTaxonFrequencies;
    }
    const nearbyTaxa = await frequencyFunction( req, scores, commonAncestor );
    return ComputervisionController.scoreImageAfterFrequencies(
      req, scores, nearbyTaxa, commonAncestor
    );
  }

  static async scoreImageAfterFrequencies( req, rawVisionScores, nearbyTaxa, commonAncestor ) {
    // using _.has just checks to see results is an attribute of nearbyTaxa,
    // it would still be true if there were no nearby results, in which case
    // there would be no results at all
    if ( nearbyTaxa && _.has( nearbyTaxa, "results" ) ) {
      const ancestorNearbyTaxaResults = [];
      const unrelatedNearbyTaxaResults = [];
      const relatedNearbyTaxa = { };
      const unrelatedNearbyTaxa = { };
      const frequencyScores = { };
      const visionScores = { };
      const taxonScores = { };
      let topScores;
      // set frequencyScores and mark if nearby taxon is related to common ancestor
      _.each( nearbyTaxa.results, r => {
        if ( commonAncestor && r.taxon && r.taxon.ancestor_ids
             && r.taxon.ancestor_ids.includes( commonAncestor.taxon.id ) ) {
          r.inCommonAncestor = true;
          relatedNearbyTaxa[r.taxon.id] = true;
          ancestorNearbyTaxaResults.push( r );
        } else if ( r.taxon ) {
          unrelatedNearbyTaxa[r.taxon.id] = true;
          unrelatedNearbyTaxaResults.push( r );
        }
        frequencyScores[r.taxon.id] = r.count;
      } );
      // only boost vision:
      //   a) given a common ancestor, using nearby taxa in that ancestor
      //   b) there are no common ancestors, using all nearby taxa
      const resultsToUse = commonAncestor ? ancestorNearbyTaxaResults : unrelatedNearbyTaxaResults;
      const sumScoresResultsToUse = _.reduce( resultsToUse, ( sum, r ) => ( sum + r.count ), 0 );
      _.each( resultsToUse, r => {
        const score = ( r.count / sumScoresResultsToUse );
        // default score for non-model nearby taxa is the frequency score
        taxonScores[r.taxon.id] = score * 0.75;
      } );
      if ( !_.isEmpty( redisClient )
        && ( req.body.redis_frequencies === "true" || config.imageProcesing.frequencyBackend === "redis" ) ) {
        _.each( rawVisionScores, r => {
          visionScores[r.taxon_id] = r.vision_score;
          if ( taxonScores[r.taxon_id] ) {
            // vision results with relevant frequency scores get a boost
            taxonScores[r.taxon_id] = r.vision_score
              * ( 3 + ( ( taxonScores[r.taxon_id] / 0.75 ) * 6 ) );
          } else {
            // everything else uses the raw vision score
            taxonScores[r.taxon_id] = r.vision_score;
          }
        } );
        topScores = _.map( taxonScores, ( v, k ) => (
          {
            taxon_id: k,
            combined_score: v,
            frequency_score: ( frequencyScores[k] || 0 ),
            vision_score: ( visionScores[k] || 0 )
          }
        ) );
      } else {
        _.each( rawVisionScores, r => {
          visionScores[r.taxon_id] = r.vision_score;
          // the ( ... || 1 ) prevents dividing by 0
          taxonScores[r.taxon_id] = taxonScores[r.taxon_id]
            ? taxonScores[r.taxon_id] * ( r.vision_score / 100 )
            : ( r.vision_score / 100 )
              * ( 1 / ( ( ancestorNearbyTaxaResults.length || 1 ) * 100 ) );
        } );
        topScores = _.map( taxonScores, ( v, k ) => {
          const baseVisScore = visionScores[k] ? v : v * ( 1 / rawVisionScores.length );
          return {
            taxon_id: k,
            combined_score: baseVisScore,
            frequency_score: ( frequencyScores[k] || 0 ) * 100,
            vision_score: ( visionScores[k] || 0 )
          };
        } );
      }
      topScores = _.sortBy( topScores, s => s.combined_score ).reverse( );
      ComputervisionController.normalizeScores( topScores, "combined_score" );
      return ComputervisionController.scoreImageResponse(
        req, commonAncestor, topScores.slice( 0, req.query.per_page )
      );
    }
    // there are no nearby taxa, so the combined_score is equal to the vision_score
    const topScores = _.map( rawVisionScores, s => ( { combined_score: s.vision_score, ...s } ) );
    return ComputervisionController.scoreImageResponse(
      req, commonAncestor, topScores.slice( 0, req.query.per_page )
    );
  }

  static async scoreImageResponse( req, commonAncestor, topScores, options = { } ) {
    req.inat.taxonPhotos = true;
    req.inat.taxonAncestries = true;
    const response = await TaxaController.speciesCountsResponse( req, topScores, {
      numericalCompareProperty: "combined_score"
    } );
    if ( req.query.test_feature === "geo_elevation" ) {
      response.experimental = "Elevation Geomodel, Geomodel Nearby";
    }

    const topResult = response.results[0];
    const topResultIsHuman = topResult && Taxon.homo
      && topResult.taxon.ancestor_ids.indexOf( Taxon.homo.id ) >= 0;

    if ( topResultIsHuman && response.results.length > 1 ) {
      const topResultDiff = topResult.combined_score - response.results[1].combined_score;
      if ( topResultDiff >= 20 ) {
        response.results = [topResult];
      }
    }
    // There is no common ancestor, or the common ancestor is Humans, so skip it
    // and don't recommend any common ancestors
    if (
      !commonAncestor
      || !commonAncestor.taxon
      || ( Taxon.homo && commonAncestor.taxon.id === Taxon.homo.id )
    ) {
      // If human is in the results but the results are spread out enough that
      // we didn't choose a common ancestors, just completely bail to avoid
      // suggesting a person is a non-human
      const humanResult = Taxon.homo
        && _.find( response.results, r => r.taxon.ancestor_ids.indexOf( Taxon.homo.id ) >= 0 );
      if ( humanResult && response.results.length > 1 ) {
        response.results = [];
      }
      return response;
    }

    // If we have a common ancestor, we need to reload it b/c it might have
    // been derived from an ancestor that doesn't have all its properties,
    // like names
    const taxon = await Taxon.findByID( commonAncestor.taxon.id );
    commonAncestor.taxon = new Taxon( taxon );
    const localeOpts = util.localeOpts( req );
    commonAncestor.taxon.prepareForResponse( localeOpts, { localeOpts } );
    response.common_ancestor = commonAncestor;
    return response;
  }

  static async commonAncestor( req, scores, opts = { } ) {
    const options = { scoreForCalculation: "vision_score", ...opts };
    let topScores = _.cloneDeep( scores );
    topScores = _.sortBy( topScores, options.scoreForCalculation ).reverse( );
    topScores = topScores.slice( 0, req.body.ancestor_window || DEFAULT_ANCESTOR_WINDOW );
    const speciesCountsReq = {
      query: {
        ...req.query,
        per_page: topScores.length
      },
      inat: {
        ...req.inat,
        taxonPhotos: true,
        taxonAncestries: true
      }
    };
    ComputervisionController.normalizeScores( topScores, options.scoreForCalculation );
    const results = await ComputervisionController.addTaxa( speciesCountsReq, topScores );
    const commonAncestor = ComputervisionController.commonAncestorByScore(
      req, results, req.body.ancestor_threshold || DEFAULT_ANCESTOR_THRESHOLD, options
    );
    if ( commonAncestor && commonAncestor.taxon.rank_level <= (
      req.body.rank_level_cutoff || DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF ) ) {
      return commonAncestor;
    }
    return null;
  }

  // turn { count: C, taxon_id: TID }
  // into { count: C, taxon: T }
  static async addTaxa( speciesCountsReq, scores ) {
    const { results } = await TaxaController.speciesCountsResponse( speciesCountsReq,
      _.cloneDeep( scores ) );
    return results;
  }

  static commonAncestorByScore( req, results, threshold, opts = { } ) {
    const options = { scoreForCalculation: "vision_score", ...opts };
    const roots = { };
    const children = { };
    const ancestorCounts = { };
    const taxaNearby = { };
    _.each( results, r => {
      let lastTaxon;
      if ( r.taxon.ancestors ) {
        _.each( r.taxon.ancestors.concat( [r.taxon] ), ( t, index ) => {
          if ( index === 0 ) {
            roots[t.id] = t;
          } else {
            children[lastTaxon.id] = children[lastTaxon.id] || { };
            children[lastTaxon.id][t.id] = t;
          }
          if ( r.frequency_score && !req.body.ancestor_nearby_ignore ) {
            taxaNearby[t.id] = true;
          }
          ancestorCounts[t.id] = ancestorCounts[t.id] || 0;
          ancestorCounts[t.id] += r[options.scoreForCalculation];
          lastTaxon = t;
        } );
      }
    } );
    const commonAncestor = ComputervisionController.commonAncestorByScoreSub(
      null, roots, children, ancestorCounts, taxaNearby, threshold
    );
    if ( !commonAncestor ) { return null; }
    return {
      taxon: commonAncestor,
      score: ancestorCounts[commonAncestor.id]
    };
  }

  static commonAncestorByScoreSub( taxon, roots, children, ancestorCounts, taxaNearby, threshold ) {
    if ( taxon && taxon.rank === "genus" ) { return taxon; }
    let commonAncestor = taxon;
    const iterationTaxa = taxon ? children[taxon.id] : roots;
    const sorted = _.sortBy( iterationTaxa, t => ( ancestorCounts[t.id] ) ).reverse( );
    _.each( sorted, ( t, index ) => {
      if ( !taxon && index !== 0 ) { return; }
      if ( !_.isEmpty( taxaNearby ) && !taxaNearby[t.id] ) { return; }
      if ( ancestorCounts[t.id] < threshold ) { return; }
      commonAncestor = ComputervisionController.commonAncestorByScoreSub(
        t, roots, children, ancestorCounts, taxaNearby, threshold
      );
    } );
    return commonAncestor;
  }

  static async nearbyTaxonFrequenciesRedis( req, scores, commonAncestor ) {
    if ( !scores || !req.body.lat || !req.body.lng || req.body.skip_frequencies === "true" ) {
      return null;
    }
    const includeTaxonIDs = _.map( scores, "taxon_id" );
    const nearbyReq = {
      inat: { includeTaxonIDs },
      query: {
        lat: req.body.lat,
        lng: req.body.lng,
        observed_on: req.body.observed_on,
        taxon_id: req.body.taxon_id
      }
    };
    if ( commonAncestor ) {
      nearbyReq.query.taxon_id = commonAncestor.taxon.id;
    }
    const { results } = await TaxaController.nearby( nearbyReq );
    // normalize raw taxon counts into a ratio of all counts
    ComputervisionController.normalizeScores( results );
    return { results };
  }

  static async nearbyTaxonFrequencies( req, scores, commonAncestor ) {
    if ( !scores || !req.body.lat || !req.body.lng || req.body.skip_frequencies === "true" ) {
      return null;
    }
    let taxonIDs = [];
    if ( commonAncestor ) {
      taxonIDs.push( commonAncestor.taxon.id );
    }
    taxonIDs = taxonIDs.concat( _.map( scores, "taxon_id" ) );
    const query = {
      quality_grade: "research",
      taxon_is_active: "true",
      taxon_id: taxonIDs,
      lat: req.body.lat,
      lng: req.body.lng,
      radius: req.body.radius || 100 // km
    };
    if ( req.body.observation_id ) {
      query.not_id = req.body.observation_id;
    }
    if ( req.body.observed_on ) {
      const parsedDate = util.parsedDateParam( req.body.observed_on );
      if ( parsedDate && parsedDate.isValid( ) ) {
        query.observed_after = parsedDate.subtract( req.body.window || 45, "days" )
          .format( "YYYY-MM-DDTHH:mm:ss" );
        query.observed_before = parsedDate.add( req.body.window || 45, "days" )
          .format( "YYYY-MM-DDTHH:mm:ss" );
      }
    }
    return ObservationsController.speciesCounts( { query } );
  }

  static normalizeScores( scores, key = "count" ) {
    const multiplier = 100;
    const sumScores = _.sum( _.map( scores, key ) );
    if ( sumScores === 0 ) {
      return;
    }
    _.each( scores, r => {
      r[key] = ( ( r[key] * multiplier ) / sumScores );
    } );
  }

  static modelContainsTaxonID( taxonID ) {
    return !!TFServingTaxonAncestries[taxonID];
  }
};

module.exports = ComputervisionController;
