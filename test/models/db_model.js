const { expect } = require( "chai" );
const Identification = require( "../../lib/models/identification" );
const User = require( "../../lib/models/user" );
const DBModel = require( "../../lib/models/db_model" );

describe( "DBModel", ( ) => {
  describe( "fetchBelongsTo", ( ) => {
    it( "fetches belongs to associations with ids", done => {
      const o = { user_id: 123 };
      DBModel.fetchBelongsTo( [o], User, ( ) => {
        expect( o.user ).to.not.be.undefined;
        expect( o.user.id ).to.eq( 123 );
        expect( o.user_id ).to.eq( 123 );
        done( );
      } );
    } );

    it( "fetches belongs to associations with objects", done => {
      const o = { user: { id: 123, existingData: "something" } };
      DBModel.fetchBelongsTo( [o], User, ( ) => {
        expect( o.user ).to.not.be.undefined;
        expect( o.user.id ).to.eq( 123 );
        expect( o.user.existingData ).to.eq( "something" );
        expect( o.user_id ).to.be.undefined;
        done( );
      } );
    } );

    it( "returns postgresql errors", done => {
      const o = { user_id: "not an integer" };
      DBModel.fetchBelongsTo( [o], User, err => {
        expect( err.message ).to.eq(
          "invalid input syntax for integer: \"not an integer\""
        );
        done( );
      } );
    } );
  } );

  describe( "fetchHasMany", ( ) => {
    it( "does nothing if there are no objects", done => {
      DBModel.fetchHasMany( [], User, "observation_id", { }, err => {
        expect( err ).to.be.undefined;
        done( );
      } );
    } );

    it( "does nothing if there are no valid IDs", done => {
      DBModel.fetchHasMany( [{ id: null }], Identification, "observation_id", { }, err => {
        expect( err ).to.be.undefined;
        done( );
      } );
    } );

    it( "fetches has many associations", done => {
      const o = { id: 1 };
      DBModel.fetchHasMany( [o], Identification, "observation_id", { }, ( ) => {
        expect( o.identifications.length ).to.eq( 2 );
        done( );
      } );
    } );

    it( "postgresql errors", done => {
      const o = { id: "not an integer" };
      DBModel.fetchHasMany( [o], Identification, "observation_id", { }, err => {
        expect( err.message ).to.eq(
          "invalid input syntax for integer: \"not an integer\""
        );
        done( );
      } );
    } );
  } );
} );
