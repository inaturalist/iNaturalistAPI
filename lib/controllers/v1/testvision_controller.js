"use strict";
var _ = require( "underscore" ),
    fs = require( "fs" ),
    pug = require( "pug" ),
    request = require( "request" ),
    moment = require( "moment" ),
    ObservationsController = require( "./observations_controller" ),
    TaxaController = require( "./taxa_controller" );

var TestvisionController = class TestvisionController {

  static compare( req, callback ) {
    if ( !req.params.id ) { return callback( "Need an observation ID" ); }
    ObservationsController.show( req, ( err, response ) => {
      if ( err ) { return callback( err ); }
      if ( !response.results || response.results.length === 0 ) {
        return callback( "Cannot find observation" );
      }
      var observation = response.results[0];
      if ( !observation.taxon ) { return callback( "No taxon" ); }
      if ( observation.photos.length === 0 ) { return callback( "No photos" ); }
      if ( !observation.observed_on ) { return callback( "No Date" ); }
      if ( !observation.location ) { return callback( "No Location" ); }
      var photo = observation.photos[0].url.replace( "square", "small" );
      var extension = photo.match(/\.([a-z]{2,5})(\?|$)/i)[1];

      var tempfilepath = `public/uploads/${ observation.id }.${ extension }`;
      fs.stat( tempfilepath, err => {
        if ( err === null ) {
          return TestvisionController.finishCompare( req, observation, tempfilepath, callback );
        }
        request.
          get( photo ).
          on( "error", err => { return callback( err ); }).
          pipe( fs.createWriteStream( tempfilepath ) ).
          on( "close", ( ) => {
            TestvisionController.finishCompare( req, observation, tempfilepath, callback );
          });
      });
    });
  }

  static finishCompare( req, observation, tempfilepath, callback ) {
    var uploadPath = tempfilepath.replace( "public/", "" );
    var filename = tempfilepath.replace( "public/uploads/", "" );
    var newReq = Object.assign( { }, req, { file: { filename: filename } } );
    TaxaController.similarToImage( newReq, ( err, response ) => {
      if ( err ) { return callback( err ); }
      var similarByPhoto = response.results;
      var roots = { };
      var children = { };
      var bestRoots = { };
      var bestChildren = { };
      var ancestorCounts = { };
      var cuttoff = 0.8;
      var sumOfScores = 0;
      _.each( response.results, r => {
        var lastTaxon = null;
        sumOfScores += r.score;
        r.taxon.ancestors.push( r.taxon );
        _.each( r.taxon.ancestors, ( t, index ) => {
          if ( index === 0 ) {
            roots[ t.id ] = t;
            if ( sumOfScores <= cuttoff ) {
              bestRoots[ t.id ] = t;
            }
          } else {
            children[ lastTaxon.id ] = children[ lastTaxon.id ] || { };
            children[ lastTaxon.id ][ t.id ] = t;
            if ( sumOfScores <= cuttoff ) {
              bestChildren[ lastTaxon.id ] = bestChildren[ lastTaxon.id ] || { };
              bestChildren[ lastTaxon.id ][ t.id ] = t;
            }
          }
          ancestorCounts[ t.id ] = ancestorCounts[ t.id ] || 0;
          ancestorCounts[ t.id ] += r.score;
          lastTaxon = t;
        });
      });
      var jstreeData = [ ];
      _.each( _.sortBy( roots, t => ( ancestorCounts[t.id] ) ).reverse( ), ( t, index ) => {
        if ( ancestorCounts[t.id] < 1 ) { return; }
        jstreeData.push(
          TestvisionController.branchData( t, 0, children, ancestorCounts, index === 0 ) );
      });

      var commonAncestor = TestvisionController.commonAncestorByTotalScore(
        roots, children, ancestorCounts );

      var date = moment( observation.observed_on );
      var lowerDate = date.add( 45, "days" );
      var upperDate = date.subtract( 45, "days" );
      var locationParts = observation.location.split( "," );
      var latitude = locationParts[0];
      var longitude = locationParts[1];

      var frequencyReq = {
        query: {
          updated_since: lowerDate.format( "YYYY-MM-DDTHH:mm:ss" ),
          updated_before: upperDate.format( "YYYY-MM-DDTHH:mm:ss" ),
          lat: latitude,
          lng: longitude,
          radius: 200
        }
      };
      if ( commonAncestor ) { frequencyReq.query.taxon_id = commonAncestor.id; }
      ObservationsController.speciesCounts( frequencyReq, ( err, r ) => {
        var html = pug.renderFile( "lib/views/test_vision.pug", {
          observation: observation,
          tempfilepath: uploadPath,
          similarByPhoto: similarByPhoto.slice( 0, 50 ),
          jstreeData: jstreeData,
          nearbyTaxa: r.results.slice( 0, 50 ),
          commonAncestor: commonAncestor
        });
        callback( null, html );
      });
    });
  }

  static branchData( taxon, depth, children, ancestorCounts, firstBranch ) {
    var data = {
      text: `${ taxon.name } :: ${ Math.round( ancestorCounts[ taxon.id ] * 100 ) / 100 }`,
      icon: taxon.default_photo ? taxon.default_photo.square_url : null,
      a_attr: { href: `http://www.inaturalist.org/taxa/${taxon.id}` }
    };
    if ( firstBranch ) {
      data.state = { opened: true };
    }
    if ( !children[ taxon.id ] ) {
      if ( firstBranch ) { data.state.selected = true; }
      return data;
    }
    var sorted = _.sortBy( children[ taxon.id ], c => ( ancestorCounts[c.id] ) ).reverse( );
    data.children = [ ];
    _.each( sorted, ( c, index ) => {
      if ( ancestorCounts[c.id] < 1 ) { return; }
      data.children.push( TestvisionController.branchData(
        c, depth + 1, children, ancestorCounts, ( firstBranch && index === 0 ) ) );
    });
    return data;
  }

  static commonAncestorByTotalScore( roots, children, ancestorCounts) {
    var commonAncestor;
    _.each( _.sortBy( roots, t => ( ancestorCounts[t.id] ) ).reverse( ), ( t, index ) => {
      if ( index != 0 ) { return; }
      if ( ancestorCounts[ t.id ] < 80 ) { return; }
      commonAncestor = TestvisionController.commonAncestorByTotalScoreSub(
        t, children, ancestorCounts );
    });
    return commonAncestor;
  }

  static commonAncestorByTotalScoreSub( taxon, children, ancestorCounts) {
    var commonAncestor = taxon;
    var sorted = _.sortBy( children[ taxon.id ], c => ( ancestorCounts[c.id] ) ).reverse( );
    _.each( sorted, ( c ) => {
      if ( ancestorCounts[ c.id ] < 80 ) { return taxon; }
      commonAncestor = TestvisionController.commonAncestorByTotalScoreSub(
        c, children, ancestorCounts );
    });
    return commonAncestor;
  }

};

module.exports = TestvisionController;
