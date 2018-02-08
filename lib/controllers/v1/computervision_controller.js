"use strict";
var _ = require( "lodash" ),
    fs = require( "fs" ),
    request = require( "request" ),
    path  = require( "path" ),
    moment = require( "moment" ),
    squel = require( "squel" ),
    md5 = require( "md5" ),
    pgClient = require( "../../pg_client" ),
    ObservationsController = require( "./observations_controller" ),
    TaxaController = require( "./taxa_controller" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    config = require( "../../../config" ),
    FileCache = require( "../../vision/file_cache" );

// number of image results checked for common ancestor
const DEFAULT_ANCESTOR_WINDOW = 15;
// common ancestor score threshold
const DEFAULT_ANCESTOR_THRESHOLD = 92;
// common ancestor can be no higher than order
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 40;

let TFServingTaxonDescendants = { };
let TFServingTaxonAncestries = { };
if ( config.imageProcesing && config.imageProcesing.taxaFilePath &&
     fs.existsSync( config.imageProcesing.taxaFilePath ) ) {
  var TFServingTaxonIDs = fs.readFileSync( config.imageProcesing.taxaFilePath ).
    toString( ).split( "\n" ).map( l => {
      const parts = l.split( ":" );
      return parts[1] ? Number( parts[1].trim( ) ) : 0;
    } );
  setTimeout( ( ) => {
    const idChunks = _.chunk( TFServingTaxonIDs, 500 );
    _.each( idChunks, taxonIDs => {
      cacheTaxonAncestries( taxonIDs );
    });
  }, 2000 );
}

const cacheTaxonAncestries = ( taxonIDs, callback ) => {
  if ( _.isEmpty( taxonIDs ) ) {
    return callback ? callback( null ) : undefined;
  }
  var query = squel.select( ).field( "id, ancestry" ).from( "taxa" ).
    where( "id IN ?", taxonIDs );
  pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) {
        return callback ? callback( err ) : undefined;
      }
      _.each( result.rows, row => {
        const taxonID = row.id;
        if ( !row.ancestry ) { return; }
        const ancestors = row.ancestry.split( "/" );
        TFServingTaxonAncestries[taxonID] = ancestors;
        TFServingTaxonDescendants[taxonID] = TFServingTaxonDescendants[taxonID] || {};
        TFServingTaxonDescendants[taxonID][taxonID] = true;
        _.each( ancestors, ancestorID => {
          TFServingTaxonDescendants[ancestorID] = TFServingTaxonDescendants[ancestorID] || {};
          TFServingTaxonDescendants[ancestorID][taxonID] = true;
        });
      });
      if ( callback ) { callback( null ); }
    }
  );
}


var ComputervisionController = class ComputervisionController {

  static scoreObservation( req, callback ) {
    if( !req.userSession && !req.applicationSession ) {
      return callback({ error: "Unauthorized", status: 401 });
    }
    const obsID = Number( req.params.id );
    if ( !obsID ) {
      return callback( { messsage: "ID missing", status: 422 } );
    }
    const searchReq = { query: { id: obsID } };
    // fetch the obs metadata
    ObservationsController.search( searchReq, ( err, response ) => {
      if ( err ) { return callback( err ); }
      if ( !response || _.isEmpty( response.results ) ) {
        return callback( { message: "Unknown observation" } );
      }
      const observation = response.results[0];
      let photoURL;
      _.each( observation.photos, p => {
        if ( photoURL ) { return; }
        if ( !p.url ) { return; }
        photoURL = p.url;
        if ( photoURL.match( /static\.inaturalist.*\/square\./i ) ) {
          photoURL = p.url.replace( "/square.", "/medium." );
        }
      });
      if ( !photoURL ) { return callback( { message: "Observation has no scorable photos" } ); }
      req.query.image_url = photoURL;
      ComputervisionController.scoreImageURL( req, { observation }, callback );
    });
  }

  static scoreImageURL( req, options, callback ) {
    options = options || {};
    if( !req.userSession && !req.applicationSession ) {
      return callback({ error: "Unauthorized", status: 401 });
    }
    const photoURL = req.query.image_url;
    if ( !photoURL ) {
      return callback( { message: "No scorable photo", status: 422 } );
    }
    // download the JPG
    const parsedPhotoURL = path.parse( photoURL );
    const tmpFilename = `${md5( photoURL )}${parsedPhotoURL.ext.replace(/\?.+/, "")}`;
    const tmpPath = path.resolve( global.config.imageProcesing.uploadsDir, tmpFilename );
    request( photoURL ).pipe( fs.createWriteStream( tmpPath ) ).on( "close", ( ) => {
      let scoreImageReq = Object.assign( req, {
        file: {
          filename: tmpFilename,
          mimetype: "image/jpeg"
        }
      });
      if ( !scoreImageReq.body ) { scoreImageReq.body = { }; }
      scoreImageReq.body.lat = scoreImageReq.body.lat || req.query.lat;
      scoreImageReq.body.lng = scoreImageReq.body.lng || req.query.lng;
      scoreImageReq.body.radius = scoreImageReq.body.radius || req.query.radius;
      scoreImageReq.body.taxon_id = scoreImageReq.body.taxon_id || req.query.taxon_id;
      if ( options.observation && !scoreImageReq.body.lat && options.observation.location ) {
        const latLng = options.observation.location.split( "," );
        scoreImageReq.body.lat = latLng[0];
        scoreImageReq.body.lng = latLng[1];
      }
      if ( options.observation && !scoreImageReq.body.observed_on && options.observation.observed_on ) {
        scoreImageReq.body.observed_on = options.observation.observed_on;
      }
      if ( options.observation && !scoreImageReq.body.taxon_id &&
           options.observation.taxon && options.observation.taxon.iconic_taxon_id ) {
        scoreImageReq.body.taxon_id = options.observation.taxon.iconic_taxon_id;
      }
      // score the downloaded JPG
      return ComputervisionController.scoreImage( scoreImageReq, callback );
    });
  }

  static scoreImage( req, callback ) {
    if( !req.userSession && !req.applicationSession ) {
      return callback({ error: "Unauthorized", status: 401 });
    }
    var uploadPath = path.resolve( global.config.imageProcesing.uploadsDir,
      req.file.filename );
    return ComputervisionController.scoreImageUpload( uploadPath, req, callback );
  }

  static scoreImagePath( uploadPath, req, callback ) {
    if ( req.inat && req.inat.visionCacheKey ) {
      const cachedScores = FileCache.cacheExists( uploadPath );
      if ( cachedScores ) {
        return callback( null, JSON.parse( cachedScores ) );
      }
    }
    var formData = { image: {
      value:  fs.createReadStream( uploadPath ),
      options: {
        filename: req.file.filename,
        contentType: req.file.mimetype
      }
    } };
    var options = {
      url: config.imageProcesing.tensorappURL,
      timeout: 5000,
      formData };
    request.post( options, ( err, httpResponse, body ) => {
      if ( err ) { return callback( err ); }
      let json;
      try {
        json = JSON.parse( body );
      } catch ( e ) {
        return callback({ error: "Error scoring image", status: 500 });
      }
      const counts = _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        count: score
      }));
      // replace inactive taxa with their active counterparts, remove remaining inactive
      TaxaController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, updatedCounts, newTaxonIDs ) => {
        if ( err ) { return callback( err ); }
        if ( req.inat && req.inat.visionCacheKey ) {
          FileCache.cacheFile( uploadPath, JSON.stringify( updatedCounts ) );
        }
        // if there were taxa added to the counts to replace inactive taxa,
        // their ancestries need to be cached for fast common ancestor lookups.
        // Lookup only the taxa that haven't aleady been cached
        const newIDsToCache = _.filter( newTaxonIDs, taxonID => _.isEmpty( TFServingTaxonAncestries[taxonID] ) );
        cacheTaxonAncestries( newIDsToCache, ( ) => {
          callback( null, updatedCounts );
        });
      });
    });
  }

  static scoreImageUpload( uploadPath, req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    ComputervisionController.scoreImagePath( uploadPath, req, ( err, scores ) => {
      if ( err ) { return callback( err ); }
      scores = _.filter( scores, s => ( s.count > 0 ) );
      if ( req.body.taxon_id ) {
        if ( !TFServingTaxonDescendants[req.body.taxon_id] ) {
          return InaturalistAPI.basicResponse( null, req, null, callback );
        }
        scores = _.filter( scores, s => {
          return TFServingTaxonDescendants[req.body.taxon_id][s.taxon_id];
        });
      }
      scores = _.sortBy( scores, "count" ).reverse( );
      ComputervisionController.normalizeScores( scores );
      ComputervisionController.commonAncestor( req, scores, ( err, commonAncestor ) => {
        if ( err ) { return callback( err ); }
        if ( commonAncestor ) {
          ComputervisionController.nearbyTaxonFrequencies( req, commonAncestor, ( err, nearbyTaxa ) => {
            if ( err ) { return callback( err ); }
            ComputervisionController.scoreImageAfterFrequencies(
              req, scores, nearbyTaxa, commonAncestor, callback );
          });
        } else {
          const top10 = scores.slice( 0, 10 );
          _.each( top10, s => { s.vision_score = s.count; } );
          ComputervisionController.scoreImageResponse( req, null, top10, callback );
        }
      } );
    });
  }

  static scoreImageAfterFrequencies( req, scores, nearbyTaxa, commonAncestor, callback ) {
    if ( nearbyTaxa && !_.isEmpty( nearbyTaxa.results ) ) {
      var sumScores = _.reduce( nearbyTaxa.results, ( sum, r ) => ( sum + r.count ), 0 );
      let frequencyScores = { };
      let visionScores = { };
      let taxonScores = { };
      _.each( nearbyTaxa.results, r => {
        const score = ( r.count / sumScores );
        taxonScores[ r.taxon.id ] = score;
        frequencyScores[ r.taxon.id ] = score;
      });
      _.each( scores, r => {
        visionScores[ r.taxon_id ] = r.count / 100;
        taxonScores[ r.taxon_id ] = taxonScores[ r.taxon_id ] ?
          taxonScores[ r.taxon_id ] * ( r.count / 100 ) :
          ( r.count / 100 ) * ( 1 / ( nearbyTaxa.results.length * 100 ) );
      });
      let topScores = _.map( taxonScores, ( v, k ) => {
        return {
          taxon_id: k,
          count: visionScores[ k ] ? v : v * ( 1 / scores.length ),
          frequency_score: ( frequencyScores[ k ] || 0 ) * 100,
          vision_score: ( visionScores[ k ] || 0 ) * 100
        }
      } );
      topScores = _.sortBy( topScores, s => s.count ).reverse( );
      ComputervisionController.normalizeScores( topScores );
      ComputervisionController.scoreImageResponse(
        req, commonAncestor, topScores.slice( 0, req.query.per_page ), callback );
    } else {
      const top10 = scores.slice( 0, req.query.per_page );
      _.each( top10, s => { s.vision_score = s.count; } );
      ComputervisionController.scoreImageResponse( req, commonAncestor, top10, callback );
    }
  }

  static scoreImageResponse( req, commonAncestor, top10, callback ) {
    if ( req.inat.visionStats ) {
      return callback( null, { results: top10, common_ancestor: commonAncestor } );
    }
    req.inat.taxonPhotos = true;
    req.inat.taxonAncestries = true;
    TaxaController.speciesCountsResponse( req, top10, { }, ( err, response ) => {
      if ( err ) { return callback( err ); }
      _.each( response.results, r => {
        r.combined_score = r.count;
        delete r.count;
      });
      response.common_ancestor = commonAncestor;
      callback( null, response );
    } );
  }

  static commonAncestor( req, scores, callback ) {
    if ( req.body.skip_frequencies === true ) {
      return callback( );
    }
    const topScores = scores.slice( 0, req.body.ancestor_window || DEFAULT_ANCESTOR_WINDOW );
    const speciesCountsReq = {
      query: Object.assign( { }, req.query, { per_page: topScores.length } ),
      inat: Object.assign( { }, req.inat, {
        taxonPhotos: true,
        taxonAncestries: true
      })
    };
    ComputervisionController.normalizeScores( topScores );
    ComputervisionController.addTaxa( speciesCountsReq, topScores, ( err, results ) => {
      if( err ) { return callback( err ); }
      _.each( results, r => {
        r.vision_score = r.count;
        delete r.count;
      });
      const commonAncestor = ComputervisionController.commonAncestorByScore(
        results, req.body.ancestor_threshold || DEFAULT_ANCESTOR_THRESHOLD );
      if ( commonAncestor && commonAncestor.taxon.rank_level <= (
        req.body.rank_level_cutoff || DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF ) ) {
        return callback( null, commonAncestor );
      }
      return callback( );
    });
  }

  // turn { count: C, taxon_id: TID }
  // into { count: C, taxon: T }
  static addTaxa( speciesCountsReq, scores, callback ) {
    if ( !speciesCountsReq.inat.visionCacheKey ) {
      TaxaController.speciesCountsResponse( speciesCountsReq, scores, { }, ( err, response ) => {
        if ( err ) { return callback( err ); }
        callback( null, response.results );
      });
      return;
    }
    const scoresWithCachedTaxa = [ ];
    const scoresToLookup = [ ];
    // determine which are cached and which need to be looked up
    _.each( scores, score => {
      const taxonCacheKey = `taxon_${score.taxon_id}`;
      const cachedTaxon = FileCache.cacheExists( taxonCacheKey );
      if ( !_.isEmpty( cachedTaxon ) ) {
        const withTaxon = Object.assign( { }, score, { taxon: JSON.parse( cachedTaxon ) } );
        delete withTaxon.taxon_id;
        scoresWithCachedTaxa.push( withTaxon );
      } else {
        scoresToLookup.push( score );
      }
    });
    // if everything is cached, return the sorted cached taxa
    if ( scoresToLookup.length === 0 ) {
      return callback( null, _.sortBy( scoresWithCachedTaxa, "count" ).reverse( ) );
    }
    // lookup the remaining and merge them with the cached taxa
    TaxaController.speciesCountsResponse( speciesCountsReq, scoresToLookup, { }, ( err, response ) => {
      if ( err ) { return callback( err ); }
      _.each( response.results, r => {
        const taxonCacheKey = `taxon_${r.taxon.id}`;
        FileCache.cacheFile( taxonCacheKey, JSON.stringify( r.taxon ) );
      });
      const combinedResults = scoresWithCachedTaxa.concat( response.results );
      callback( null, _.sortBy( combinedResults, "count" ).reverse( ) );
    });
  }


  static commonAncestorByScore( results, threshold ) {
    var roots = { };
    var children = { };
    var ancestorCounts = { };
    _.each( results, r => {
      var lastTaxon = null;
      if ( r.taxon.ancestors ) {
        _.each( r.taxon.ancestors.concat( [r.taxon] ), ( t, index ) => {
          if ( index === 0 ) {
            roots[ t.id ] = t;
          } else {
            children[ lastTaxon.id ] = children[ lastTaxon.id ] || { };
            children[ lastTaxon.id ][ t.id ] = t;
          }
          ancestorCounts[ t.id ] = ancestorCounts[ t.id ] || 0;
          ancestorCounts[ t.id ] += r.vision_score;
          lastTaxon = t;
        });
      }
    });
    const commonAncestor = ComputervisionController.commonAncestorByScoreSub(
      null, roots, children, ancestorCounts, threshold );
    if ( !commonAncestor ) { return; }
    return {
      taxon: commonAncestor,
      score: ancestorCounts[commonAncestor.id]
    };
  }

  static commonAncestorByScoreSub( taxon, roots, children, ancestorCounts, threshold ) {
    if ( taxon && taxon.rank == "genus" ) { return taxon; }
    var commonAncestor = taxon;
    var iterationTaxa = taxon ? children[ taxon.id ] : roots;
    var sorted = _.sortBy( iterationTaxa, t => ( ancestorCounts[t.id] ) ).reverse( );
    _.each( sorted, ( t, index ) => {
      if ( !taxon && index != 0 ) { return; }
      if ( ancestorCounts[ t.id ] < threshold ) { return taxon; }
      commonAncestor = ComputervisionController.commonAncestorByScoreSub(
        t, roots, children, ancestorCounts, threshold );
    });
    return commonAncestor;
  }

  static nearbyTaxonFrequencies( req, commonAncestor, callback ) {
    if ( !commonAncestor || !req.body.lat || !req.body.lng || !commonAncestor.taxon ||
          commonAncestor.taxon.rank_level > ( req.body.ancestor_level || 40 ) ) {
      return callback( null, null );
    }
    const query = {
      taxon_id: commonAncestor.taxon.id,
      lat: req.body.lat,
      lng: req.body.lng,
      radius: req.body.radius || 100 // km
    }
    if ( req.body.observed_on ) {
      const parsedDate = moment.utc( new Date( req.body.observed_on ) );
      if( parsedDate && parsedDate.isValid( ) ) {
        query.observed_after = parsedDate.subtract( req.body.window || 45, "days" ).
          format( "YYYY-MM-DDTHH:mm:ss" );
        query.observed_before = parsedDate.add( req.body.window || 45, "days" ).
          format( "YYYY-MM-DDTHH:mm:ss" );
      }
    }
    if ( req.inat.visionCacheKey ) {
      const freqCacheKey = `${req.inat.visionCacheKey}_frequencies_${JSON.stringify(query)}`;
      const cachedFrequencies = FileCache.cacheExists( freqCacheKey );
      if ( cachedFrequencies ) {
        return callback( null, JSON.parse( cachedFrequencies ) );
      }
    }
    ObservationsController.speciesCounts( { query }, ( err, response ) => {
      if ( err ) { return callback( err ); }
      if ( req.inat.visionCacheKey ) {
        const freqCacheKey = `${req.inat.visionCacheKey}_frequencies_${JSON.stringify(query)}`;
        FileCache.cacheFile( freqCacheKey, JSON.stringify( response ) );
      }
      callback( null, response );
    });
  }

  static normalizeScores( scores ) {
    var sumScores = _.sum( _.map( scores, "count" ) );
    _.each( scores, r => ( r.count = ( ( r.count * 100 ) / sumScores ) ) );
  }

}

module.exports = ComputervisionController;
