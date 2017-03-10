"use strict";
var _ = require( "underscore" ),
    fs = require( "fs" ),
    pug = require( "pug" ),
    request = require( "request" ),
    moment = require( "moment" ),
    ObservationsController = require( "./observations_controller" ),
    TaxaController = require( "./taxa_controller" ),
    scored;


var TestvisionController = class TestvisionController {

  static compare( req, callback ) {
    if ( !req.params.id ) { return callback( "Need an observation ID" ); }
    const origReq = Object.assign( { }, req );
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
        // if ( err === null ) {
        //   return TestvisionController.finishCompare( req, observation, tempfilepath, callback );
        // }
        request.
          get( photo ).
          on( "error", err => { return callback( err ); }).
          pipe( fs.createWriteStream( tempfilepath ) ).
          on( "close", ( ) => {
            TestvisionController.finishCompare( origReq, observation, tempfilepath, callback );
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
      var ancestorCounts = { };
      _.each( response.results, r => {
        var lastTaxon = null;
        r.taxon.ancestors.push( r.taxon );
        _.each( r.taxon.ancestors, ( t, index ) => {
          if ( index === 0 ) {
            roots[ t.id ] = t;
          } else {
            children[ lastTaxon.id ] = children[ lastTaxon.id ] || { };
            children[ lastTaxon.id ][ t.id ] = t;
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
      TestvisionController.nearbyTaxonFrequencies( observation, commonAncestor, ( err, r ) => {
        var nearbyTaxa = r.results;
        var sumScores = _.reduce( nearbyTaxa, ( sum, r ) => ( sum + r.count ), 0);
        var nearbyTaxonIDs = _.groupBy( nearbyTaxa, r => ( r.taxon.id ) );
        var visionScores = { };
        var onlyVision = [ ];
        var onlyFrequency = [ ];
        var combinedSet = [ ];
        var allSet = [ ];
        _.each( similarByPhoto, r => {
          visionScores[ r.taxon.id ] = r.score / 100;
          if( !nearbyTaxonIDs[ r.taxon.id ] ) {
            onlyVision.push( r );
          }
        });
        _.each( nearbyTaxa, r => {
          r.score = ( r.count / sumScores );
          if( visionScores[ r.taxon.id ] ) {
            scored = Object.assign( { }, r, {
              score: r.score * visionScores[ r.taxon.id ] } );
            combinedSet.push( scored );
            allSet.push( scored );
          } else {
            onlyFrequency.push( r );
            scored = Object.assign( { }, r, {
              score: r.score * ( 1 / similarByPhoto.length ) } );
            allSet.push( scored );
          }
        });
        var sumCombinedScores = _.reduce( combinedSet, ( sum, r ) => ( sum + r.score ), 0);
        _.each( combinedSet, r => ( r.score = ( ( r.score * 100 ) / sumCombinedScores ) ) );
        var sumAllScores = _.reduce( allSet, ( sum, r ) => ( sum + r.score ), 0);
        _.each( allSet, r => ( r.score = ( ( r.score * 100 ) / sumAllScores ) ) );
        if ( err ) { return callback( err ); }
        var html = pug.renderFile( "lib/views/test_vision.pug", {
          observation: observation,
          tempfilepath: uploadPath,
          similarByPhoto: similarByPhoto.slice( 0, 50 ),
          jstreeData: jstreeData,
          nearbyTaxa: nearbyTaxa.slice( 0, 50 ),
          onlyVision: _.sortBy( onlyVision, c => ( c.score ) ).reverse( ).slice( 0, 50 ),
          onlyFrequency: _.sortBy( onlyFrequency, c => ( c.score ) ).reverse( ).slice( 0, 50 ),
          combinedSet: _.sortBy( combinedSet, c => ( c.score ) ).reverse( ).slice( 0, 50 ),
          commonAncestor: commonAncestor,
          allSet: _.sortBy( allSet, c => ( c.score ) ).reverse( ).slice( 0, 50 )
        });
        callback( null, html );
      });
    });
  }

  static nearbyTaxonFrequencies( observation, commonAncestor, callback ) {
    var date = moment( observation.observed_on );
    var locationParts = observation.location.split( "," );
    var frequencyReq = {
      query: {
        updated_since: date.subtract( 45, "days" ).format( "YYYY-MM-DDTHH:mm:ss" ),
        updated_before: date.add( 45, "days" ).format( "YYYY-MM-DDTHH:mm:ss" ),
        lat: locationParts[0],
        lng: locationParts[1],
        radius: 200
      }
    };
    if ( commonAncestor ) { frequencyReq.query.taxon_id = commonAncestor.id; }
    ObservationsController.speciesCounts( frequencyReq, callback );
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
      if ( ancestorCounts[ t.id ] < 70 ) { return; }
      commonAncestor = TestvisionController.commonAncestorByTotalScoreSub(
        t, children, ancestorCounts );
    });
    return commonAncestor;
  }

  static commonAncestorByTotalScoreSub( taxon, children, ancestorCounts) {
    if ( taxon.rank == "genus" ) { return taxon; }
    var commonAncestor = taxon;
    var sorted = _.sortBy( children[ taxon.id ], c => ( ancestorCounts[c.id] ) ).reverse( );
    _.each( sorted, ( c ) => {
      if ( ancestorCounts[ c.id ] < 70 ) { return taxon; }
      commonAncestor = TestvisionController.commonAncestorByTotalScoreSub(
        c, children, ancestorCounts );
    });
    return commonAncestor;
  }

};

module.exports = TestvisionController;
