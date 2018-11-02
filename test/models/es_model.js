const { expect } = require( "chai" );
const Taxon = require( "../../lib/models/taxon" );
const List = require( "../../lib/models/list" );
const ESModel = require( "../../lib/models/es_model" );

describe( "ESModel", ( ) => {
  describe( "fetchBelongsTo", ( ) => {
    it( "fetches belongs to associations with ids", done => {
      const o = { taxon_id: 1 };
      ESModel.fetchBelongsTo( [o], Taxon, { }, ( ) => {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon_id ).to.eq( 1 );
        done( );
      } );
    } );

    it( "fetches belongs to associations with ids", done => {
      const o = { taxon: { id: 1, existingData: "something" } };
      ESModel.fetchBelongsTo( [o], Taxon, { }, ( ) => {
        expect( o.taxon ).to.not.be.undefined;
        expect( o.taxon.id ).to.eq( 1 );
        expect( o.taxon.existingData ).to.eq( "something" );
        expect( o.taxon_id ).to.be.undefined;
        done( );
      } );
    } );

    it( "returns errors", done => {
      const o = { list_id: 1 };
      ESModel.fetchBelongsTo( [o], List, { }, err => {
        expect( err.message ).to.include( "index_not_found_exception" );
        done( );
      } );
    } );
  } );

  describe( "fetchInstancesByIDsObject", ( ) => {
    it( "returns an error if not given an object", done => {
      ESModel.fetchInstancesByIDsObject( null, Taxon, { }, err => {
        expect( err ).to.eq( "idsObject must be an object" );
        done( );
      } );
    } );

    it( "fetches instances", done => {
      ESModel.fetchInstancesByIDsObject( { 11: null }, Taxon, { }, ( err, instances ) => {
        expect( instances["11"].id ).to.eq( 11 );
        expect( instances["11"].name ).to.eq( "Junonia hierta" );
        done( );
      } );
    } );
  } );
} );
