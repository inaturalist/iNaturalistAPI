"use strict";
var expect = require( "chai" ).expect,
    sinon = require( "sinon" ),
    _ = require( "lodash" ),
    Observation = require( "../../lib/models/observation" );

describe( "Observation", ( ) => {

  describe( "removeUnviewableComments", ( ) => {
    let comments;
    beforeEach( function( ) {
      comments = [
        { id: 1 },
        {
          id: 2,
          flags: [ {
            flag: "spam",
            user: { id: 101 }
          }]
        },
        {
          id: 3,
          flags: [ {
            flag: "spam",
            user: { id: 102 }
          }]
        }
      ];
    });

    it( "non-logged-in users see no spam comments", ( ) => {
      const obs = new Observation( { comments } );
      expect( obs.comments.length ).to.eq( 1 );
    });

    it( "logged-in users see their spam comments", ( ) => {
      // user 101
      let obs = new Observation( { comments },
        { userSession: { user_id: 101 } } );
      expect( obs.comments.length ).to.eq( 2 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [ 1, 2 ] );

      // user 102
      obs = new Observation( { comments },
        { userSession: { user_id: 102 } } );
      expect( obs.comments.length ).to.eq( 2 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [ 1, 3 ] );
    });

    it( "admins see all comments", ( ) => {
      const obs = new Observation( { comments },
        { userSession: { user_id: 1, isAdmin: true } } );
      expect( obs.comments.length ).to.eq( 3 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [ 1, 2, 3 ] );
    });

    it( "site curators see all comments", ( ) => {
      const obs = new Observation( { comments },
        { userSession: { user_id: 1, isCurator: true } } );
      expect( obs.comments.length ).to.eq( 3 );
      expect( _.map( obs.comments, "id" ).sort( ) ).to.deep.eq( [ 1, 2, 3 ] );
    });

  });

  describe( "preloadAllAssociations", ( ) => {
    it( "returns preload errors", done => {
      var stub = sinon.stub( Observation, "preloadAnnotationControlledTerms" ).
        callsFake( ( p, cb ) =>  cb( "terms-error" ) );
      Observation.preloadAllAssociations([ ], null, e => {
        expect( e ).to.eq( "terms-error" );
        stub.restore( );
        done( );
      });
    });
  });

});
