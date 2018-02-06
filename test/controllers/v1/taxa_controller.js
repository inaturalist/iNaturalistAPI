const expect = require( "chai" ).expect;
const TaxaController = require( "../../../lib/controllers/v1/taxa_controller" );

describe( "TaxaController", ( ) => {

  describe( "search", ( ) => {
    it( "returns taxa", done => {
      TaxaController.search( { query: { id: "3" } }, ( e, r ) => {
        expect( r.total_results ).to.eq( 1 );
        expect( r.results[0].constructor.name ).to.eq( "Taxon" );
        expect( r.results[0].id ).to.eq( 3 );
        done( );
      });
    });

    it( "returns taxa with id above a value", done => {
      TaxaController.search( { query: { } }, ( e, r ) => {
        const totalResults = r.total_results;
        TaxaController.search( { query: { id_above: 10, order_by: "id" } }, ( e, r ) => {
          expect( totalResults - r.total_results ).to.be.above( 0 );
          expect( r.results[0].id ).to.be.above( 10 );
          done( );
        });
      });
    });

    it( "returns taxa with id below a value", done => {
      TaxaController.search( { query: { } }, ( e, r ) => {
        const totalResults = r.total_results;
        TaxaController.search( { query: { id_below: 10, order_by: "id", order: "desc" } }, ( e, r ) => {
          expect( totalResults - r.total_results ).to.be.above( 0 );
          expect( r.results[0].id ).to.be.below( 10 );
          done( );
        });
      });
    });

    it( "performs searches and returns matched_term", done => {
      TaxaController.search( { query: { q: "los" } }, ( e, r ) => {
        expect( r.total_results ).to.eq( 3 );
        expect( r.results[0].matched_term ).to.eq( "Los lobos" );
        done( );
      });
    });
  });

  describe( "replaceInactiveTaxaCounts", ( ) => {
    it( "replaces inactive taxa with their active counterparts", done => {
      const counts = [ { taxon_id: 10003, count: 100 } ];
      TaxaController.replaceInactiveTaxaCounts( counts, { }, ( err, newCounts ) => {
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
      TaxaController.replaceInactiveTaxaCounts( counts, { }, ( err, newCounts ) => {
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
      TaxaController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
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
      TaxaController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
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
      TaxaController.replaceInactiveTaxaCounts( counts, { removeInactive: true }, ( err, newCounts ) => {
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