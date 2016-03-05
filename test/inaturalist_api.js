var expect = require( "chai" ).expect,
    esClient = require( "../lib/es_client" ),
    Taxon = require( "../lib/models/taxon" ),
    InaturalistAPI = require( "../lib/inaturalist_api" ),
    testHelper = require( "../lib/test_helper" );

describe( "InaturalistAPI", function( ) {
  before( function( done ) {
    testHelper.projectWithRules( done );
  });

  it( "uses the test ENV", function( ) {
    expect( process.env.NODE_ENV ).to.eq( "test" );
  });

  describe( "methodValidationError", function( ) {
    it( "returns an error if ID is missing", function( ) {
      expect( InaturalistAPI.methodValidationError({ params: { } })).
        to.deep.eq({ messsage: "ID missing", status: 422 });
    });

    it( "returns an error if ID is malformed", function( ) {
      expect( InaturalistAPI.methodValidationError({ params: { id: "string" } })).
        to.deep.eq({ messsage: "invalid ID", status: 422 });
      expect( InaturalistAPI.methodValidationError({ params: { id: "1200--" } })).
        to.deep.eq({ messsage: "invalid ID", status: 422 });
      expect( InaturalistAPI.methodValidationError({ params: { id: "1" } })).
        to.be.undefined;
      expect( InaturalistAPI.methodValidationError({ params: { id: "1,4,100" } })).
        to.be.undefined;
    });
  });

  describe( "lookupInstance", function( ) {
    before( function( done ) {
      esClient.connection.create({
        index: "test_taxa",
        type: "taxon",
        body: { id: 999, name: "ataxon" },
        refresh: true
      }, function( ) {
        done( );
      });
    });

    it( "looks up instances", function( done ) {
      var req = { query: { taxon_id: 999 } };
      InaturalistAPI.lookupInstance( req, "taxon_id", Taxon.findByID, function( err, t ) {
        expect( err ).to.be.null;
        expect( t.id ).to.eq( 999 );
        done( );
      });
    });

    it( "returns an error if they don't exist", function( done ) {
      var req = { query: { taxon_id: 1000 } };
      InaturalistAPI.lookupInstance( req, "taxon_id", Taxon.findByID, function( err, t ) {
        expect( err ).to.deep.eq({ error: "Unknown taxon_id 1000", status: 422 });
        expect( t ).to.be.undefined;
        done( );
      });
    });
  });
});
