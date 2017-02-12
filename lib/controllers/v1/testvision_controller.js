"use strict";
var _ = require( "underscore" ),
    fs = require( "fs" ),
    pug = require( "pug" ),
    request = require( "request" ),
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
      if ( observation.photos.length === 0 ) {
        return callback( "No photos" );
      }
      var photo = observation.photos[0].url.replace( "square", "small" );
      var extension = photo.match(/\.([a-z]{2,5})(\?|$)/)[1];

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
        if ( ancestorCounts[root.id] < 1 ) { return; }
        jstreeData.push(
          TestvisionController.branchData( t, 0, children, ancestorCounts, index === 0 ) );
      });

      var html = pug.renderFile( "lib/views/test_vision.pug", {
        observation: observation,
        tempfilepath: uploadPath,
        similarByPhoto: similarByPhoto,
        jstreeData: jstreeData
      });
      callback( null, html );
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

};

module.exports = TestvisionController;
