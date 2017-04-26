"use strict";
var _ = require( "lodash" ),
    fs = require( "fs" ),
    request = require( "request" ),
    path  = require( "path" ),
    moment = require( "moment" ),
    squel = require( "squel" ),
    pgClient = require( "../../pg_client" ),
    ObservationsController = require( "./observations_controller" ),
    TaxaController = require( "./taxa_controller" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    config = require( "../../../config" );

const DEFAULT_ANCESTOR_THRESHOLD = 70;
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 40;

let TFServingTaxonDescendants = { };
let TFServingTaxonAncestries = { };
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
            TFServingTaxonAncestries[taxonID] = ancestors;
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
  }, 2000 );
}



var ComputervisionController = class ComputervisionController {

  static scoreImage( req, callback ) {
    var uploadPath = path.resolve( global.config.imageProcesing.uploadsDir,
      req.file.filename );
    return ComputervisionController.scoreImageUpload( uploadPath, req, callback );
  }

  static scoreImagePath( uploadPath, file, callback ) {
    var formData = { image: {
      value:  fs.createReadStream( uploadPath ),
      options: {
        filename: file.filename,
        contentType: file.mimetype
      }
    } };
    var options = {
      url: config.imageProcesing.tensorappURL,
      timeout: 5000,
      formData };
    request.post( options, ( err, httpResponse, body ) => {
      if ( err ) { return callback( err ); }
      const json = JSON.parse( body );
      callback( null, _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        count: score
      })));
    });
  }

  static scoreImageUpload( uploadPath, req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    ComputervisionController.scoreImagePath( uploadPath, req.file, ( err, scores ) => {
      if ( err ) { return callback( err ); }
      scores = _.filter( scores, s => ( s.count > 0 ) );
      req.query.per_page
      if ( req.body.taxon_id ) {
        if ( !TFServingTaxonDescendants[req.body.taxon_id] ) {
          return InaturalistAPI.basicResponse( null, req, null, callback );
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
    console.log("Asdfasdf")
    req.inat.taxonPhotos = true;
    req.inat.taxonAncestries = true;
    TaxaController.speciesCountsResponse( req, top10, ( err, response ) => {
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
    req.query.per_page = 20;
    req.inat.taxonPhotos = false;
    req.inat.taxonAncestries = true;
    // normalize scores
    var sumScores = _.reduce( scores, ( sum, r ) => ( sum + r.count ), 0 );
    _.each( scores, r => ( r.count = ( ( r.count * 100 ) / sumScores ) ) );
    TaxaController.speciesCountsResponse( req, scores, ( err, response ) => {
      if( err ) { return callback( err ); }
      _.each( response.results, r => {
        r.vision_score = r.count;
        delete r.count;
      });
      const commonAncestor = ComputervisionController.commonAncestorByScore(
        response.results, req.query.ancestor_threshold || DEFAULT_ANCESTOR_THRESHOLD );
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
        ancestorCounts[ t.id ] += r.vision_score;
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
    if ( !commonAncestor || !req.body.lat || !req.body.lng || !commonAncestor.taxon ||
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
      var date = req.body.observed_on && moment( req.body.observed_on );
      query.updated_since = date.subtract( req.body.window || 45, "days" ).
        format( "YYYY-MM-DDTHH:mm:ss" );
      query.updated_before = date.add( req.body.window || 45, "days" ).
        format( "YYYY-MM-DDTHH:mm:ss" );
    }
    ObservationsController.speciesCounts( { query }, callback );
  }


}

module.exports = ComputervisionController;
