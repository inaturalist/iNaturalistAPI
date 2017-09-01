var expect = require( "chai" ).expect,
    Taxon = require( "../../lib/models/taxon" ),
    t, p;

describe( "Taxon", function( ) {

  before( function( ) {
    t = new Taxon({
      id: 123,
      names: [
        { name: "BestEnglish", locale: "en", position: 0 },
        { name: "BestInAmerica", locale: "en", position: 1, place_taxon_names: [
          { place_id: 111, position: 0 }
        ] },
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
        { place_id: 222, iucn: 50 } ],
      listed_taxa: [
        { place_id: 111, establishment_means: "endemic" },
        { place_id: 444 },
        { place_id: 222, establishment_means: "introduced" } ]
    });
  });

  describe( "constructor", function( ) {
    it( "creates a Taxon", function( ) {
      var tax = new Taxon({ id: 111, name: "itsname" });
      expect( tax.id ).to.eq( 111 );
      expect( tax.name ).to.eq( "itsname" );
    });
  });

  describe( "findByID", function( ) {
    it( "returns a taxon given an ID", function( done ) {
      Taxon.findByID( 123, function( err, tax ) {
        expect( tax.id ).to.eq( 123 );
        expect( tax.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns a taxon from the cache", function( done ) {
      Taxon.findByID( 123, function( err, tax ) {
        expect( tax.id ).to.eq( 123 );
        expect( tax.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns an error given a bad ID", function( done ) {
      Taxon.findByID( "notanint", function( err ) {
        expect( err ).to.deep.eq({ messsage: "invalid taxon_id", status: 422 });
        done( );
      });
    });

    it( "returns null given an unknown ID", function( done ) {
      Taxon.findByID( 55555, function( err, tax ) {
        expect( err ).to.eq( null );
        expect( tax ).to.eq( null );
        done( );
      });
    });
  });

  describe( "preferredCommonName", function( ) {
    it( "returns the first name given a locale", function( ) {
      expect( t.preferredCommonName({ locale: "en" }) ).to.eq( "BestEnglish" );
    });

    it( "defaults to en", function( ) {
      expect( t.preferredCommonName( ) ).to.eq( "BestEnglish" );
    });

    it( "defaults to strict locale check", function( ) {
      expect( t.preferredCommonName({ locale: "de" }) ).to.be.undefined;
    });

    it( "can fallback to English", function( ) {
      expect( t.preferredCommonName({ locale: "de", defaultToEnglish: true }) ).to.eq( "BestEnglish" );
    });

    it( "returns the best name given a place", function( ) {
      p = { id: 222 };
      expect( t.preferredCommonName({ preferredPlace: p }) ).to.eq( "BestInCalifornia" );
    });

    it( "returns the best name given a place regardless of locale", function( ) {
      p = { id: 222 };
      expect( t.preferredCommonName({ locale: "de", preferredPlace: p }) ).to.eq( "BestInCalifornia" );
    });

    it( "return the best name from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.preferredCommonName({ preferredPlace: p }) ).to.eq( "BestInAmerica" );
    });
  });

  describe( "conservationStatus", function( ) {
    it( "returns the global status by default", function( ) {
      expect( t.conservationStatus( ) ).to.deep.eq({ place_id: null, iucn: 20 });
    });

    it( "returns the status given a place", function( ) {
      p = { id: 222 };
      expect( t.conservationStatus( p ) ).to.deep.eq({ place_id: 222, iucn: 50 });
    });

    it( "returns the status from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.conservationStatus( p ) ).to.deep.eq({ place_id: 111, iucn: 30 });
    });

    it( "skips least concerns", function( ) {
      // 20 is still OK
      var t2 = new Taxon({ statuses: [{ iucn: 20 }] });
      expect( t2.conservationStatus( ) ).to.deep.eq({ iucn: 20 });
      // 10 is not threatened enough
      t2 = new Taxon({ statuses: [{ iucn: 10 }] });
      expect( t2.conservationStatus( ) ).to.be.undefined;
    });
  });

  describe( "establishmentMeans", function( ) {
    it( "needs a place", function( ) {
      expect( t.establishmentMeans( ) ).to.be.undefined;
    });

    it( "returns the means given a place", function( ) {
      p = { id: 222 };
      expect( t.establishmentMeans( p ) ).to.deep.eq({ place_id: 222, establishment_means: "introduced" });
    });

    it( "returns the means from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.establishmentMeans( p ) ).to.deep.eq({ place_id: 111, establishment_means: "endemic" });
    });

    it( "skips listed taxa without means", function( ) {
      p = { id: 444 };
      expect( t.establishmentMeans( ) ).to.be.undefined;
    });
  });

  describe( "prepareForResponse", function( ) {
    it( "skips listed taxa without means", function( ) {
      var t2 = new Taxon( t );
      t2.prepareForResponse( );
      expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
    });

    it( "defaults to strict locale check", function( ) {
      var t2 = new Taxon( t );
      t2.prepareForResponse({ locale: "de" });
      expect( t2.preferred_common_name ).to.be.undefined;
    });

    it( "can default to English", function( ) {
      var t2 = new Taxon( t );
      t2.prepareForResponse({ locale: "de", defaultToEnglish: true });
      expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
    });
  });
});
