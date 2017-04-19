"use strict";
var _ = require( "underscore" ),
    fs = require( "fs" ),
    request = require( "request" ),
    path  = require( "path" ),
    moment = require( "moment" ),
    ObservationsController = require( "./observations_controller" ),
    TaxaController = require( "./taxa_controller" ),
    config = require( "../../../config" ),
    util = require( "../../util");

const DEFAULT_ANCESTOR_THRESHOLD = 70;
const DEFAULT_ANCESTOR_RANK_LEVEL_CUTOFF = 40;

var ComputervisionController = class ComputervisionController {

  static scoreImage( req, callback ) {
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
      const json = JSON.parse( body );
      var scores = _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        count: score
      }));

      scores = _.sortBy( scores, "count" ).reverse( ).slice( 0, 100 );
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
    req.inat.similarToImage = true;
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
      var date = req.body.observed_on && moment( req.body.observed_on );
      query.updated_since = date.subtract( req.body.window || 45, "days" ).
        format( "YYYY-MM-DDTHH:mm:ss" );
      query.updated_before = date.add( req.body.window || 45, "days" ).
        format( "YYYY-MM-DDTHH:mm:ss" );
    }
    ObservationsController.speciesCounts( { query }, callback );
  }


}

module.exports = {
  score_image: ComputervisionController.scoreImage
};
