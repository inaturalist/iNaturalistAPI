const request = require( "supertest" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

describe( "Tileserver", ( ) => {
  describe( "taxon places", ( ) => {
    it( "renders taxon place tiles", done => {
      request( app ).get( "/v1/taxon_places/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "taxon ranges", ( ) => {
    it( "renders taxon range tiles", done => {
      request( app ).get( "/v1/taxon_ranges/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "places", ( ) => {
    it( "renders place tiles", done => {
      request( app ).get( "/v1/places/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "summary", ( ) => {
    it( "renders summary tiles", function ( done ) {
      this.timeout( 5000 );
      request( app ).get( "/v1/summary/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "heatmap", ( ) => {
    it( "renders heatmap tiles", function ( done ) {
      this.timeout( 5000 );
      request( app ).get( "/v1/heatmap/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "colored heatmap", ( ) => {
    it( "renders colored_heatmap tiles", function ( done ) {
      this.timeout( 5000 );
      request( app ).get( "/v1/colored_heatmap/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "points", ( ) => {
    it( "renders points tiles", done => {
      request( app ).get( "/v1/points/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );
} );
