var expect = require( "chai" ).expect,
    Identification = require( "../../lib/models/identification" ),
    User = require( "../../lib/models/user" ),
    DBModel = require( "../../lib/models/db_model" );

describe( "DBModel", function( ) {
  describe( "fetchBelongsTo", function( ) {
    it( "fetches belongs to associations with ids", function( done ) {
      var o = { user_id: 123 };
      DBModel.fetchBelongsTo([ o ], User, function( ) {
        expect( o.user ).to.not.be.undefined;
        expect( o.user.id ).to.eq( 123 );
        expect( o.user_id ).to.eq( 123 );
        done( );
      });
    });

    it( "fetches belongs to associations with objects", function( done ) {
      var o = { user: { id: 123, existingData: "something" } };
      DBModel.fetchBelongsTo([ o ], User, function( ) {
        expect( o.user ).to.not.be.undefined;
        expect( o.user.id ).to.eq( 123 );
        expect( o.user.existingData ).to.eq( "something" );
        expect( o.user_id ).to.be.undefined;
        done( );
      });
    });

    it( "returns postgresql errors", function( done ) {
      var o = { user_id: "not an integer" };
      DBModel.fetchBelongsTo([ o ], User, function( err ) {
        expect( err.message ).to.eq(
          'invalid input syntax for integer: "not an integer"' );
        done( );
      });
    });
  });

  describe( "fetchHasMany", function( ) {
    it( "does nothing if there are no objects", function( done ) {
      DBModel.fetchHasMany([ ], User, "observation_id", { }, function( err ) {
        expect( err ).to.be.undefined;
        done( );
      });
    });

    it( "does nothing if there are no valid IDs", function( done ) {
      DBModel.fetchHasMany([{ id: null }], Identification, "observation_id", { }, function( err ) {
        expect( err ).to.be.undefined;
        done( );
      });
    });

    it( "fetches has many associations", function( done ) {
      var o = { id: 1 };
      DBModel.fetchHasMany([ o ], Identification, "observation_id", { }, function( ) {
        expect( o.identifications.length ).to.eq( 2 );
        done( );
      });
    });

    it( "postgresql errors", function( done ) {
      var o = { id: "not an integer" };
      DBModel.fetchHasMany([ o ], Identification, "observation_id", { }, function( err ) {
        expect( err.message ).to.eq(
          'invalid input syntax for integer: "not an integer"' );
        done( );
      });
    });
  });
});
