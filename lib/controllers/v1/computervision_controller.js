"use strict";
var _ = require( "underscore" ),
    fs = require( "fs" ),
    request = require( "request" ),
    path  = require( "path" ),
    TaxaController = require( "./taxa_controller" ),
    config = require( "../../../config" );

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
    console.log(config.imageProcesing.tensorappURL)
    request.post({ url: config.imageProcesing.tensorappURL, formData }, ( err, httpResponse, body ) => {
      if ( err ) { return callback( err ); }
      const json = JSON.parse( body );
      var scores = _.map( json, ( score, id ) => ( {
        taxon_id: Number( id ),
        count: score
      }));

      scores = _.sortBy( scores, "count" ).reverse( ).slice( 0, 30 );
      req.query.per_page = 20;
      req.inat.similarToImage = true;
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
          response.common_ancestor = commonAncestor;
        }
        callback( null, response );
      });
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

}

module.exports = {
  score_image: ComputervisionController.scoreImage
};
