const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const Identification = require( "../../lib/models/identification" );
const User = require( "../../lib/models/user" );
const DBModel = require( "../../lib/models/db_model" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "DBModel", ( ) => {
  describe( "fetchBelongsTo", ( ) => {
    it( "fetches belongs to associations with ids", async ( ) => {
      const o = { user_id: 123 };
      await DBModel.fetchBelongsTo( [o], User );
      expect( o.user ).to.be.undefined;
      expect( o.user.id ).to.eq( 123 );
      expect( o.user_id ).to.eq( 123 );
    } );

    it( "fetches belongs to associations with objects", async ( ) => {
      const o = { user: { id: 123, existingData: "something" } };
      await DBModel.fetchBelongsTo( [o], User );
      expect( o.user ).to.not.be.undefined;
      expect( o.user.id ).to.eq( 123 );
      expect( o.user.existingData ).to.eq( "something" );
      expect( o.user_id ).to.be.undefined;
    } );

    it( "returns postgresql errors", async ( ) => {
      const o = { user_id: "not an integer" };
      await expect( DBModel.fetchBelongsTo( [o], User ) ).to.be.rejectedWith( Error );
    } );
  } );

  describe( "fetchHasMany", ( ) => {
    it( "does nothing if there are no objects", async ( ) => {
      await DBModel.fetchHasMany( [], User, "observation_id" );
    } );

    it( "does nothing if there are no valid IDs", async ( ) => {
      await DBModel.fetchHasMany( [{ id: null }], Identification, "observation_id" );
    } );

    it( "fetches has many associations", async ( ) => {
      const o = { id: 1 };
      await DBModel.fetchHasMany( [o], Identification, "observation_id" );
      expect( o.identifications.length ).to.eq( 3 );
    } );

    it( "postgresql errors", async ( ) => {
      const o = { id: "not an integer" };
      await expect( DBModel.fetchHasMany( [o], Identification, "observation_id" ) )
        .to.be.rejectedWith( Error );
    } );
  } );
} );
