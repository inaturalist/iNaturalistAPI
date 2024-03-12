const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const Taxon = require( "../../lib/models/taxon" );
const List = require( "../../lib/models/list" );
const ESModel = require( "../../lib/models/es_model" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "ESModel", ( ) => {
  describe( "fetchBelongsTo", ( ) => {
    it( "fetches belongs to associations with ids", done => {
      const o = { taxon_id: 1 };
      ESModel.fetchBelongsTo( [o], Taxon ).then( ( ) => {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon_id ).to.eq( 1 );
        done( );
      } );
    } );

    it( "fetches belongs to associations with ids", done => {
      const o = { taxon: { id: 1, existingData: "something" } };
      ESModel.fetchBelongsTo( [o], Taxon ).then( ( ) => {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon.existingData ).to.eq( "something" );
        expect( o.taxon_id ).to.be.undefined;
        done( );
      } );
    } );

    it( "returns errors", async ( ) => {
      const o = { list_id: 1 };
      await expect( ESModel.fetchBelongsTo( [o], List, { searchSlug: true } ) )
        .to.be.rejectedWith( Error );
    } );
  } );

  describe( "fetchInstancesByIDsObject", ( ) => {
    it( "returns an error if not given an object", async ( ) => {
      await expect( ESModel.fetchInstancesByIDsObject( null, Taxon, { } ) )
        .to.be.rejectedWith( Error );
    } );

    it( "fetches instances", async ( ) => {
      const instances = await ESModel.fetchInstancesByIDsObject( { 11: null }, Taxon, { } );
      expect( instances["11"].id ).to.eq( 11 );
      expect( instances["11"].name ).to.eq( "Junonia hierta" );
    } );
  } );

  describe( "searchHashReferencesPotentiallySensitiveFields", ( ) => {
    it( "returns false by default", ( ) => {
      expect( ESModel.searchHashReferencesPotentiallySensitiveFields( {
        query: { match_all: { } }
      } ) ).to.be.false;
    } );

    it( "returns true for filters on user.id", ( ) => {
      expect( ESModel.searchHashReferencesPotentiallySensitiveFields( {
        query: {
          bool: {
            filter: [{
              term: {
                "user.id": 1
              }
            }]
          }
        }
      } ) ).to.be.true;
    } );

    it( "returns true for filters on user.id.keyword", ( ) => {
      expect( ESModel.searchHashReferencesPotentiallySensitiveFields( {
        query: {
          bool: {
            filter: [{
              term: {
                "user.id.keyword": 1
              }
            }]
          }
        }
      } ) ).to.be.true;
    } );

    it( "returns true for references to private_* fields", ( ) => {
      expect( ESModel.searchHashReferencesPotentiallySensitiveFields( {
        query: {
          bool: {
            filter: [{
              term: {
                private_place_id: 1
              }
            }]
          }
        }
      } ) ).to.be.true;
    } );
  } );
} );
