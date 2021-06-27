const { expect } = require( "chai" );
const request = require( "supertest" );
const fs = require( "fs" );
const _ = require( "lodash" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Places", ( ) => {
  describe( "nearby", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/places/nearby" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "returns standard and community places", done => {
      request( app ).get( "/v1/places/nearby?swlat=41&swlng=-73&nelat=43&nelng=-70" )
        .expect( res => {
          const places = _.filter( fixtures.elasticsearch.places.place,
            p => !_.isNil( p.geometry_geojson ) );
          const communityPlaces = _.filter( places, p => p.admin_level === null );
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.results.standard[0].name ).to.eq( "United States" );
          expect( res.body.results.standard[1].name ).to.eq( "Massachusetts" );
          expect( res.body.results.community[0].name ).to.eq( communityPlaces[0].name );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/places/1" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "returns projects by slug", done => {
      request( app ).get( "/v1/places/united-states" )
        .expect( res => {
          expect( res.body.results[0].slug ).to.eq( "united-states" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "validates format of IDs", done => {
      request( app ).get( "/v1/places/haw.ii" )
        .expect( res => {
          expect( res.body.error ).to.eq( "Error" );
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "returns an error if too many IDs are requested", done => {
      const ids = [];
      const count = 501;
      for ( let i = 1; i <= count; i += 1 ) {
        ids.push( i );
      }
      request( app ).get( `/v1/places/${ids.join( "," )}` )
        .expect( res => {
          expect( res.body.error ).to.eq( "Unprocessable Entity" );
          expect( res.body.status ).to.eq( 422 );
        } ).expect( "Content-Type", /json/ )
        .expect( 422, done );
    } );

    it( "filters by admin_level", done => {
      request( app ).get( "/v1/places/1,2,3?admin_level=1" )
        .expect( res => {
          expect( res.body.results.map( r => r.id )
            .includes( 1 ) ).to.be.false; // admin_level = 0
          expect( res.body.results.map( r => r.id )
            .includes( 3 ) ).to.be.false; // admin_level = null
          expect( res.body.results.map( r => r.id )
            .includes( 2 ) ).to.be.true; // admin_level = 1
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "filters by admin_level and id", done => {
      request( app ).get( "/v1/places/1,3?admin_level=1" )
        .expect( res => {
          expect( res.body.results.map( r => r.id )
            .includes( 2 ) ).to.be.false; // admin_level = 1
        } )
        .expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "autocomplete", ( ) => {
    it( "returns an empty response if not given a query", done => {
      request( app ).get( "/v1/places/autocomplete" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns partial matches", done => {
      request( app ).get( "/v1/places/autocomplete?q=a-place" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "a-place" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "filters by geo", done => {
      request( app ).get( "/v1/places/autocomplete?q=a-place&geo=true" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "sorts by bbox area", done => {
      // TODO: this isn't testing anything
      request( app ).get( "/v1/places/autocomplete?q=un&order_by=area" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "United States" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "includes a bounding box if there's a geometry", done => {
      request( app ).get( "/v1/places/autocomplete?q=Massachusetts" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "Massachusetts" );
          expect( res.body.results[0].bounding_box_geojson ).not.to.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
