const { expect } = require( "chai" );
const UserSession = require( "../lib/user_session" );

describe( "UserSession", ( ) => {
  describe( "canViewExemplarIdentifications", ( ) => {
    it( "returns true for sessions in relevant test groups", ( ) => {
      const userSession = new UserSession( {
        test_groups: ["helpful-id-tips-reviewer", "helpful-id-tips"]
      } );
      expect( userSession.canViewExemplarIdentifications( ) ).to.be.true;
    } );

    it( "returns true for admin sessions", ( ) => {
      const userSession = new UserSession( {
        isAdmin: true
      } );
      expect( userSession.canViewExemplarIdentifications( ) ).to.be.true;
    } );

    it( "returns false for sessions not in all relevant test groups", ( ) => {
      const userSession = new UserSession( {
        test_groups: ["helpful-id-tips"]
      } );
      expect( userSession.canViewExemplarIdentifications( ) ).to.be.false;
    } );

    it( "returns false for sessions not in test groups", ( ) => {
      const userSession = new UserSession( );
      expect( userSession.canViewExemplarIdentifications( ) ).to.be.false;
    } );
  } );
} );
