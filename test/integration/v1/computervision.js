"use strict";
var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    nock = require( "nock" ),
    jwt = require( "jsonwebtoken" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    config = require( "../../../config.js" ),
    app = iNaturalistAPI.server( );

describe( "Computervision", ( ) => {
  describe( "score_image", ( ) => {
    it( "accepts an image in a multipart request", done => {
      var token = jwt.sign( { user_id: 333 }, config.jwtSecret || "secret",
        { algorithm: "HS512" } );
      var fakeVisionResults = { 1: 0.01 };
      nock( config.imageProcesing.tensorappURL ).
        post( "/" ).
        reply( 200, fakeVisionResults );
      // Not testing response, just the fact that it accepts and image and
      // responds with success
      request( app ).post( "/v1/computervision/score_image" ).
        attach( "image", "test/fixtures/cuthona_abronia-tagged.jpg" ).
        set( "Authorization", token ).
        expect( "Content-Type", /json/ ).
        expect( 200, done );
    } );
  } );
} );
