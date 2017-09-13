var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    querystring = require( "querystring" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "Taxa", function( ) {

  describe( "autocomplete", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns matches, with all exact results first", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 30 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.length ).to.eq( 3 );
          expect( res.body.results[ 0 ].matched_term ).to.eq( "Los" );
          expect( res.body.results[ 1 ].matched_term ).to.eq( "Los" );
          expect( res.body.results[ 2 ].matched_term ).to.eq( "Los lobos" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "searches japanese characters", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=" + querystring.escape( "眼紋疏廣蠟蟬" ) ).
        expect( function( res ) {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[ 0 ].matched_term ).to.eq( "眼紋疏廣蠟蟬" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "can return inactive taxa", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los&is_active=false" ).
        expect( function( res ) {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[ 0 ].id ).to.eq( 2 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "can return all taxa", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los&is_active=any" ).
        expect( function( res ) {
          expect( res.body.total_results ).to.eq( 4 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns no more than 30 per page", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los&per_page=50" ).
        expect( function( res ) {
          expect( res.body.per_page ).to.eq( 30 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns default per_page of 30 if fewer than 1 were requested", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los&per_page=-1" ).
        expect( function( res ) {
          expect( res.body.per_page ).to.eq( 30 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/taxa/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "populates preferred means and status", function( done ) {
      request( app ).get( "/v1/taxa/1?preferred_place_id=432" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 1 );
          expect( taxon.conservation_status.status ).to.eq( "VU" );
          expect( taxon.conservation_status.place.id ).to.eq( 432 );
          expect( taxon.establishment_means.establishment_means ).to.eq( "endemic" );
          expect( taxon.establishment_means.place.id ).to.eq( 432 );
          expect( taxon.preferred_establishment_means ).to.eq( "endemic" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "populates conservation_statuses and listed_taxa", function( done ) {
      request( app ).get( "/v1/taxa/10001" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 10001 );
          expect( taxon.conservation_statuses.length ).to.eq( 1 );
          expect( taxon.conservation_statuses[0].place.name ).to.eq( "a-place" );
          expect( taxon.listed_taxa.length ).to.eq( 1 );
          expect( taxon.listed_taxa[0].place.name ).to.eq( "a-place" );
          expect( taxon.listed_taxa[0].list.title ).to.eq( "DetailsListedTaxonList" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "populates ancestors", function( done ) {
      request( app ).get( "/v1/taxa/3" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 3 );
          expect( taxon.ancestors.length ).to.eq( 2 );
          expect( taxon.ancestors[0].id ).to.eq( 1 );
          expect( taxon.ancestors[1].id ).to.eq( 2 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "populates children", function( done ) {
      request( app ).get( "/v1/taxa/2" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.id ).to.eq( 2 );
          expect( taxon.children.length ).to.eq( 1 );
          expect( taxon.children[0].id ).to.eq( 3 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns taxon_changes_count", function( done ) {
      request( app ).get( "/v1/taxa/3" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.taxon_changes_count ).to.eq( 1 );
        } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
    
    it( "returns taxon_schemes_count", function( done ) {
      request( app ).get( "/v1/taxa/3" ).
        expect( function( res ) {
          var taxon = res.body.results[0];
          expect( taxon.taxon_schemes_count ).to.eq( 1 );
        } ).expect( "Content-Type", /json/ ).expect( 200, done );
    } );
  });
});
