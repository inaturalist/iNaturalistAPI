var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    iNaturalistAPI = require( "../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "routes", function( ) {

  describe( "index", function( ) {
    it( "redirects to /v1/docs", function( done ) {
      request( app ).get( "/" ).
        expect( "Location", "/v1/docs", done);
    });
  });

  describe( "docs", function( ) {
    it( "redirects to /v1/docs", function( done ) {
      request( app ).get( "/docs" ).
        expect( "Location", "/v1/docs", done);
    });
  });

  describe( "swaggerRedirect", function( ) {
    it( "redirects to /v1/swagger.json", function( done ) {
      request( app ).get( "/swagger.json" ).
        expect( "Location", "/v1/swagger.json", done);
    });
  });

  describe( "swaggerJSON", function( ) {
    it( "renders the swagger JSON file", function( done ) {
      request( app ).get( "/v1/swagger.json" ).
        expect( function( res ) {
          expect( res.body.swagger ).to.eq( "2.0" );
          expect( res.body.info.title ).to.eq( "iNaturalist API" );
        }).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsIndex", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "looks up observation users from the DB", function( done ) {
      request( app ).get( "/v1/observations" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 3 );
        expect( res.body.results[ 0 ].id ).to.eq( 2 );
        expect( res.body.results[ 0 ].user.id ).to.eq( 5 );
        expect( res.body.results[ 0 ].user.login ).to.be.undefined;
        expect( res.body.results[ 1 ].id ).to.eq( 1 );
        expect( res.body.results[ 1 ].user.id ).to.eq( 123 );
        // login comes from the DB
        expect( res.body.results[ 1 ].user.login ).to.eq( "a-user" );
        expect( res.body.results[ 1 ].user.name ).to.eq( "A User" );
      }).expect( 200, done );
    });

    it( "finds observations by user login", function( done ) {
      request( app ).get( "/v1/observations?user_id=a-user" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "finds observations by user_id", function( done ) {
      request( app ).get( "/v1/observations?user_id=123" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "looks up projects by slug", function( done ) {
      request( app ).get( "/v1/observations?projects=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "looks up not_in_project by slug", function( done ) {
      request( app ).get( "/v1/observations?not_in_project=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 2 );
      }).expect( 200, done );
    });

    it( "looks up multiple projects", function( done ) {
      request( app ).get( "/v1/observations?projects[]=nonsense&projects[]=a-project" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
      }).expect( 200, done );
    });

    it( "ignores missing projects", function( done ) {
      request( app ).get( "/v1/observations?projects=nonsense" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 3 );
      }).expect( 200, done );
    });

    it( "strips place guess from obscured observations", function( done ) {
      request( app ).get( "/v1/observations?geoprivacy=obscured_private" ).
      expect( function( res ) {
        expect( res.body.total_results ).to.eq( 1 );
        expect( res.body.results[ 0 ].id ).to.eq( 333 );
        expect( res.body.results[ 0 ].place_guess ).to.be.undefined;
      }).expect( 200, done );
    });
  });

  describe( "observationsIdentifiers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/identifiers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsObservers", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/observers" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "accepts an order_by param", function( done ) {
      request( app ).get( "/v1/observations/observers?order_by=species_count" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "includes user name field", function( ) {
      request( app ).get( "/v1/observations/observers" ).expect( function( res ) {
        expect( res.results[0].user.name ).to.eq( "A User" );
      });
    });
  });

  describe( "observationsSpeciesCounts", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/species_counts" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "observationsShow", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/observations/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "taxaAutocomplete", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns returns matches, with exact results first", function( done ) {
      request( app ).get( "/v1/taxa/autocomplete?q=los" ).
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
      request( app ).get( "/v1/taxa/autocomplete?q=眼紋疏廣蠟蟬" ).
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
          expect( res.body.total_results ).to.eq( 3 );
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

  describe( "taxaShow", function( ) {
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
  });

  describe( "placesNearby", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/places/nearby" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns standard and community places", function( done ) {
      request( app ).get( "/v1/places/nearby?swlat=41&swlng=-73&nelat=43&nelng=-70" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 3 );
          expect( res.body.total_results ).to.eq( 3 );
          expect( res.body.results.standard.length ).to.eq( 2 );
          expect( res.body.results.community.length ).to.eq( 1 );
          expect( res.body.results.standard[ 0 ].name ).to.eq( "United States" );
          expect( res.body.results.standard[ 1 ].name ).to.eq( "Massachusetts" );
          expect( res.body.results.community[ 0 ].name ).to.eq( "Community" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "placesShow", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/places/1" ).
        expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "validates format of IDs", function( done ) {
      request( app ).get( "/v1/places/hawaii" ).
        expect( function( res ) {
          expect( res.body.error ).to.eq( "Error" );
          expect( res.body.status ).to.eq( 422 );
        }).expect( "Content-Type", /json/ ).expect( 422, done );
    });

    it( "returns an error if too many IDs are requested", function( done ) {
      var ids = [ ], count = 21;
      for( var i = 1 ; i <= count ; i++ ) {
        ids.push( i );
      }
      request( app ).get( "/v1/places/" + ids.join( "," ) ).
        expect( function( res ) {
          expect( res.body.error ).to.eq( "Too many IDs" );
          expect( res.body.status ).to.eq( 422 );
        }).expect( "Content-Type", /json/ ).expect( 422, done );
    });
  });

  describe( "placesAutocomplete", function( ) {
    it( "returns an empty response if not given a query", function( done ) {
      request( app ).get( "/v1/places/autocomplete" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns partial matches", function( done ) {
      request( app ).get( "/v1/places/autocomplete?q=a-place" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "a-place" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "filters by geo", function( done ) {
      request( app ).get( "/v1/places/autocomplete?q=a-place&geo=true" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 0 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "sorts by bbox area", function( done ) {
      // TODO: this isn't testing anything
      request( app ).get( "/v1/places/autocomplete?q=un&order_by=area" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results[0].name ).to.eq( "United States" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });

  describe( "tileserver", function( ) {
    describe( "taxon places", function( ) {
      it( "renders taxon place tiles", function( done ) {
        request( app ).get( "/v1/taxon_places/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "taxon ranges", function( ) {
      it( "renders taxon range tiles", function( done ) {
        request( app ).get( "/v1/taxon_ranges/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "places", function( ) {
      it( "renders place tiles", function( done ) {
        request( app ).get( "/v1/places/1/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "summary", function( ) {
      it( "renders summary tiles", function( done ) {
        request( app ).get( "/v1/summary/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "heatmap", function( ) {
      it( "renders heatmap tiles", function( done ) {
        request( app ).get( "/v1/heatmap/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "colored_heatmap", function( ) {
      it( "renders colored_heatmap tiles", function( done ) {
        request( app ).get( "/v1/colored_heatmap/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
    describe( "points", function( ) {
      it( "renders points tiles", function( done ) {
        request( app ).get( "/v1/points/1/0/0.png" ).
        expect( "Content-Type", /png/ ).
        expect( 200, done );
      });
    });
  });
});
