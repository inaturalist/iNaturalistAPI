var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    pgClient = require( "../lib/pg_client" ),
    esClient = require( "../lib/es_client" ),
    iNaturalistAPI = require( "../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "routes", function( ) {

  describe( "index", function( ) {
    it( "shows the app name", function( done ) {
      request( app ).get( "/" ).
        expect( "Content-Type", /text\/html/ ).
        expect( "iNaturalist API" ).
        expect( 200, done );
    });
  });

  describe( "observationsIndex", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/observations" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    })
  });

  describe( "observationsIdentifiers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/observations/identifiers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsObservers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/observations/observers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsSpeciesCounts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/observations/species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsShow", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/observations/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "taxaAutocomplete", function( ) {
    before( function( done ) {
      var taxa = [
        { index:  { _index: "test_taxa", _type: "taxon" } },
        { id: 1, names: [{ name_autocomplete: "Los", exact: "Los" }], observations_count: 50, is_active: true },
        { index:  { _index: "test_taxa", _type: "taxon" } },
        { id: 2, names: [{ name_autocomplete: "Los", exact: "Los" }], observations_count: 50, is_active: false },
        { index:  { _index: "test_taxa", _type: "taxon" } },
        { id: 3, names: [{ name_autocomplete: "Los lobos", exact: "Los lobos" }], observations_count: 100, is_active: true },
        { index:  { _index: "test_taxa", _type: "taxon" } },
        { id: 4, names: [{ name_autocomplete: "眼紋疏廣蠟蟬", exact: "眼紋疏廣蠟蟬" }], observations_count: 200, is_active: true },
      ];
      esClient.connection.bulk({
        index: "test_taxa",
        type: "taxon",
        body: taxa,
        refresh: true
      }, function( err, response ) {
        done( );
      });
    });

    it( "returns json", function( done ) {
      request( app ).get( "/taxa/autocomplete" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns returns matches, with exact results first", function( done ) {
      request( app ).get( "/taxa/autocomplete?q=los" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 30 );
          expect( res.body.total_results ).to.eq( 2 );
          expect( res.body.results.length ).to.eq( 2 );
          expect( res.body.results[ 0 ].matched_term ).to.eq( "Los" );
          expect( res.body.results[ 1 ].matched_term ).to.eq( "Los lobos" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "searches japanese characters", function( done ) {
      request( app ).get( "/taxa/autocomplete?q=眼紋疏廣蠟蟬" ).
        expect( function( res ) {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[ 0 ].matched_term ).to.eq( "眼紋疏廣蠟蟬" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "can return inactive taxa", function( done ) {
      request( app ).get( "/taxa/autocomplete?q=los&is_active=false" ).
        expect( function( res ) {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[ 0 ].id ).to.eq( 2 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "taxaShow", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/taxa/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "placesNearby", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/places/nearby" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "placesShow", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/places/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "validates format of IDs", function( done ) {
      request( app ).get( "/places/hawaii" ).
        expect( "Content-Type", /text\/html/ ).
        expect( "Error" ).expect( 400, done );
    });
  });

  describe( "tileserver", function( ) {
    describe( "taxon places", function( ) {
      it( "renders taxon place tiles", function( done ) {
        request( app ).get( "/taxon_places/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "taxon ranges", function( ) {
      it( "renders taxon range tiles", function( done ) {
        request( app ).get( "/taxon_ranges/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "places", function( ) {
      it( "renders place tiles", function( done ) {
        request( app ).get( "/places/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "summary", function( ) {
      it( "renders summary tiles", function( done ) {
        request( app ).get( "/summary/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "heatmap", function( ) {
      it( "renders heatmap tiles", function( done ) {
        request( app ).get( "/heatmap/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "colored_heatmap", function( ) {
      it( "renders colored_heatmap tiles", function( done ) {
        request( app ).get( "/colored_heatmap/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "points", function( ) {
      it( "renders points tiles", function( done ) {
        request( app ).get( "/points/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
  });

});
