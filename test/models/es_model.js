var expect = require( "chai" ).expect,
    Taxon = require( "../../lib/models/taxon" ),
    List = require( "../../lib/models/list" ),
    ESModel = require( "../../lib/models/es_model" );

describe( "ESModel", function( ) {
  describe( "fetchBelongsTo", function( ) {
    it( "fetches belongs to associations with ids", function( done ) {
      var o = { taxon_id: 1 };
      ESModel.fetchBelongsTo([ o ], Taxon, { }, function( ) {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon_id ).to.eq( 1 );
        done( );
      });
    });

    it( "fetches belongs to associations with ids", function( done ) {
      var o = { taxon: { id: 1, existingData: "something" } };
      ESModel.fetchBelongsTo([ o ], Taxon, { }, function( ) {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon.existingData ).to.eq( "something" );
        expect( o.taxon_id ).to.be.undefined;
        done( );
      });
    });

    it( "returns errors", function( done ) {
      var o = { list_id: 1 };
      ESModel.fetchBelongsTo([ o ], List, { }, function( err ) {
        expect( err.message ).to.include( "index_not_found_exception" );
        done( );
      });
    });
  });
});
