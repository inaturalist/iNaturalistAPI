var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    _ = require( "lodash" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "Search", ( ) => {
  describe( "search", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } )
    it( "returns taxa", done => {
      request( app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.rank ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "returns places", done => {
      request( app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.bbox_area ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "returns projects", done => {
      request( app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.user_ids ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "returns users", done => {
      request( app ).get( "/v1/search?q=search+test" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.login ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "returns substring matches", done => {
      request( app ).get( "/v1/search?q=test+user" ).expect( res => {
        expect( _.filter( res.body.results, r => r.record.login === "search_test_user" ).length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    it( "returns fuzzy matches", done => {
      request( app ).get( "/v1/search?q=sarch+test" ).expect( res => {
        expect( res.body.results.length ).to.be.above( 0 );
      } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } )
  } );
} );
