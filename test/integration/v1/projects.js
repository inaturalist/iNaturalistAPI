var expect = require( "chai" ).expect,
    request = require( "supertest" ),
    _ = require( "underscore" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    app = iNaturalistAPI.server( );

describe( "Projects Routes", function( ) {

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/projects/1" ).
        expect( function( res ) {
          var project = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( project.id ).to.eq( 1 );
          expect( project.title ).to.eq( "Project One" );
        }
      ).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns an error if too many IDs are requested", function( done ) {
      var ids = [ ], count = 101;
      for( var i = 1 ; i <= count ; i++ ) {
        ids.push( i );
      }
      request( app ).get( "/v1/projects/" + ids.join( "," ) ).
        expect( function( res ) {
          expect( res.body.error ).to.eq( "Too many IDs" );
          expect( res.body.status ).to.eq( 422 );
        }).expect( "Content-Type", /json/ ).expect( 422, done );
    });
  });

  describe( "autocomplete", function( ) {
    it( "returns an empty response if not given a query", function( done ) {
      request( app ).get( "/v1/projects/autocomplete" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 0 );
          expect( res.body.total_results ).to.eq( 0 );
          expect( res.body.results.length ).to.eq( 0 );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    it( "returns partial matches", function( done ) {
      request( app ).get( "/v1/projects/autocomplete?q=proj" ).
        expect( function( res ) {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 2 );
          expect( res.body.total_results ).to.eq( 2 );
          res.body.results = _.sortBy( res.body.results, function( r ) {
            return r.id;
          });
          expect( res.body.results[0].title ).to.eq( "Project One" );
          expect( res.body.results[1].title ).to.eq( "Project Two" );
        }).expect( "Content-Type", /json/ ).expect( 200, done );
    });
  });
});
