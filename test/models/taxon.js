const { expect } = require( "chai" );
const Taxon = require( "../../lib/models/taxon" );

let t;

describe( "Taxon", ( ) => {
  before( ( ) => {
    t = new Taxon( {
      id: 123,
      names: [
        { name: "BestEnglish", locale: "en", position: 0 },
        {
          name: "BestInAmerica",
          locale: "en",
          position: 1,
          place_taxon_names: [
            { place_id: 111, position: 0 }
          ]
        },
        {
          name: "BestInCalifornia",
          locale: "en",
          position: 3,
          place_taxon_names: [
            { place_id: 222, position: 0 }
          ]
        },
        {
          name: "SecondBestInCalifornia",
          locale: "en",
          position: 2,
          place_taxon_names: [
            { place_id: 222, position: 1 }
          ]
        }
      ],
      statuses: [
        { place_id: null, iucn: 20 },
        { place_id: 111, iucn: 30 },
        { place_id: 222, iucn: 50 }],
      listed_taxa: [
        { place_id: 111, establishment_means: "endemic" },
        { place_id: 444 },
        { place_id: 222, establishment_means: "introduced" }]
    } );
  } );

  describe( "constructor", ( ) => {
    it( "creates a Taxon", ( ) => {
      const tax = new Taxon( { id: 111, name: "itsname" } );
      expect( tax.id ).to.eq( 111 );
      expect( tax.name ).to.eq( "itsname" );
    } );
  } );

  describe( "findByID", ( ) => {
    it( "returns a taxon given an ID", done => {
      Taxon.findByID( 123, ( err, tax ) => {
        expect( tax.id ).to.eq( 123 );
        expect( tax.name ).to.eq( "itsname" );
        done( );
      } );
    } );

    it( "returns a taxon from the cache", done => {
      Taxon.findByID( 123, ( err, tax ) => {
        expect( tax.id ).to.eq( 123 );
        expect( tax.name ).to.eq( "itsname" );
        done( );
      } );
    } );

    it( "returns an error given a bad ID", done => {
      Taxon.findByID( "notanint", err => {
        expect( err ).to.deep.eq( { messsage: "invalid taxon_id", status: 422 } );
        done( );
      } );
    } );

    it( "returns null given an unknown ID", done => {
      Taxon.findByID( 55555, ( err, tax ) => {
        expect( err ).to.eq( null );
        expect( tax ).to.eq( null );
        done( );
      } );
    } );
  } );

  describe( "preferredCommonName", ( ) => {
    it( "returns the first name given a locale", ( ) => {
      expect( t.preferredCommonName( { locale: "en" } ) ).to.eq( "BestEnglish" );
    } );

    it( "defaults to strict locale check", ( ) => {
      expect( t.preferredCommonName( { locale: "de" } ) ).to.be.undefined;
    } );

    it( "can fallback to English", ( ) => {
      expect( t.preferredCommonName( { locale: "de", defaultToEnglish: true } ) ).to.eq( "BestEnglish" );
    } );

    it( "returns the best name given a place", ( ) => {
      const p = { id: 222 };
      expect( t.preferredCommonName( { locale: "en", preferredPlace: p } ) ).to.eq( "BestInCalifornia" );
    } );

    it( "returns an exact place match even if locale doesn't match", ( ) => {
      const p = { id: 222 };
      expect( t.preferredCommonName( { locale: "de", preferredPlace: p } ) ).to.eq( "BestInCalifornia" );
    } );

    it( "does not returns an ancestor place match even if locale doesn't match", ( ) => {
      const p = { id: 333 }; // Should be a descendant of 111 North America
      expect( t.preferredCommonName( { locale: "de", preferredPlace: p } ) ).to.be.undefined;
    } );

    it( "return the best name from an ancestor place", ( ) => {
      const p = { id: 333, ancestor_place_ids: [111, 333] };
      expect( t.preferredCommonName( { locale: "en", preferredPlace: p } ) ).to.eq( "BestInAmerica" );
    } );
  } );

  describe( "conservationStatus", ( ) => {
    it( "returns the global status by default", ( ) => {
      expect( t.conservationStatus( ) ).to.deep.eq( { place_id: null, iucn: 20 } );
    } );

    it( "returns the status given a place", ( ) => {
      const p = { id: 222 };
      expect( t.conservationStatus( p ) ).to.deep.eq( { place_id: 222, iucn: 50 } );
    } );

    it( "returns the status from an ancestor place", ( ) => {
      const p = { id: 333, ancestor_place_ids: [111, 333] };
      expect( t.conservationStatus( p ) ).to.deep.eq( { place_id: 111, iucn: 30 } );
    } );

    it( "skips least concerns", ( ) => {
      // 20 is still OK
      let t2 = new Taxon( { statuses: [{ iucn: 20 }] } );
      expect( t2.conservationStatus( ) ).to.deep.eq( { iucn: 20 } );
      // 10 is not threatened enough
      t2 = new Taxon( { statuses: [{ iucn: 10 }] } );
      expect( t2.conservationStatus( ) ).to.be.null;
    } );
  } );

  describe( "establishmentMeans", ( ) => {
    it( "needs a place", ( ) => {
      expect( t.establishmentMeans( ) ).to.be.null;
    } );

    it( "returns the means given a place", ( ) => {
      const p = { id: 222 };
      expect( t.establishmentMeans( p ) ).to.deep.eq( { place_id: 222, establishment_means: "introduced" } );
    } );

    it( "returns the means from an ancestor place", ( ) => {
      const p = { id: 333, ancestor_place_ids: [111, 333] };
      expect( t.establishmentMeans( p ) ).to.deep.eq( { place_id: 111, establishment_means: "endemic" } );
    } );

    it( "skips listed taxa without means", ( ) => {
      const p = { id: 444 };
      expect( t.establishmentMeans( p ) ).to.be.undefined;
    } );
  } );

  describe( "prepareForResponse", ( ) => {
    it( "skips listed taxa without means", ( ) => {
      const t2 = new Taxon( t );
      t2.prepareForResponse( );
      // expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
      // TODO I'm not sure how the above tested anything related to listed taxa
    } );

    it( "defaults to strict locale check", ( ) => {
      const t2 = new Taxon( t );
      t2.prepareForResponse( { locale: "de" } );
      expect( t2.preferred_common_name ).to.be.undefined;
    } );

    it( "can default to English", ( ) => {
      const t2 = new Taxon( t );
      t2.prepareForResponse( { locale: "de", defaultToEnglish: true } );
      expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
    } );
  } );
} );
