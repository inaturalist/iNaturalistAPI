const { expect } = require( "chai" );
const Taxon = require( "../lib/models/taxon" );
const apiUtil = require( "../lib/api_util" );

describe( "apiUtil", ( ) => {
  describe( "lookupInstance", ( ) => {
    it( "looks up instances", done => {
      const req = { query: { taxon_id: 999 }, inat: { } };
      apiUtil.lookupInstance( req, "taxon_id", Taxon.findByID, "taxon" )
        .then( t => {
          expect( t.id ).to.eq( 999 );
          done( );
        } );
    } );

    it( "returns an error if they don't exist", done => {
      const req = { query: { taxon_id: 1000 }, inat: { } };
      apiUtil.lookupInstance( req, "taxon_id", Taxon.findByID, "taxon" )
        .catch( err => {
          expect( err.custom_message ).to.eq( "Unknown taxon_id 1000" );
          done( );
        } );
    } );
  } );
} );
