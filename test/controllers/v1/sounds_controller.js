"use strict";
const sounds = require( "inaturalistjs" ).sounds;
const testHelper = require( "../../../lib/test_helper" );
const SoundsController = require( "../../../lib/controllers/v1/sounds_controller" );

describe( "SoundsController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSNoPreload( SoundsController, sounds, "create", done );
  });
});