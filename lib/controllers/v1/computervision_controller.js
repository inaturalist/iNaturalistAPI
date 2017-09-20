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
    config = require( "../../../config" );

const DEFAULT_ANCESTOR_THRESHOLD = 70;
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 40;

let TFServingTaxonDescendants = { };
if ( config.imageProcesing && config.imageProcesing.taxaFilePath &&
     fs.existsSync( config.imageProcesing.taxaFilePath ) ) {
  var TFServingTaxonIDs = fs.readFileSync( config.imageProcesing.taxaFilePath ).
    toString( ).split( "\n" ).map( i => ( Number( i ) ) );
  setTimeout( ( ) => {
    const idChunks = _.chunk( TFServingTaxonIDs, 500 );
    _.each( idChunks, idChunk => {
      var query = squel.select( ).field( "id, ancestry").from( "taxa" ).
        where( "id IN ?", idChunk );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
          if( err ) { return; }
          _.each( result.rows, row => {
            const taxonID = row.id;
            if ( !row.ancestry ) { return; }
            const ancestors = row.ancestry.split( "/" );
              TFServingTaxonDescendants[taxonID] = TFServingTaxonDescendants[taxonID] || {};
              TFServingTaxonDescendants[taxonID][taxonID] = true;
            _.each( ancestors, ancestorID => {
              TFServingTaxonDescendants[ancestorID] = TFServingTaxonDescendants[ancestorID] || {};
              TFServingTaxonDescendants[ancestorID][taxonID] = true;
            });
          });
        }
      );
    });
  }, 5000 );
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
        if ( p.url && p.url.match( /static\.inaturalist.*\/square\.jpe?g[\?$]/i ) ) {
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
      var scores = _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        count: score
      }));
      scores = _.filter( scores, s => ( s.count > 0 ) );
      if ( req.body.taxon_id ) {
        if ( !TFServingTaxonDescendants[req.body.taxon_id] ) {
          return callback( null, {
            total_results: 0,
            page: 1,
            per_page: 10,
            results: []
          } );
        }
        scores = _.filter( scores, s => {
          return TFServingTaxonDescendants[req.body.taxon_id][s.taxon_id];
        });
      }
      scores = _.sortBy( scores, "count" ).reverse( );
      var sumScores = _.reduce( scores, ( sum, r ) => ( sum + r.count ), 0 );
      _.each( scores, r => ( r.count = ( ( r.count * 100 ) / sumScores ) ) );
      ComputervisionController.commonAncestor( req, scores, ( err, commonAncestor ) => {
        if ( err ) { return callback( err ); }
        if ( commonAncestor ) {
          ComputervisionController.nearbyTaxonFrequencies( req, commonAncestor, ( err, nearbyTaxa ) => {
            if ( err ) { return callback( err ); }
            if ( nearbyTaxa && !_.isEmpty( nearbyTaxa.results ) ) {
              var sumScores = _.reduce( nearbyTaxa.results, ( sum, r ) => ( sum + r.count ), 0);
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
                  ( r.count / 100 ) * ( 1 / nearbyTaxa.results.length );
              });
              let topScores = _.map( taxonScores, ( v, k ) => {
                return {
                  taxon_id: k,
                  count: visionScores[ k ] ? v : v * ( 1 / scores.length ),
                  frequency_score: ( frequencyScores[ k ] || 0 ) * 100,
                  vision_score: ( visionScores[ k ] || 0 ) * 100
                }
              } );
              var sumTopScores = _.reduce( topScores, ( sum, r ) => ( sum + r.count ), 0 );
              _.each( topScores, r => ( r.count = ( ( r.count * 100 ) / sumTopScores ) ) );
              topScores = _.sortBy( topScores, s => s.count ).reverse( );

              ComputervisionController.scoreImageResponse( req, commonAncestor, topScores.slice( 0, 10 ), callback );
            } else {
              const top10 = scores.slice( 0, 10 );
              _.each( top10, s => { s.vision_score = s.count; } );
              ComputervisionController.scoreImageResponse( req, commonAncestor, top10, callback );
            }
          });
        } else {
          const top10 = scores.slice( 0, 10 );
          _.each( top10, s => { s.vision_score = s.count; } );
          ComputervisionController.scoreImageResponse( req, null, top10, callback );
        }
      } );
    });
  }

  static scoreImageResponse( req, commonAncestor, top10, callback ) {
    req.inat.similarToImage = true;
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
    scores = scores.slice( 0, 20 );
    req.inat.similarToImage = true;
    var sumScores = _.reduce( scores, ( sum, r ) => ( sum + r.count ), 0 );
    _.each( scores, r => ( r.count = ( ( r.count * 100 ) / sumScores ) ) );
    TaxaController.speciesCountsResponse( req, scores, { }, ( err, response ) => {
      if( err ) { return callback( err ); }
      const commonAncestor = ComputervisionController.commonAncestorByScore(
        response.results, req.body.ancestor_threshold || DEFAULT_ANCESTOR_THRESHOLD );
      if ( commonAncestor && commonAncestor.taxon.rank_level <= (
        req.body.rank_level_cutoff || DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF ) ) {
        return callback( null, commonAncestor );
      }
      return callback( );
    });
  }

  static commonAncestorByScore( results, threshold ) {
    var roots = { };
    var children = { };
    var ancestorCounts = { };
    _.each( results, r => {
      var lastTaxon = null;
      _.each( r.taxon.ancestors.concat( [r.taxon] ), ( t, index ) => {
        if ( index === 0 ) {
          roots[ t.id ] = t;
        } else {
          children[ lastTaxon.id ] = children[ lastTaxon.id ] || { };
          children[ lastTaxon.id ][ t.id ] = t;
        }
        ancestorCounts[ t.id ] = ancestorCounts[ t.id ] || 0;
        ancestorCounts[ t.id ] += r.count;
        lastTaxon = t;
      });
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
    if ( !commonAncestor || !req.body.lat || !req.body.lng ||
          commonAncestor.taxon.rank_level > ( req.body.ancestor_level || 40 ) ) {
      return callback( null, null );
    }
    const query = {
      taxon_id: commonAncestor.taxon.id,
      lat: req.body.lat,
      lng: req.body.lng,
      radius: req.body.radius || 1000
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
    ObservationsController.speciesCounts( { query }, callback );
  }


}

module.exports = {
  scoreObservation: ComputervisionController.scoreObservation,
  scoreImage: ComputervisionController.scoreImage,
  scoreImageURL: ComputervisionController.scoreImageURL
};
