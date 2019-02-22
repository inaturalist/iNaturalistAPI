const _ = require( "lodash" );
const { expect } = require( "chai" );
const request = require( "supertest" );
const querystring = require( "querystring" );
const iNaturalistAPI = require( "../../../lib/inaturalist_api" );

const app = iNaturalistAPI.server( );

describe( "Taxa", ( ) => {
  describe( "autocomplete", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/taxa/autocomplete" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "returns matches, with all exact results first", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=los" )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 30 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
          expect( res.body.results[0].matched_term ).to.eq( "Los" );
          expect( res.body.results[1].matched_term ).to.eq( "Los" );
          expect( res.body.results[2].matched_term ).to.eq( "Los lobos" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "searches japanese characters", done => {
      request( app ).get( `/v1/taxa/autocomplete?q=${querystring.escape( "眼紋疏廣蠟蟬" )}` )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].matched_term ).to.eq( "眼紋疏廣蠟蟬" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can return inactive taxa", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=los&is_active=false" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 2 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can return all taxa", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=los&is_active=any" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 4 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns no more than 30 per page", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=los&per_page=50" )
        .expect( res => {
          expect( res.body.per_page ).to.eq( 30 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns default per_page of 30 if fewer than 1 were requested", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=los&per_page=-1" )
        .expect( res => {
          expect( res.body.per_page ).to.eq( 30 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "scores multiple term matches higher", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=Mimulus+gut" )
        .expect( res => {
          expect( res.body.results[0].name ).to.eq( "Mimulus guttatus" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "should favor names in preferredPlace", done => {
      request( app ).get( "/v1/taxa/autocomplete?q=yellow+pansy&preferred_place_id=433" )
        .expect( res => {
          expect( res.body.results[0].name ).to.eq( "Junonia hierta" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "show", ( ) => {
    it( "returns json", done => {
      request( app ).get( "/v1/taxa/1" )
        .expect( "Content-Type", /json/ ).expect( 200, done );
    } );

    it( "populates preferred means and status", done => {
      request( app ).get( "/v1/taxa/1?preferred_place_id=432" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 1 );
          expect( taxon.conservation_status.status ).to.eq( "VU" );
          expect( taxon.conservation_status.place.id ).to.eq( 432 );
          expect( taxon.establishment_means.establishment_means ).to.eq( "endemic" );
          expect( taxon.establishment_means.place.id ).to.eq( 432 );
          expect( taxon.preferred_establishment_means ).to.eq( "endemic" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "populates conservation_statuses and listed_taxa", done => {
      request( app ).get( "/v1/taxa/10001" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 10001 );
          expect( taxon.conservation_statuses.length ).to.eq( 1 );
          expect( taxon.conservation_statuses[0].place.name ).to.eq( "a-place" );
          expect( taxon.listed_taxa.length ).to.eq( 1 );
          expect( taxon.listed_taxa[0].place.name ).to.eq( "a-place" );
          expect( taxon.listed_taxa[0].list.title ).to.eq( "DetailsListedTaxonList" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "populates ancestors", done => {
      request( app ).get( "/v1/taxa/3" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 3 );
          expect( taxon.ancestors.length ).to.eq( 2 );
          expect( taxon.ancestors[0].id ).to.eq( 1 );
          expect( taxon.ancestors[1].id ).to.eq( 2 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "populates children", done => {
      request( app ).get( "/v1/taxa/2" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 2 );
          expect( taxon.children.length ).to.eq( 1 );
          expect( taxon.children[0].id ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxon_changes_count", done => {
      request( app ).get( "/v1/taxa/3" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.taxon_changes_count ).to.eq( 1 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxon_schemes_count", done => {
      request( app ).get( "/v1/taxa/3" )
        .expect( res => {
          const taxon = res.body.results[0];
          expect( taxon.taxon_schemes_count ).to.eq( 1 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns taxa", done => {
      request( app ).get( "/v1/taxa?id=3" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].id ).to.eq( 3 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxa with id above a value", done => {
      request( app ).get( "/v1/taxa?id_above=10&order_by=id" )
        .expect( res => {
          expect( res.body.results[0].id ).to.be.above( 10 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxa with id above a value", done => {
      request( app ).get( "/v1/taxa?id_below=10&order_by=id&order=desc" )
        .expect( res => {
          expect( res.body.results[0].id ).to.be.below( 10 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "returns taxa with id above a value", done => {
      request( app ).get( "/v1/taxa?q=los" )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results[0].matched_term ).to.eq( "Los lobos" );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can return only ids", done => {
      request( app ).get( "/v1/taxa?id=1&only_id=true&per_page=1" )
        .expect( res => {
          const result = res.body.results[0];
          expect( _.keys( result ).length ).to.eq( 1 );
          expect( _.keys( result )[0] ).to.eq( "id" );
          expect( result.id ).to.eq( 1 );
        } ).expect( 200, done );
    } );
  } );
} );
