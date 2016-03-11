var expect = require( "chai" ).expect,
    Taxon = require( "../../lib/models/taxon" ),
    User = require( "../../lib/models/user" ),
    ESModel = require( "../../lib/models/es_model" );

describe( "ESModel", function( ) {
  describe( "fetchBelongsTo", function( ) {
    it( "fetchs belongs to associations with ids", function( done ) {
      var o = { taxon_id: 1 };
      ESModel.fetchBelongsTo([ o ], Taxon, null, function( ) {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon_id ).to.be.undefined;
        done( );
      });
    });

    it( "fetchs belongs to associations with ids", function( done ) {
      var o = { taxon: { id: 1, existingData: "something" } };
      ESModel.fetchBelongsTo([ o ], Taxon, null, function( ) {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon.existingData ).to.eq( "something" );
        expect( o.taxon_id ).to.be.undefined;
        done( );
      });
    });

    it( "returns errors", function( done ) {
      var o = { user_id: 1 };
      ESModel.fetchBelongsTo([ o ], User, null, function( err ) {
        expect( err.message ).to.include( "index_not_found_exception" );
        done( );
      });
    });
  });
});
