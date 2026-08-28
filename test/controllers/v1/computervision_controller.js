const _ = require( "lodash" );
const { expect } = require( "chai" );
const sinon = require( "sinon" );
const Taxon = require( "../../../lib/models/taxon" );
const ComputervisionController = require( "../../../lib/controllers/v1/computervision_controller" );
const esClient = require( "../../../lib/es_client" );
const qdrantClient = require( "../../../lib/qdrant_client" );
const ObservationPreload = require( "../../../lib/models/observation_preload" );

describe( "ComputervisionController", ( ) => {
  let sandbox;
  let stubTaxon;
  let stubPhoto;
  let stubResults;

  beforeEach( ( ) => {
    sandbox = sinon.createSandbox( );
  } );

  afterEach( ( ) => {
    sandbox.restore( );
  } );

  describe( "addRepresentativePhotos", ( ) => {
    it( "does not search for photos similar to human", async ( ) => {
      const qdrantLookupSpy = sandbox.spy(
        ComputervisionController,
        "representativePhotosQdrant"
      );
      const elasticsearchLookupSpy = sandbox.spy(
        ComputervisionController,
        "representativePhotosElasticsearch"
      );
      await ComputervisionController.addRepresentativePhotos( [{
        taxon: Taxon.homoSapiens
      }], "embedding" );
      expect( qdrantLookupSpy ).not.to.have.been.called;
      expect( elasticsearchLookupSpy ).not.to.have.been.called;
    } );

    describe( "with lookup", ( ) => {
      beforeEach( ( ) => {
        stubTaxon = {
          id: 1,
          rank_level: 10,
          default_photo: { }
        };
        stubPhoto = {
          id: 100,
          url: "https://example.com/100/square.jpg"
        };
        stubResults = [{
          taxon: stubTaxon
        }];
        sandbox.stub( ObservationPreload, "assignObservationPhotoPhotos" )
          .callsFake( async representativeTaxonPhotos => {
            expect( representativeTaxonPhotos[0].photo_id ).to.eq( stubPhoto.id );
            _.each( representativeTaxonPhotos, tp => {
              tp.photo = stubPhoto;
            } );
          } );
      } );

      describe( "via Qdrant", ( ) => {
        beforeEach( ( ) => {
          sandbox.stub( qdrantClient, "connected" ).returns( true );
        } );

        it( "searches Qdrant for similar photos to results", async ( ) => {
          const qdrantQueryStub = sandbox.stub( qdrantClient, "query" ).returns( {
            points: [{
              payload: {
                photo_id: stubPhoto.id,
                ancestor_ids: [stubTaxon.id]
              }
            }]
          } );
          await ComputervisionController.addRepresentativePhotos( stubResults, "embedding" );
          expect( qdrantQueryStub ).to.have.been.called;
          expect( stubResults[0].taxon.representative_photo.id ).to.eq( stubPhoto.id );
          expect( stubResults[0].taxon.representative_photo.url ).to.eq( stubPhoto.url );
          expect( stubResults[0].taxon.representative_photo.medium_url ).to.eq(
            stubPhoto.url.replace( "/square.", "/medium." )
          );
        } );
      } );

      describe( "via Elasticsearch", ( ) => {
        beforeEach( ( ) => {
          sandbox.stub( qdrantClient, "connected" ).returns( false );
        } );

        it( "searches Elasticsearch for similar photos to results", async ( ) => {
          const esQueryStub = sandbox.stub( esClient, "search" ).returns( {
            hits: {
              hits: [{
                _source: {
                  photo_id: stubPhoto.id,
                  ancestor_ids: [stubTaxon.id]
                }
              }]
            }
          } );
          await ComputervisionController.addRepresentativePhotos( stubResults, "embedding" );
          expect( esQueryStub ).to.have.been.called;
          expect( stubResults[0].taxon.representative_photo.id ).to.eq( stubPhoto.id );
          expect( stubResults[0].taxon.representative_photo.url ).to.eq( stubPhoto.url );
          expect( stubResults[0].taxon.representative_photo.medium_url ).to.eq(
            stubPhoto.url.replace( "/square.", "/medium." )
          );
        } );
      } );
    } );
  } );
} );
