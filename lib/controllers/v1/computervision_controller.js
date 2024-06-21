const _ = require( "lodash" );
const fs = require( "fs" );
const fetch = require( "node-fetch" );
const FormData = require( "form-data" );
const path = require( "path" );
const squel = require( "safe-squel" );
const md5 = require( "md5" );
const PromisePool = require( "es6-promise-pool" );
const csv = require( "fast-csv" );
const pgClient = require( "../../pg_client" );
const TaxaController = require( "./taxa_controller" );
const InaturalistAPI = require( "../../inaturalist_api" );
const config = require( "../../../config" );
const util = require( "../../util" );
const ESModel = require( "../../models/es_model" );
const Taxon = require( "../../models/taxon" );
const Observation = require( "../../models/observation" );
const ObservationPreload = require( "../../models/observation_preload" );

// number of image results checked for common ancestor
const DEFAULT_ANCESTOR_WINDOW = 10;
// common ancestor score threshold
const DEFAULT_ANCESTOR_THRESHOLD = 80;
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
    const { rows } = await pgClient.replica.query( query.toString( ) );
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
    return new Promise( resolve => {
      if ( !( config.imageProcesing && config.imageProcesing.taxonomyPath
           && fs.existsSync( config.imageProcesing.taxonomyPath ) ) ) {
        resolve( );
        return;
      }
      if ( !_.isEmpty( TFServingTaxonAncestries ) ) {
        resolve( );
        return;
      }
      const taxonIDs = [];
      const stream = fs.createReadStream( config.imageProcesing.taxonomyPath );
      csv.parseStream( stream, { headers: true } )
        .on( "data", row => {
          if ( row.leaf_class_id ) {
            taxonIDs.push( Number( row.taxon_id ) );
          }
        } ).on( "end", ( ) => {
          const idChunks = _.chunk( taxonIDs, 500 );
          const promiseProducer = ( ) => {
            const chunk = idChunks.shift( );
            if ( !chunk ) {
              return null;
            }
            return ComputervisionController.cacheTaxonAncestries( chunk );
          };
          const pool = new PromisePool( promiseProducer, 3 );
          pool.start( ).then( resolve );
        } );
    } );
  }

  static async scoreObservation( req ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    const obsID = Number( req.params.id );
    if ( !obsID ) {
      throw util.httpError( 422, "Missing observation ID or UUID" );
    }
    const obsObject = [{
      observation_id: obsID
    }];
    const obsOpts = {
      source: {
        includes: ["id", "taxon", "location"]
      }
    };
    await ESModel.fetchBelongsTo( obsObject, Observation, obsOpts );
    const { observation } = obsObject[0];
    if ( !observation ) {
      throw util.httpError( 422, "Unknown observation" );
    }

    await ObservationPreload.observationPhotos( [observation] );
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
    const photoURL = req.query.image_url || req.body.image_url;
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
    delete scoreImageReq.body.image_url;
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
    if ( req.userSession?.isAdmin && req.body.image_url ) {
      return ComputervisionController.scoreImageURL( req );
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
    const formData = new FormData();
    formData.append( "image", fs.createReadStream( uploadPath ), {
      type: req.file.mimetype,
      knownLength: fs.statSync( uploadPath ).size
    } );
    formData.append( "geomodel", "true" );
    if ( req.body.delegate_ca || req.query.delegate_ca
      || config.imageProcesing.delegateCommonAncestor ) {
      if ( req.body.taxon_id ) {
        formData.append( "taxon_id", req.body.taxon_id );
      }
      if ( req.body.aggregated || req.query.aggregated ) {
        formData.append( "aggregated", "true" );
      }
      formData.append( "format", "object" );
    }
    if ( !req.body.skip_frequencies && req.body.lat && req.body.lng ) {
      formData.append( "lat", req.body.lat );
      formData.append( "lng", req.body.lng );
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
    return json;
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

  static async delegatedScoresProcessing( req, visionApiResponse ) {
    const localeOpts = util.localeOpts( req );
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      source: { excludes: ["photos", "place_ids"] }
    };

    // if there were taxa added to the counts to replace inactive taxa,
    // their ancestries need to be cached for fast common ancestor lookups.
    // Lookup only the taxa that haven't aleady been cached
    await ComputervisionController.cacheAllTaxonAncestries( );
    const allResultTaxonIDs = _.map( visionApiResponse.results, "id" );
    const newIDsToCache = _.compact( _.filter( allResultTaxonIDs,
      taxonID => _.isEmpty( TFServingTaxonAncestries[taxonID] ) ) );
    await ComputervisionController.cacheTaxonAncestries( newIDsToCache );

    const response = {
      total_results: _.size( visionApiResponse.results ),
      page: 1,
      per_page: _.size( visionApiResponse.results ),
      results: _.reverse( _.sortBy( visionApiResponse.results, "combined_score" ) )
    };
    if ( visionApiResponse.common_ancestor ) {
      response.common_ancestor = visionApiResponse.common_ancestor;
    }

    const withTaxa = _.filter(
      _.flattenDeep( [response.common_ancestor, response.results] )
    );
    _.each( withTaxa, s => {
      s.frequency_score = s.geo_score >= s.geo_threshold ? 1 : 0;
      s.taxon_id = s.id;
      delete s.id;
      if ( !( req.body.aggregated || req.query.aggregated ) ) {
        s.original_geo_score = s.geo_score;
        s.original_combined_score = s.combined_score;
        delete s.geo_threshold;
        delete s.name;
        delete s.geo_score;
      }
    } );

    await ESModel.fetchBelongsTo( withTaxa, Taxon, taxonOpts );
    await Taxon.preloadIntoTaxonPhotos( _.map( withTaxa, "taxon" ), { localeOpts } );
    if ( !( req.body.aggregated || req.query.aggregated ) ) {
      _.each( withTaxa, s => {
        delete s.taxon_id;
      } );
    }

    // remove attributes of common_ancestor that should not be in the response
    if ( response.common_ancestor ) {
      response.common_ancestor.score = response.common_ancestor.combined_score;
      response.common_ancestor = _.omit( response.common_ancestor, [
        "combined_score",
        "vision_score",
        "frequency_score",
        "original_geo_score",
        "original_combined_score"
      ] );
    }

    return response;
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

    if ( req.query.test_feature !== "frequency_nearby" ) {
      _.each( scores, s => {
        s.frequency_score = s.original_geo_score >= s.geo_threshold ? 1 : 0;
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
        const scoredTaxonIsNearby = _.includes( nearbyTaxonIDs, s.taxon_id );
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
    if ( req.body.delegate_ca || req.query.delegate_ca
      || config.imageProcesing.delegateCommonAncestor ) {
      return ComputervisionController.delegatedScoresProcessing( req, imageScores );
    }

    const scores = _.map( imageScores, score => ( {
      taxon_id: Number( score.id ),
      vision_score: score.vision_score,
      combined_score: score.combined_score,
      original_geo_score: score.geo_score,
      original_combined_score: score.combined_score,
      geo_threshold: score.geo_threshold
    } ) );
    const numericalCompareProperty = "combined_score";

    // replace inactive taxa with their active counterparts, remove remaining inactive
    const r = await TaxaController.replaceInactiveTaxa( scores, {
      removeInactive: true,
      numericalCompareProperty
    } );
    const { updatedObjects: activeTaxonScores, newTaxonIDs } = r;

    // if there were taxa added to the counts to replace inactive taxa,
    // their ancestries need to be cached for fast common ancestor lookups.
    // Lookup only the taxa that haven't aleady been cached
    await ComputervisionController.cacheAllTaxonAncestries( );
    const allResultTaxonIDs = _.map( activeTaxonScores, "taxon_id" ).concat( newTaxonIDs );
    const newIDsToCache = _.compact( _.filter( allResultTaxonIDs,
      taxonID => _.isEmpty( TFServingTaxonAncestries[taxonID] ) ) );
    await ComputervisionController.cacheTaxonAncestries( newIDsToCache );

    const filteredScores = await ComputervisionController.filterScoresByTaxon(
      req, activeTaxonScores
    );
    if ( _.isEmpty( filteredScores ) ) {
      return InaturalistAPI.basicResponse( req );
    }
    return ComputervisionController.combinedModelScoresProcessing( req, filteredScores );
  }

  static async scoreImageResponse( req, commonAncestor, topScores ) {
    req.inat.taxonPhotos = true;
    req.inat.taxonAncestries = true;
    const response = await TaxaController.speciesCountsResponse( req, topScores, {
      numericalCompareProperty: "combined_score"
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
    commonAncestor.taxon.prepareForResponse( localeOpts, { localeOpts } );
    await TaxaController.assignPlaces( [commonAncestor.taxon] );
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

  static async taxonH3Cells( req ) {
    const taxonID = Number( req.params.id );
    if ( !taxonID ) {
      throw util.httpError( 422, "Missing taxon ID" );
    }

    const requestAbortController = new AbortController( );
    const requestTimeout = setTimeout( ( ) => {
      requestAbortController.abort( );
    }, 5000 );
    let json;
    try {
      const response = await fetch( `${config.imageProcesing.tensorappURL}/h3_04?taxon_id=${taxonID}`, {
        signal: requestAbortController.signal
      } );
      if ( !response.ok ) {
        throw util.httpError( 500, "Error" );
      }
      json = await response.json( );
    } catch ( error ) {
      throw util.httpError( 500, "Error" );
    } finally {
      clearTimeout( requestTimeout );
    }
    return json;
  }

  static async taxonGeomodelBounds( req ) {
    const taxonID = Number( req.params.id );
    if ( !taxonID ) {
      throw util.httpError( 422, "Missing taxon ID" );
    }

    const requestAbortController = new AbortController( );
    const requestTimeout = setTimeout( ( ) => {
      requestAbortController.abort( );
    }, 5000 );
    let json;
    try {
      const response = await fetch( `${config.imageProcesing.tensorappURL}/h3_04_bounds?taxon_id=${taxonID}`, {
        signal: requestAbortController.signal
      } );
      if ( !response.ok ) {
        throw util.httpError( 500, "Error" );
      }
      json = await response.json( );
    } catch ( error ) {
      throw util.httpError( 500, "Error" );
    } finally {
      clearTimeout( requestTimeout );
    }
    return { total_bounds: json };
  }

  static async languageSearch( req ) {
    if ( !req.userSession || !req.userSession.isAdmin ) {
      throw util.httpError( 401, "Unauthorized" );
    }

    if ( _.isEmpty( req.query.q ) ) {
      throw util.httpError( 422, "Missing required parameter `q`" );
    }
    const { page, perPage } = InaturalistAPI.paginationData( req, { default: 30, max: 100 } );
    const languageSearchParams = {
      query: req.query.q,
      page,
      per_page: perPage
    };
    if ( req.query.taxon_id ) {
      languageSearchParams.taxon_id = req.query.taxon_id;
    }
    const urlParams = new URLSearchParams( languageSearchParams );

    const requestAbortController = new AbortController( );
    const requestTimeout = setTimeout( ( ) => {
      requestAbortController.abort( );
    }, 60000 );
    let json;
    try {
      const response = await fetch( `${config.imageProcesing.inatnlsURL}/?${urlParams.toString( )}`, {
        method: "POST",
        signal: requestAbortController.signal
      } );
      if ( !response.ok ) {
        throw util.httpError( 500, "Langauge search failed" );
      }
      json = await response.json( );
    } catch ( error ) {
      throw util.httpError( 500, "Langauge search failed" );
    } finally {
      clearTimeout( requestTimeout );
    }

    const photos = _.keyBy( json.results, "photo_id" );
    const photosQuery = squel
      .select( )
      .field( "op.photo_id, op.observation_id" )
      .from( "observation_photos op" )
      .where( "op.photo_id IN ?", _.keys( photos ) );
    const { rows } = await pgClient.replica.query( photosQuery.toString( ) );
    const resultsObject = { };
    _.each( _.reverse( _.sortBy( rows, "observation_id" ) ), row => {
      if ( _.has( resultsObject, row.photo_id ) ) {
        return;
      }
      resultsObject[row.photo_id] = {
        observation_id: row.observation_id,
        photo_id: row.photo_id,
        score: photos[row.photo_id].score
      };
    } );
    const results = _.values( resultsObject );
    const localeOpts = util.localeOpts( req );
    await Observation.preloadInto( req, results, localeOpts );
    _.each( results, r => {
      delete r.observation_id;
    } );

    const response = {
      total_results: _.size( results ),
      page: Number( req.query.page ) || 1,
      per_page: _.size( results ),
      results: _.reverse( _.sortBy( results, "score" ) )
    };
    return response;
  }
};

module.exports = ComputervisionController;
