"use strict";
var _ = require( "lodash" );
var augmentedTestImagesJSON = _.slice( require("./augmented_test_images.json" ), 0, 0 );
var testImagesJSON = _.slice( require("./test_images.json" ), 0, 200 );
var CVStats = require( "./cv_stats" );

const testImages = _.shuffle( augmentedTestImagesJSON.concat( testImagesJSON ) );
const stats = new CVStats( );
stats.process( testImages );
