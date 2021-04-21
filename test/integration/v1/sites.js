const { expect } = require( "chai" );
const request = require( "supertest" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

describe( "Sites", ( ) => {
  describe( "index", ( ) => {
    it( "lists sites", done => {
      request( app ).get( "/v1/sites" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 2 );
          expect( res.body.total_results ).to.eq( 2 );
          expect( res.body.results[0].id ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "iNaturalist" );
          expect( res.body.results[0].icon_url ).not.to.be.undefined;
          expect( res.body.results[1].id ).to.eq( 2 );
          expect( res.body.results[1].name ).to.eq( "NaturaLista" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
  describe( "fetch", ( ) => {
    it( "fetches a single site", done => {
      request( app ).get( "/v1/sites/2" )
        .expect( 200 )
        .expect( res => {
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "NaturaLista" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "fetches multiple sites", done => {
      request( app ).get( "/v1/sites/1,2" )
        .expect( 200 )
        .expect( res => {
          const responseNames = res.body.results.map( s => s.name );
          expect( responseNames ).to.include( "iNaturalist" );
          expect( responseNames ).to.include( "NaturaLista" );
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
