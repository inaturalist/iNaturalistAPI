var expect = require( "chai" ).expect,
    _ = require( "underscore" ),
    esClient = require( "../../lib/es_client" ),
    Taxon = require( "../../lib/models/taxon" ),
    t, p;

describe( "Taxon", function( ) {

  before( function( ) {
    t = new Taxon({
      id: 123,
      names: [
        { name: "BestEnglish", locale: "en" },
        { name: "BestInAmerica", locale: "en", place_taxon_names: [
          { place_id: 111 }
        ] },
        { name: "BestInCalifornia", locale: "en", place_taxon_names: [
          { place_id: 222 }
        ] } ],
      statuses: [
        { place_id: null, iucn: 20 },
        { place_id: 111, iucn: 30 },
        { place_id: 222, iucn: 50 } ],
      listed_taxa: [
        { place_id: 111, establishment_means: "endemic" },
        { place_id: 444 },
        { place_id: 222, establishment_means: "introduced" } ]
    })
  });

  describe( "constructor", function( ) {
    it( "creates a Taxon", function( ) {
      var t = new Taxon({ id: 111, name: "itsname" });
      expect( t.id ).to.eq( 111 );
      expect( t.name ).to.eq( "itsname" );
    });
  });

  describe( "findByID", function( ) {
    before( function( done ) {
      esClient.connection.create({
        index: "test_taxa",
        type: "taxon",
        body: { id: 123, name: "itsname" },
        refresh: true,
      }, function( err, response ) {
        done( );
      });
    });

    it( "returns a taxon given an ID", function( done ) {
      Taxon.findByID( 123, function( err, t ) {
        expect( t.id ).to.eq( 123 );
        expect( t.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns a taxon from the cache", function( done ) {
      Taxon.findByID( 123, function( err, t ) {
        expect( t.id ).to.eq( 123 );
        expect( t.name ).to.eq( "itsname" );
        done( );
      });
    });

    it( "returns an error given a bad ID", function( done ) {
      Taxon.findByID( "notanint", function( err, t ) {
        expect( err ).to.deep.eq({ messsage: "invalid taxon_id", status: "422" });
        done( );
      });
    });

    it( "returns null given an unknown ID", function( done ) {
      Taxon.findByID( 5, function( err, t ) {
        expect( err ).to.eq( null );
        expect( t ).to.eq( false );
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
      expect( t.preferredCommonName({ locale: "de",
        defaultToEnglish: true }) ).to.eq( "BestEnglish" );
    });

    it( "returns the best name given a place", function( ) {
      p = { id: 222 };
      expect( t.preferredCommonName({ preferredPlace: p }) ).to.eq( "BestInCalifornia" );
    });

    it( "return the best name from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.preferredCommonName({ preferredPlace: p }) ).to.eq( "BestInAmerica" );
    });
  });

  describe( "preferredCommonName", function( ) {
    it( "returns the global status by default", function( ) {
      expect( t.conservationStatus( ) ).to.eq( "NT" );
    });

    it( "returns the status given a place", function( ) {
      p = { id: 222 };
      expect( t.conservationStatus( p ) ).to.eq( "CR" );
    });

    it( "returns the status from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.conservationStatus( p ) ).to.eq( "VU" );
    });

    it( "skips least concerns", function( ) {
      // 20 is still OK
      var t2 = new Taxon({ statuses: [{ iucn: 20 }] });
      expect( t2.conservationStatus( ) ).to.eq( "NT" );
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
      expect( t.establishmentMeans( p ) ).to.eq( "introduced" );
    });

    it( "returns the means from an ancestor place", function( ) {
      p = { id: 333, ancestor_place_ids: [ 111, 333 ] };
      expect( t.establishmentMeans( p ) ).to.eq( "endemic" );
    });

    it( "skips listed taxa without means", function( ) {
      p = { id: 444 };
      expect( t.establishmentMeans( ) ).to.be.undefined;
    });
  });

  describe( "prepareForResponse", function( ) {
    it( "skips listed taxa without means", function( ) {
      var t2 = _.extend( { }, t );
      t2.prepareForResponse( );
      expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
    });

    it( "defaults to strict locale check", function( ) {
      var t2 = _.extend( { }, t );
      t2.prepareForResponse({ locale: "de" });
      expect( t2.preferred_common_name ).to.be.undefined;
    });

    it( "can default to English", function( ) {
      var t2 = _.extend( { }, t );
      t2.prepareForResponse({ locale: "de", defaultToEnglish: true });
      expect( t2.preferred_common_name ).to.eq( "BestEnglish" );
    });
  });
});
