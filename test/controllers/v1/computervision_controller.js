const { expect } = require( "chai" );
const sinon = require( "sinon" );
const Taxon = require( "../../../lib/models/taxon" );
const ComputervisionController = require( "../../../lib/controllers/v1/computervision_controller" );
const esClient = require( "../../../lib/es_client" );

describe( "ComputervisionController", ( ) => {
  let sandbox;
  let originalHumanTaxon;

  beforeEach( ( ) => {
    sandbox = sinon.createSandbox( );
    Taxon.homoSapiens ||= { };
    originalHumanTaxon = Taxon.homoSapiens;
    sandbox.stub( Taxon, "homoSapiens" ).value( {
      id: 99,
      ancestor_ids: []
    } );
  } );

  afterEach( ( ) => {
    Taxon.homoSapiens = originalHumanTaxon;
    sandbox.restore( );
  } );

  describe( "addRepresentativePhotos", ( ) => {
    it( "searches for similar photos to results", done => {
      const scoreImageSpy = sandbox.spy( esClient, "search" );
      ComputervisionController.addRepresentativePhotos( [{
        taxon: {
          id: 1,
          rank_level: 10
        }
      }], "embedding" );
      expect( scoreImageSpy ).to.have.been.called;
      done( );
    } );

    it( "does not search for photos similar to human", done => {
      const scoreImageSpy = sandbox.spy( esClient, "search" );
      Taxon.homoSapiens ||= { };
      sandbox.stub( Taxon, "homoSapiens" ).value( {
        id: 99
      } );
      ComputervisionController.addRepresentativePhotos( [{
        taxon: {
          id: 99,
          rank_level: 10
        }
      }], "embedding" );
      expect( scoreImageSpy ).not.to.have.been.called;
      done( );
    } );
  } );
} );
