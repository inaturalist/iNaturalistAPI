var expect = require( "chai" ).expect,
    sinon = require( "sinon" ),
    Observation = require( "../../lib/models/observation" );

describe( "Observation", function( ) {

  describe( "preloadAllAssociations", function( ) {
    it( "returns preload errors", function( done ) {
      var stub = sinon.stub( Observation, "preloadAnnotationControlledTerms" ).
        callsFake( function( p, cb ) {
          cb("terms-error");
        }
      );
      Observation.preloadAllAssociations([ ], null, function( e ) {
        expect( e ).to.eq( "terms-error" );
        stub.restore( );
        done( );
      });
    });

  });

});
