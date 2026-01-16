const { readFile } = require( "node:fs/promises" );
const _ = require( "lodash" );
const fs = require( "fs" );
const path = require( "path" );
const squel = require( "safe-squel" );
const csv = require( "fast-csv" );
const crypto = require( "crypto" );
const pgClient = require( "../../pg_client" );
const esClient = require( "../../es_client" );
const TaxaController = require( "./taxa_controller" );
const InaturalistAPI = require( "../../inaturalist_api" );
const config = require( "../../../config" );
const util = require( "../../util" );
const ESModel = require( "../../models/es_model" );
const Taxon = require( "../../models/taxon" );
const Observation = require( "../../models/observation" );
const ObservationPreload = require( "../../models/observation_preload" );

const ModelTaxonIDs = { };

const ComputervisionController = class ComputervisionController {
  static async cacheTaxonAncestries( taxonIDs ) {
    if ( _.isEmpty( taxonIDs ) ) {
      return;
    }
    _.each( taxonIDs, taxonID => {
      ModelTaxonIDs[taxonID] = true;
    } );
  }

  static async cacheAllTaxonAncestries( ) {
    return new Promise( resolve => {
      if ( !( config.imageProcesing && config.imageProcesing.taxonomyPath
           && fs.existsSync( config.imageProcesing.taxonomyPath ) ) ) {
        resolve( );
        return;
      }
      if ( !_.isEmpty( ModelTaxonIDs ) ) {
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
          ComputervisionController.cacheTaxonAncestries( taxonIDs );
          resolve( );
        } );
    } );
  }

  static async scoreObservation( req ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    if ( req.query.photo_id && Number.isNaN( req.query.photo_id ) ) {
      throw util.httpError( 422, "photo_id is not a number" );
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
      if ( req.query.photo_id && p.id !== Number( req.query.photo_id ) ) { return; }
      if ( !p.url ) { return; }
      photoURL = p.url;
      if ( photoURL.match( /\/square\./i ) ) {
        photoURL = p.url.replace( "/square.", "/medium." );
      }
    } );
    if ( !photoURL && !req.query.photo_id ) {
      throw util.httpError( 422, "Observation has no scorable photos" );
    } else if ( !photoURL ) {
      throw util.httpError( 422, "Observation has no scorable photos or no photo with the provided id" );
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
    const md5PhotoURL = crypto
      .createHash( "md5" )
      .update( photoURL, "utf8" )
      .digest( "hex" );
    const tmpFilename = `${md5PhotoURL}${parsedPhotoURL.ext.replace( /\?.+/, "" )}`;
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

  static async scoreImageUpload( uploadPath, req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const imageScores = await ComputervisionController.scoreImagePath( uploadPath, req );
    return ComputervisionController.delegatedScoresProcessing( req, imageScores );
  }

  static async scoreImagePath( uploadPath, req ) {
    const formData = new FormData();
    formData.append( "image", new Blob( [await readFile( uploadPath )] ), {
      type: req.file.mimetype
    } );
    formData.append( "geomodel", "true" );
    formData.append( "format", "object" );
    if ( req.body.taxon_id ) {
      formData.append( "taxon_id", req.body.taxon_id );
    }
    if ( req.body.aggregated || req.query.aggregated ) {
      formData.append( "aggregated", "true" );
    }
    const testFeature = req.body.test_feature || req.query.test_feature;
    if ( testFeature === "ancestor_unrestricted" ) {
      formData.append( "common_ancestor_rank_type", "unrestricted" );
    } else if ( testFeature === "ancestor_major_ranks" ) {
      formData.append( "common_ancestor_rank_type", "major" );
    }
    if ( !req.body.skip_frequencies && req.body.lat && req.body.lng ) {
      formData.append( "lat", req.body.lat );
      formData.append( "lng", req.body.lng );
    }

    if ( req.body.include_representative_photos
      || req.query.include_representative_photos
    ) {
      formData.append( "return_embedding", "true" );
    }

    if ( req.body.human_exclusion
      || req.query.human_exclusion
    ) {
      formData.append( "human_exclusion", req.body.human_exclusion || req.query.human_exclusion );
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

  static async addRepresentativePhotos( results, embedding ) {
    if ( _.isEmpty( embedding ) ) {
      return;
    }
    // look up results with rank_level < 30 that are not human or an ancestor of human
    const resultsToLookup = _.filter( results, result => (
      result?.taxon?.rank_level < 30 && !(
        Taxon.homoSapiens && (
          result?.taxon?.id === Taxon.homoSapiens.id
            || _.includes( Taxon.homoSapiens.ancestor_ids, result?.taxon?.id )
        )
      )
    ) );
    if ( _.isEmpty( resultsToLookup ) ) {
      return;
    }

    const embeddingsResponse = await esClient.search( "taxon_photos", {
      body: {
        knn: {
          field: "embedding",
          query_vector: embedding,
          k: 100,
          num_candidates: 100,
          filter: {
            terms: {
              ancestor_ids: _.map( resultsToLookup, result => result.taxon.id )
            }
          }
        },
        size: 100,
        _source: [
          "id",
          "taxon_id",
          "photo_id",
          "ancestor_ids"
        ]
      }
    } );
    const embeddingsHits = _.map( embeddingsResponse.hits.hits, "_source" );
    const representativeTaxonPhotos = [];
    _.each( results, result => {
      if ( result && result.taxon && result.taxon.default_photo ) {
        const firstMatch = _.find( embeddingsHits, h => (
          h?.photo_id && _.includes( h.ancestor_ids, result.taxon.id )
        ) );
        if ( !firstMatch ) {
          return;
        }
        representativeTaxonPhotos.push( {
          taxon: result.taxon,
          photo_id: firstMatch.photo_id
        } );
      }
    } );

    await ObservationPreload.assignObservationPhotoPhotos( representativeTaxonPhotos );
    _.each( representativeTaxonPhotos, taxonPhoto => {
      if ( taxonPhoto?.photo?.url ) {
        taxonPhoto.photo.square_url = taxonPhoto.photo.url;
        taxonPhoto.photo.medium_url = taxonPhoto.photo.url.replace( "/square.", "/medium." );
        taxonPhoto.taxon.representative_photo = taxonPhoto.photo;
      }
    } );
  }

  static async delegatedScoresProcessing( req, visionApiResponse ) {
    const localeOpts = util.localeOpts( req );
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    const taxonOpts = {
      modifier: prepareTaxon,
      source: {
        excludes: [
          "photos", "place_ids", "listed_taxa.user_id", "listed_taxa.occurrence_status_level"
        ]
      }
    };

    // if there were taxa added to the counts to replace inactive taxa,
    // their ancestries need to be cached for fast common ancestor lookups.
    // Lookup only the taxa that haven't aleady been cached
    await ComputervisionController.cacheAllTaxonAncestries( );
    const allResultTaxonIDs = _.map( visionApiResponse.results, "id" );
    const newIDsToCache = _.compact( _.filter( allResultTaxonIDs,
      taxonID => _.isEmpty( ModelTaxonIDs[taxonID] ) ) );
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

    if ( visionApiResponse.human_exclusion_cleared_results ) {
      req.inat.requestContext = "human_exclusion_cleared_results";
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
    await Taxon.preloadIntoTaxonPhotos( _.map( _.filter( withTaxa, "taxon" ), "taxon" ), { localeOpts } );

    if ( !( req.body.aggregated || req.query.aggregated ) ) {
      _.each( withTaxa, s => {
        delete s.taxon_id;
      } );
    }

    if ( req.body.include_representative_photos
      || req.query.include_representative_photos
    ) {
      await ComputervisionController.addRepresentativePhotos(
        withTaxa,
        visionApiResponse.embedding
      );
    }

    // remove attributes of common_ancestor that should not be in the response
    if ( response.common_ancestor ) {
      await TaxaController.assignPlaces( [response.common_ancestor.taxon] );
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

  static modelContainsTaxonID( taxonID ) {
    return !!ModelTaxonIDs[taxonID];
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
    await Observation.preloadInto( req, results, { ...localeOpts, minimal: true } );
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
