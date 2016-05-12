var expect = require( "chai" ).expect,
    // sinon = require( "sinon" ),
    request = require( "supertest" ),
    // _ = require( "underscore" ),
    iNaturalistAPI = require( "../../../lib/inaturalist_api" ),
    // User = require( "../../../lib/models/user" ),
    app = iNaturalistAPI.server( );

describe( "Users", function( ) {

  describe( "show", function( ) {
    it( "returns json", function( done ) {
      request( app ).get( "/v1/users/5" ).
        expect( function( res ) {
          var user = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.per_page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( user.id ).to.eq( 5 );
          expect( user.login ).to.eq( "b-user" );
        }
      ).expect( "Content-Type", /json/ ).expect( 200, done );
    });

    // takes an id or a login
    it( "accepts a login in place of an ID", function( done ) {
      request( app ).get( "/v1/users/b-user" ).
        expect( function( res ) {
          var user = res.body.results[0];
          expect( user.id ).to.eq( 5 );
          expect( user.login ).to.eq( "b-user" );
        }).
        expect( "Content-Type", /json/ ).expect( 200, done );
    })
  });

});
