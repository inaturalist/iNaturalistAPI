const { expect } = require( "chai" );
const sinon = require( "sinon" );
const ComputervisionController = require( "../../../lib/controllers/v1/computervision_controller" );
const TaxaController = require( "../../../lib/controllers/v1/taxa_controller" );

describe( "TaxaController", ( ) => {
  describe( "replaceInactiveTaxa", ( ) => {
    it( "replaces inactive taxa with their active counterparts", done => {
      const counts = [{ taxon_id: 10003, count: 100 }];
      TaxaController.replaceInactiveTaxa( counts, { } ).then( r => {
        const { updatedObjects } = r;
        expect( updatedObjects[0].taxon_id ).to.eq( 123 );
        expect( updatedObjects[0].count ).to.eq( 100 );
        done( );
      } );
    } );

    it( "does not replace inactive without active counterparts", done => {
      const counts = [
        { taxon_id: 10003, count: 100 },
        { taxon_id: 10004, count: 99 }
      ];
      TaxaController.replaceInactiveTaxa( counts, { } ).then( r => {
        const { updatedObjects } = r;
        expect( updatedObjects.length ).to.eq( 2 );
        expect( updatedObjects[1].taxon_id ).to.eq( 10004 );
        expect( updatedObjects[1].count ).to.eq( 99 );
        done( );
      } );
    } );

    it( "can remove inactive without active counterparts", done => {
      const counts = [
        { taxon_id: 10003, count: 100 },
        { taxon_id: 10004, count: 99 }
      ];
      const opts = { removeInactive: true };
      TaxaController.replaceInactiveTaxa( counts, opts ).then( r => {
        const { updatedObjects } = r;
        expect( updatedObjects.length ).to.eq( 1 );
        expect( updatedObjects[0].taxon_id ).to.eq( 123 );
        expect( updatedObjects[0].count ).to.eq( 100 );
        done( );
      } );
    } );

    it( "replaces inactive taxon with all results of a split", done => {
      const counts = [
        { taxon_id: 10005, count: 100 },
        { taxon_id: 3, count: 99 }
      ];
      const opts = { removeInactive: true };
      TaxaController.replaceInactiveTaxa( counts, opts ).then( r => {
        const { updatedObjects } = r;
        expect( updatedObjects.length ).to.eq( 3 );
        expect( updatedObjects[0].taxon_id ).to.eq( 1 );
        // the replacements carry the same score as their original taxa
        expect( updatedObjects[0].count ).to.eq( 100 );
        expect( updatedObjects[1].taxon_id ).to.eq( 2 );
        expect( updatedObjects[1].count ).to.eq( 100 );
        expect( updatedObjects[2].taxon_id ).to.eq( 3 );
        expect( updatedObjects[2].count ).to.eq( 99 );
        done( );
      } );
    } );

    it( "does not replace existing scores when adding active taxa", done => {
      const counts = [
        { taxon_id: 1, count: 100 },
        { taxon_id: 10005, count: 20 }
      ];
      const opts = { removeInactive: true };
      TaxaController.replaceInactiveTaxa( counts, opts ).then( r => {
        const { updatedObjects } = r;
        expect( updatedObjects.length ).to.eq( 2 );
        expect( updatedObjects[0].taxon_id ).to.eq( 1 );
        expect( updatedObjects[0].count ).to.eq( 100 );
        expect( updatedObjects[1].taxon_id ).to.eq( 2 );
        expect( updatedObjects[1].count ).to.eq( 20 );
        done( );
      } );
    } );
  } );

  describe( "speciesCountsResponse", ( ) => {
    it( "includes all taxa by defaul", done => {
      const req = { query: { }, inat: { } };
      const leafCounts = [{ taxon_id: 1, count: 100 }, { taxon_id: 2, count: 99 }];
      TaxaController.speciesCountsResponse( req, leafCounts ).then( response => {
        expect( response.results.length ).to.eq( 2 );
        done( );
      } );
    } );

    it( "can filter by taxa in the vision model", done => {
      // stub CvC.modelContainsTaxonID to say only taxonID 1 is in the model
      sinon.stub( ComputervisionController, "modelContainsTaxonID" )
        .callsFake( taxonID => ( taxonID === 1 ) );
      const req = { query: { include_only_vision_taxa: true }, inat: { } };
      const leafCounts = [{ taxon_id: 1, count: 100 }, { taxon_id: 2, count: 99 }];
      TaxaController.speciesCountsResponse( req, leafCounts ).then( response => {
        expect( response.results.length ).to.eq( 1 );
        done( );
      } );
    } );
  } );
} );
