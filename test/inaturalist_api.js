const { expect } = require( "chai" );
const Taxon = require( "../lib/models/taxon" );
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

  describe( "lookupInstance", ( ) => {
    it( "looks up instances", done => {
      const req = { query: { taxon_id: 999 } };
      InaturalistAPI.lookupInstance( req, "taxon_id", Taxon.findByID, ( err, t ) => {
        expect( err ).to.be.null;
        expect( t.id ).to.eq( 999 );
        done( );
      } );
    } );

    it( "returns an error if they don't exist", done => {
      const req = { query: { taxon_id: 1000 } };
      InaturalistAPI.lookupInstance( req, "taxon_id", Taxon.findByID, ( err, t ) => {
        expect( err ).to.deep.eq( { error: "Unknown taxon_id 1000", status: 422 } );
        expect( t ).to.be.undefined;
        done( );
      } );
    } );
  } );

  describe( "lookupPreferredPlaceMiddleware", ( ) => {
    it( "looks up preferred_place by preferred_place_id", done => {
      const req = { query: { preferred_place_id: 1, locale: "zh-LP" }, inat: {} };
      InaturalistAPI.lookupPreferredPlaceMiddleware( req, null, () => {
        expect( req.inat.preferredPlace.id ).to.eq( 1 );
        done( );
      } );
    } );

    // Disabling lookupPreferredPlaceMiddleware because it's causing some people
    // to see names in the wrong language, e.g. zh-HK names when requesting
    // en-HK. Some more context at
    // https://github.com/inaturalist/iNaturalistAPI/issues/89#issuecomment-740142965.
    // ~~kueda 20201207
    // it( "looks up preferred_place by locale", done => {
    //   const req = { query: { locale: "zh-LP" }, inat: {} };
    //   InaturalistAPI.lookupPreferredPlaceMiddleware( req, null, () => {
    //     expect( req.inat.preferredPlace.id ).to.eq( 511 );
    //     done( );
    //   } );
    // } );

    // it( "does not set preferred_place if locale is malformed", done => {
    //   const req = { query: { locale: "zh-LP-LP" }, inat: {} };
    //   InaturalistAPI.lookupPreferredPlaceMiddleware( req, null, () => {
    //     expect( req.inat.preferredPlace ).to.be.undefined;
    //     done( );
    //   } );
    // } );

    // it( "does not set preferred_place if country is not found", done => {
    //   const req = { query: { locale: "zh-LPB" } };
    //   InaturalistAPI.lookupPreferredPlaceMiddleware( req, null, () => {
    //     expect( req.inat ).to.be.undefined;
    //     done( );
    //   } );
    // } );
  } );
} );
