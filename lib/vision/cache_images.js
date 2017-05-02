"use strict";
var _ = require( "lodash" );
var augmentedTestImagesJSON = _.slice( require("./augmented_test_images.json" ), 0, 15 );
var testImagesJSON = _.slice( require("./test_images.json" ), 0, 85 );
var ImageCache = require( "./image_cache" );
global.config = require( "../../config" );

const testImages = augmentedTestImagesJSON.concat( testImagesJSON );


let numRequested = 0;
let simultaneousDownloads = 3;

function downloadImages( ) {
  if ( numRequested >= simultaneousDownloads ) {
    // console.log( "waiting..." );
    setTimeout( downloadImages, 5 );
    return;
  }
  if ( testImages.length === 0 ) {
    console.log( "No more images" );
    return;
  }
  numRequested += 1;
  const image = testImages.shift( );
  const url = `http://static.inaturalist.org/photos/${image.photoID}/medium.${image.extension}`;
  const fileName = `${image.photoID}_medium.${image.extension}`;
  ImageCache.cacheURL( url, fileName, ( err, path ) => {
    numRequested -= 1;
    if ( err ) { return; }
    console.log( path );
    if ( testImages.length === 0 && numRequested === 0 ) {
      console.log( "Done" );
    }
  } );
  downloadImages( );
}

downloadImages( );



