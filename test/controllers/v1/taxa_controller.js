const expect = require( "chai" ).expect;
const TaxonController = require( "../../../lib/controllers/v1/taxa_controller" );

describe( "TaxaController", ( ) => {

  describe( "replaceInactiveTaxaScores", ( ) => {

    it( "replaces inactive taxa with their active counterparts", done => {
      const scores = [ { taxon_id: 10003, score: 100 } ];
      TaxonController.replaceInactiveTaxaScores( scores, { }, ( err, newScores ) => {
        expect( newScores[0].taxon_id ).to.eq( 123 );
        expect( newScores[0].score ).to.eq( 100 );
        done( );
      });
    });

    it( "does not replace inactive without active counterparts", done => {
      const scores = [
        { taxon_id: 10003, score: 100 },
        { taxon_id: 10004, score: 99 }
      ];
      TaxonController.replaceInactiveTaxaScores( scores, { }, ( err, newScores ) => {
        expect( newScores.length ).to.eq( 2 );
        expect( newScores[1].taxon_id ).to.eq( 10004 );
        expect( newScores[1].score ).to.eq( 99 );
        done( );
      });
    });

    it( "can remove inactive without active counterparts", done => {
      const scores = [
        { taxon_id: 10003, score: 100 },
        { taxon_id: 10004, score: 99 }
      ];
      TaxonController.replaceInactiveTaxaScores( scores, { removeInactive: true }, ( err, newScores ) => {
        expect( newScores.length ).to.eq( 1 );
        expect( newScores[0].taxon_id ).to.eq( 123 );
        expect( newScores[0].score ).to.eq( 100 );
        done( );
      });
    });

  });

});