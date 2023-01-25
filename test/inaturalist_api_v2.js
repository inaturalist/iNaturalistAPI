const { expect } = require( "chai" );
const InaturalistAPIV2 = require( "../lib/inaturalist_api_v2" );

describe( "InaturalistAPI", ( ) => {
  describe( "targetFieldInSource", ( ) => {
    it( "throws an error if target is not a string", ( ) => {
      expect( ( ) => InaturalistAPIV2.targetFieldInSource( null, { } ) )
        .to.throw( Error );
    } );

    it( "throws an error if source is not an object", ( ) => {
      expect( ( ) => InaturalistAPIV2.targetFieldInSource( "test", null ) )
        .to.throw( Error );
    } );

    it( "does not throw an error if target is a string and source is an object", ( ) => {
      expect( ( ) => InaturalistAPIV2.targetFieldInSource( "test", { } ) )
        .not.to.throw( Error );
    } );

    it( "returns false if the target is not found", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one", { } ) )
        .to.be.false;
    } );

    it( "returns false if a composite target is not found", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one.two", { } ) )
        .to.be.false;
    } );

    it( "returns false if part of a composite target is not found", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one.two", { one: { three: "all" } } ) )
        .to.be.false;
    } );

    it( "returns 'all' if all fields are in the source", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one.two", { all: true } ) )
        .to.eq( "all" );
    } );

    it( "returns 'all' if a high level target is set to 'all'", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one.two", { one: "all" } ) )
        .to.eq( "all" );
    } );

    it( "returns the target fields if found", ( ) => {
      expect( InaturalistAPIV2.targetFieldInSource( "one.two", { one: { two: { three: "all" } } } ) )
        .to.deep.eq( { three: "all" } );
    } );
  } );
} );
