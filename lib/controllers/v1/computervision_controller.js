const _ = require( "lodash" );
const fs = require( "fs" );
const request = require( "request" );
const requestPromise = require( "request-promise" );
const path = require( "path" );
const squel = require( "squel" );
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
const DEFAULT_ANCESTOR_THRESHOLD = 75;
// common ancestor can be no higher than superfamily
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 33;

const TFServingTaxonDescendants = { };
const TFServingTaxonAncestries = { };

const ComputervisionController = class ComputervisionController {
  static async cacheTaxonAncestries( taxonIDs ) {
    if ( _.isEmpty( taxonIDs ) ) {
      return;
    }
    const query = squel.select( ).field( "id, ancestry" ).from( "taxa" )
      .where( "id IN ?", taxonIDs );
    const { rows } = await pgClient.connection.query( query.toString( ) );
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

  static async cacheAllTaxonAncestries( ) {
    if ( !( config.imageProcesing && config.imageProcesing.taxaFilePath
         && fs.existsSync( config.imageProcesing.taxaFilePath ) ) ) {
      return;
    }
    if ( !_.isEmpty( TFServingTaxonAncestries ) ) {
      return;
    }
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
    return new Promise( ( resolve, reject ) => {
      if ( !req.userSession && !req.applicationSession ) {
        return void reject( util.httpError( 401, "Unauthorized" ) );
      }
      const photoURL = req.query.image_url;
      if ( !photoURL ) {
        return void reject( util.httpError( 422, "No scorable photo" ) );
      }
      // download the JPG
      const parsedPhotoURL = path.parse( photoURL );
      const tmpFilename = `${md5( photoURL )}${parsedPhotoURL.ext.replace( /\?.+/, "" )}`;
      const tmpPath = path.resolve( global.config.imageProcesing.uploadsDir, tmpFilename );
      request( photoURL ).pipe( fs.createWriteStream( tmpPath ) ).on( "close", ( ) => {
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
        ComputervisionController.scoreImage( scoreImageReq ).then( resolve );
      } );
    } );
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
    const formData = {
      image: {
        value: fs.createReadStream( uploadPath ),
        options: {
          filename: req.file.filename,
          contentType: req.file.mimetype
        }
      }
    };
    const options = {
      url: config.imageProcesing.tensorappURL,
      timeout: 5000,
      formData
    };
    let json;
    try {
      const body = await requestPromise.post( options );
      json = JSON.parse( body );
    } catch ( e ) {
      throw util.httpError( 500, "Error scoring image" );
    }
    const counts = _.map( json, ( score, id ) => ( {
      taxon_id: Number( id ),
      count: score
    } ) );
    // replace inactive taxa with their active counterparts, remove remaining inactive
    const r = await TaxaController.replaceInactiveTaxaCounts( counts, { removeInactive: true } );
    const { updatedCounts, newTaxonIDs } = r;
    if ( req.inat && req.inat.visionCacheKey ) {
      FileCache.cacheFile( req.inat.visionCacheKey, JSON.stringify( updatedCounts ) );
    }
    // if there were taxa added to the counts to replace inactive taxa,
    // their ancestries need to be cached for fast common ancestor lookups.
    // Lookup only the taxa that haven't aleady been cached
    await ComputervisionController.cacheAllTaxonAncestries( );
    const newIDsToCache = _.filter( newTaxonIDs,
      taxonID => _.isEmpty( TFServingTaxonAncestries[taxonID] ) );
    await ComputervisionController.cacheTaxonAncestries( newIDsToCache );
    return updatedCounts;
  }

  static async scoreImageUpload( uploadPath, req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const imageScores = await ComputervisionController.scoreImagePath( uploadPath, req );
    let scores = _.filter( imageScores, s => ( s.count > 0 ) );
    if ( parseInt( req.body.taxon_id, 0 ) > 0 ) {
      await ComputervisionController.cacheAllTaxonAncestries( );
      if ( !TFServingTaxonDescendants[req.body.taxon_id] ) {
        return InaturalistAPI.basicResponse( req );
      }
      scores = _.filter( scores, s => TFServingTaxonDescendants[req.body.taxon_id][s.taxon_id] );
    }
    if ( _.isEmpty( scores ) ) {
      return InaturalistAPI.basicResponse( req );
    }
    scores = _.sortBy( scores, "count" ).reverse( );
    ComputervisionController.normalizeScores( scores );
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
    return ComputervisionController.scoreImageAfterFrequencies( req,
      scores, nearbyTaxa, commonAncestor );
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
      const sumScoresResultsToUse = _.reduce( resultsToUse,
        ( sum, r ) => ( sum + r.count ), 0 );
      _.each( resultsToUse, r => {
        const score = ( r.count / sumScoresResultsToUse );
        // default score for non-model nearby taxa is the frequency score
        taxonScores[r.taxon.id] = score * 0.75;
      } );
      if ( !_.isEmpty( redisClient )
        && ( req.body.redis_frequencies === "true" || config.imageProcesing.frequencyBackend === "redis" ) ) {
        _.each( rawVisionScores, r => {
          visionScores[r.taxon_id] = r.count;
          if ( taxonScores[r.taxon_id] ) {
            // vision results with relevant frequency scores get a boost
            taxonScores[r.taxon_id] = r.count * ( 3 + ( ( taxonScores[r.taxon_id] / 0.75 ) * 6 ) );
          } else {
            // everything else uses the raw vision score
            taxonScores[r.taxon_id] = r.count;
          }
        } );
        topScores = _.map( taxonScores, ( v, k ) => (
          {
            taxon_id: k,
            count: req.body.frequency_only_remove === "true" ? ( visionScores[k] || 0 ) : v,
            frequency_score: ( frequencyScores[k] || 0 ),
            vision_score: ( visionScores[k] || 0 )
          }
        ) );
      } else {
        _.each( rawVisionScores, r => {
          visionScores[r.taxon_id] = r.count;
          // the ( ... || 1 ) prevents dividing by 0
          taxonScores[r.taxon_id] = taxonScores[r.taxon_id]
            ? taxonScores[r.taxon_id] * ( r.count / 100 )
            : ( r.count / 100 ) * ( 1 / ( ( ancestorNearbyTaxaResults.length || 1 ) * 100 ) );
        } );
        topScores = _.map( taxonScores, ( v, k ) => {
          const baseVisScore = visionScores[k] ? v : v * ( 1 / rawVisionScores.length );
          return {
            taxon_id: k,
            count: req.body.frequency_only_remove === "true"
              ? ( visionScores[k] || 0 )
              : baseVisScore,
            frequency_score: ( frequencyScores[k] || 0 ) * 100,
            vision_score: ( visionScores[k] || 0 )
          };
        } );
      }
      if ( req.body.must_be_in_frequency === "true" || req.body.frequency_only_remove === "true" ) {
        topScores = _.filter( topScores, s => frequencyScores[s.taxon_id] );
      }
      if ( req.body.must_be_in_vision === "true" ) {
        topScores = _.filter( topScores, s => s.vision_score > 0 );
      }
      topScores = _.sortBy( topScores, s => s.count ).reverse( );
      ComputervisionController.normalizeScores( topScores );
      return ComputervisionController.scoreImageResponse(
        req, commonAncestor, topScores.slice( 0, req.query.per_page )
      );
    }
    const top10 = rawVisionScores.slice( 0, req.query.per_page );
    _.each( top10, s => { s.vision_score = s.count; } );
    return ComputervisionController.scoreImageResponse( req, commonAncestor, top10 );
  }

  static async scoreImageResponse( req, commonAncestor, top10 ) {
    if ( req.inat.visionStats ) {
      return { results: top10, common_ancestor: commonAncestor };
    }
    req.inat.taxonPhotos = true;
    req.inat.taxonAncestries = true;
    const response = await TaxaController.speciesCountsResponse( req, top10, { } );
    _.each( response.results, r => {
      r.combined_score = r.count;
      delete r.count;
    } );
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
    const options = { localeOpts };
    commonAncestor.taxon.prepareForResponse( localeOpts, options );
    response.common_ancestor = commonAncestor;
    return response;
  }

  static async commonAncestor( req, scores ) {
    if ( req.body.skip_frequencies === "true" ) {
      return null;
    }
    const topScores = _.cloneDeep( scores )
      .slice( 0, req.body.ancestor_window || DEFAULT_ANCESTOR_WINDOW );
    const speciesCountsReq = {
      query: Object.assign( { }, req.query, { per_page: topScores.length } ),
      inat: Object.assign( { }, req.inat, {
        taxonPhotos: true,
        taxonAncestries: true
      } )
    };
    ComputervisionController.normalizeScores( topScores );
    const results = await ComputervisionController.addTaxa( speciesCountsReq, topScores );
    _.each( results, r => {
      r.vision_score = r.count;
      delete r.count;
    } );
    const commonAncestor = ComputervisionController.commonAncestorByScore(
      results, req.body.ancestor_threshold || DEFAULT_ANCESTOR_THRESHOLD
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
    if ( !speciesCountsReq.inat.visionCacheKey ) {
      const { results } = await TaxaController.speciesCountsResponse( speciesCountsReq,
        _.cloneDeep( scores ) );
      return results;
    }
    const scoresWithCachedTaxa = [];
    const scoresToLookup = [];
    // determine which are cached and which need to be looked up
    _.each( _.cloneDeep( scores ), score => {
      const taxonCacheKey = `taxon_${score.taxon_id}`;
      const cachedTaxon = FileCache.cacheExists( taxonCacheKey );
      if ( !_.isEmpty( cachedTaxon ) ) {
        const withTaxon = Object.assign( { }, score, { taxon: JSON.parse( cachedTaxon ) } );
        delete withTaxon.taxon_id;
        scoresWithCachedTaxa.push( withTaxon );
      } else {
        scoresToLookup.push( score );
      }
    } );
    // if everything is cached, return the sorted cached taxa
    if ( scoresToLookup.length === 0 ) {
      return _.sortBy( scoresWithCachedTaxa, "count" ).reverse( );
    }
    // lookup the remaining and merge them with the cached taxa
    const { results } = await TaxaController.speciesCountsResponse( speciesCountsReq,
      scoresToLookup );
    _.each( results, r => {
      const taxonCacheKey = `taxon_${r.taxon.id}`;
      FileCache.cacheFile( taxonCacheKey, JSON.stringify( r.taxon ) );
    } );
    const combinedResults = scoresWithCachedTaxa.concat( results );
    return _.sortBy( combinedResults, "count" ).reverse( );
  }


  static commonAncestorByScore( results, threshold ) {
    const roots = { };
    const children = { };
    const ancestorCounts = { };
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
          ancestorCounts[t.id] = ancestorCounts[t.id] || 0;
          ancestorCounts[t.id] += r.vision_score;
          lastTaxon = t;
        } );
      }
    } );
    const commonAncestor = ComputervisionController.commonAncestorByScoreSub(
      null, roots, children, ancestorCounts, threshold
    );
    if ( !commonAncestor ) { return null; }
    return {
      taxon: commonAncestor,
      score: ancestorCounts[commonAncestor.id]
    };
  }

  static commonAncestorByScoreSub( taxon, roots, children, ancestorCounts, threshold ) {
    if ( taxon && taxon.rank === "genus" ) { return taxon; }
    let commonAncestor = taxon;
    const iterationTaxa = taxon ? children[taxon.id] : roots;
    const sorted = _.sortBy( iterationTaxa, t => ( ancestorCounts[t.id] ) ).reverse( );
    _.each( sorted, ( t, index ) => {
      if ( !taxon && index !== 0 ) { return; }
      if ( ancestorCounts[t.id] < threshold ) { return; }
      commonAncestor = ComputervisionController.commonAncestorByScoreSub(
        t, roots, children, ancestorCounts, threshold
      );
    } );
    return commonAncestor;
  }

  // this is not being used right now
  static async nearbyTaxonFrequenciesDB( req, scores, commonAncestor ) {
    if ( !scores || !req.body.lat || !req.body.lng || req.body.skip_frequencies === "true" ) {
      return null;
    }
    const taxonIDs = _.map( scores, "taxon_id" );
    let swlat = Math.floor( req.body.lat - 0.5 );
    let swlng = Math.floor( req.body.lng - 0.5 );
    if ( swlat < -90 ) { swlat = -90; }
    if ( swlng < -180 ) { swlng = -180; }
    if ( swlat > 88 ) { swlat = 88; }
    if ( swlng > 178 ) { swlng = 178; }
    let subquery = squel.select( )
      .field( "fct.taxon_id, fct.count" )
      .from( "frequency_cells fc" )
      .join( "frequency_cell_month_taxa fct", null, "fc.id = fct.frequency_cell_id" )
      .join( "taxa t", null, "fct.taxon_id = t.id" )
      .where( "fc.swlat BETWEEN ? AND ?", swlat, swlat + 2 )
      .where( "fc.swlng BETWEEN ? AND ?", swlng, swlng + 2 );
    if ( commonAncestor ) {
      subquery = subquery.where(
        "fct.taxon_id IN ? OR t.ancestry LIKE '%/?/%' OR t.ancestry LIKE '%/?'",
        taxonIDs, commonAncestor.taxon.id, commonAncestor.taxon.id
      );
    } else {
      subquery = subquery.where( "fct.taxon_id IN ?", taxonIDs );
    }
    if ( req.body.observed_on ) {
      const months = util.dateParamMonthRange( req.body.observed_on );
      if ( months ) {
        subquery = subquery.where( "fct.month IN ?", months );
      }
    }
    const query = squel.select( )
      .field( "taxon_id, count, ancestry" )
      .from( `(${subquery.toString( )}) as subq` )
      .join( "taxa t on (taxon_id=t.id)" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const taxaCounts = { };
    _.each( rows, r => {
      taxaCounts[r.taxon_id] = taxaCounts[r.taxon_id] || { ancestry: r.ancestry, count: 0 };
      taxaCounts[r.taxon_id].count += Number( r.count );
    } );
    return {
      results: _.map( taxaCounts, ( data, taxonID ) => ( {
        taxon_id: taxonID,
        count: data.count,
        taxon: {
          id: taxonID,
          ancestor_ids: _.map( data.ancestry.split( "/" ), a => Number( a ) )
        }
      } ) )
    };
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

  static normalizeScores( scores, multiplier = 100 ) {
    const sumScores = _.sum( _.map( scores, "count" ) );
    _.each( scores, r => {
      r.count = ( ( r.count * multiplier ) / sumScores );
    } );
  }

  static async modelContainsTaxonID( taxonID ) {
    return !!TFServingTaxonAncestries[taxonID];
  }
};

module.exports = ComputervisionController;
