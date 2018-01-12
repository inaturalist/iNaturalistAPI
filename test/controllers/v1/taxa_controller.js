const expect = require( "chai" ).expect;
const TaxonController = require( "../../../lib/controllers/v1/taxa_controller" );

describe( "TaxaController", ( ) => {

  describe( "replaceInactiveTaxaCounts", ( ) => {

    it( "replaces inactive taxa with their active counterparts", done => {
      const counts = [ { taxon_id: 10003, count: 100 } ];
      TaxonController.replaceInactiveTaxaCounts( counts, { }, ( err, newCounts ) => {
        expect( newCounts[0].taxon_id ).to.eq( 123 );
        expect( newCounts[0].count ).to.eq( 100 );
        done( );
      });
    });

    it( "does not replace inactive without active counterparts", done => {
      const counts = [
        { taxon_id: 10003, count: 100 },
        { taxon_id: 10004, count: 99 }
      ];
      TaxonController.replaceInactiveTaxaCounts( counts, { }, ( err, newCounts ) => {
        expect( newCounts.length ).to.eq( 2 );
        expect( newCounts[1].taxon_id ).to.eq( 10004 );
        expect( newCounts[1].count ).to.eq( 99 );
        done( );
      });
    });

    it( "can remove inactive without active counterparts", done => {
      const counts = [
        { taxon_id: 10003, count: 100 },
        { taxon_id: 10004, count: 99 }
      ];
      TaxonController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
        expect( newCounts.length ).to.eq( 1 );
        expect( newCounts[0].taxon_id ).to.eq( 123 );
        expect( newCounts[0].count ).to.eq( 100 );
        done( );
      });
    });

    it( "replaces inactive taxon with all results of a split", done => {
      const counts = [
        { taxon_id: 10005, count: 100 },
        { taxon_id: 3, count: 99 }
      ];
      TaxonController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
        expect( newCounts.length ).to.eq( 3 );
        expect( newCounts[0].taxon_id ).to.eq( 1 );
        // the replacements carry the same score as their original taxa
        expect( newCounts[0].count ).to.eq( 100 );
        expect( newCounts[1].taxon_id ).to.eq( 2 );
        expect( newCounts[1].count ).to.eq( 100 );
        expect( newCounts[2].taxon_id ).to.eq( 3 );
        expect( newCounts[2].count ).to.eq( 99 );
        done( );
      });
    });

    it( "does not replace existing scores when adding active taxa", done => {
      const counts = [
        { taxon_id: 1, count: 100 },
        { taxon_id: 10005, count: 20 }
      ];
      TaxonController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
        expect( newCounts.length ).to.eq( 2 );
        expect( newCounts[0].taxon_id ).to.eq( 1 );
        expect( newCounts[0].count ).to.eq( 100 );
        expect( newCounts[1].taxon_id ).to.eq( 2 );
        expect( newCounts[1].count ).to.eq( 20 );
        done( );
      });
    });

  });

});