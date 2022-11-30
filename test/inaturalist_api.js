const { expect } = require( "chai" );
const InaturalistAPI = require( "../lib/inaturalist_api" );

describe( "InaturalistAPI", ( ) => {
  it( "uses the test ENV", ( ) => {
    expect( process.env.NODE_ENV ).to.eq( "test" );
  } );

  describe( "validateMultiIDParam", ( ) => {
    it( "returns an error if ID is missing", ( ) => {
      expect( InaturalistAPI.validateMultiIDParam( { params: { } } ) )
        .to.deep.eq( { messsage: "ID missing", status: 422 } );
    } );

    it( "returns an error if ID is malformed", ( ) => {
      expect( InaturalistAPI.validateMultiIDParam( { params: { id: "string" } } ) )
        .to.deep.eq( { messsage: "invalid ID", status: 422 } );
      expect( InaturalistAPI.validateMultiIDParam( { params: { id: "1200--" } } ) )
        .to.deep.eq( { messsage: "invalid ID", status: 422 } );
      expect( InaturalistAPI.validateMultiIDParam( { params: { id: "1" } } ) )
        .to.be.null;
      expect( InaturalistAPI.validateMultiIDParam( { params: { id: "1,4,100" } } ) )
        .to.be.null;
    } );
  } );
} );
