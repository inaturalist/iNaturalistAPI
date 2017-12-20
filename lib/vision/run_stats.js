"use strict";
var _ = require( "lodash" );
var augmentedTestImagesJSON = _.slice( require("./augmented_test_images.json" ), 0, 15 );
var testImagesJSON = _.slice( require("./test_images.json" ), 0, 85 );
var CVStats = require( "./cv_stats" );
var pgClient = require( "../pg_client" );
var Promise = require( "bluebird" );

const testImages = _.shuffle( augmentedTestImagesJSON.concat( testImagesJSON ) );
// const testImages = augmentedTestImagesJSON.concat( testImagesJSON );
const stats = new CVStats( );


function stop( ) {
  // this will stop the script
  pgClient.connection.end( err => {
    if ( err ) { console.log( err ); }
  });
}

function runTest( options ) {
  return new Promise( ( resolve, reject ) => {
    stats.reprocess( testImages, options, ( err, results ) => {
      if ( err ) { return reject( ); }
      resolve( results );
    });
  });
}


stats.process( testImages, { skip_frequencies: true }, ( err, results ) => {
  if ( err ) { return stop( ); }

  // print the results of the initial, non-frequency run
  CVStats.statsOutput( results );

  const allOptions = [ { } ];
  // _.each( [ 20, 15, 10, 5, 3, 2, 1 ], ancestorWindow => {
  //   _.each( _.range( 50, 101, 10 ), ancestorThreshold => {
  //     allOptions.push( { body: {
  //       ancestor_window: ancestorWindow,
  //       ancestor_threshold: ancestorThreshold
  //     }});
  //   });
  // });
  allOptions.push( { body: { ancestor_window: 10 } } );
  allOptions.push( { } );

  // util.debug( "Starting photo processing..." + this.testImages.length );
  console.log( "num taxa\tscore cutoff\t% with\t% total right\t% total with\t# top 10\t# top 5\t# top 2\t# top 1\tavg score");
  Promise.reduce( allOptions, ( total, options ) => {
    if ( _.isEmpty( options.body ) ) { return; }
    return runTest( options ).then( results => {
      CVStats.statsOutput( results );
    }).catch( e => { console.log( e ); });
  }).then( () => {
    console.log( "done" );
    stop( );
  }).catch( e => {
    console.log(e);
    stop( );
  });
} );
