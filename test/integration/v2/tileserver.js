const request = require( "supertest" );
const { expect } = require( "chai" );

describe( "Tileserver", ( ) => {
  describe( "taxon places", ( ) => {
    it( "renders taxon place tiles", function ( done ) {
      request( this.app ).get( "/v2/taxon_places/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "taxon ranges", ( ) => {
    it( "renders taxon range tiles", function ( done ) {
      request( this.app ).get( "/v2/taxon_ranges/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "places", ( ) => {
    it( "renders place tiles", function ( done ) {
      request( this.app ).get( "/v2/places/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "heatmap", ( ) => {
    it( "renders heatmap tiles", function ( done ) {
      this.timeout( 5000 );
      request( this.app ).get( "/v2/heatmap/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );

    it( "renders heatmap UTFGrids", function ( done ) {
      this.timeout( 5000 );
      request( this.app ).get( "/v2/heatmap/1/0/0.grid.json" )
        .expect( res => {
          expect( res.body.grid ).not.to.be.empty;
          expect( res.body.keys ).not.to.be.empty;
          expect( res.body.data ).not.to.be.empty;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "points", ( ) => {
    it( "renders points tiles", function ( done ) {
      request( this.app ).get( "/v2/points/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );

    it( "renders points UTFGrids", function ( done ) {
      this.timeout( 5000 );
      request( this.app ).get( "/v2/points/1/0/0.grid.json" )
        .expect( res => {
          expect( res.body.grid ).not.to.be.empty;
          expect( res.body.keys ).not.to.be.empty;
          expect( res.body.data ).not.to.be.empty;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "grid", ( ) => {
    it( "renders grid tiles", function ( done ) {
      request( this.app ).get( "/v2/grid/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );

    it( "renders grid UTFGrids", function ( done ) {
      this.timeout( 5000 );
      request( this.app ).get( "/v2/grid/1/0/0.grid.json" )
        .expect( res => {
          expect( res.body.grid ).not.to.be.empty;
          expect( res.body.keys ).not.to.be.empty;
          expect( res.body.data ).not.to.be.empty;
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
