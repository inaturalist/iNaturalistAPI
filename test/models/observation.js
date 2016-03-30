var expect = require( "chai" ).expect,
    sinon = require( "sinon" ),
    Observation = require( "../../lib/models/observation" );

describe( "Observation", function( ) {

  describe( "preloadAllAssociations", function( ) {
    it( "returns preload ID errors", function( done ) {
      var stub = sinon.stub( Observation, "preloadIdentifications", function( p, cb ) {
        cb("id-error");
      });
      Observation.preloadAllAssociations([ ], null, function( e ) {
        expect( e ).to.eq( "id-error" );
        stub.restore( );
        done( );
      });
    });

    it( "returns preload fave errors", function( done ) {
      var stub = sinon.stub( Observation, "preloadFaves", function( p, cb ) {
        cb("fave-error");
      });
      Observation.preloadAllAssociations([ ], null, function( e ) {
        expect( e ).to.eq( "fave-error" );
        stub.restore( );
        done( );
      });
    });
  });

});
