const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const Taxon = require( "../../lib/models/taxon" );

const { expect } = chai;
chai.use( chaiAsPromised );
let t;

describe( "Taxon", ( ) => {
  before( ( ) => {
    t = new Taxon( {
      id: 123,
      names: [
        {
          name: "BestEnglish",
          locale: "en",
          lexicon: "english",
          position: 0
        },
        {
          name: "BestInAmerica",
          locale: "en",
          lexicon: "english",
          position: 1,
          place_taxon_names: [
            { place_id: 111, position: 0 }
          ]
        },
        {
          name: "BestInCalifornia",
          locale: "en",
          lexicon: "english",
          position: 3,
          place_taxon_names: [
            { place_id: 222, position: 0 }
          ]
        },
        {
          name: "SecondBestInCalifornia",
          locale: "en",
          lexicon: "english",
          position: 2,
          place_taxon_names: [
            { place_id: 222, position: 1 }
          ]
        },
        {
          name: "BestSpanish",
          locale: "es",
          lexicon: "spanish",
          position: 4
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
    it( "returns a taxon given an ID", async ( ) => {
      const tax = await Taxon.findByID( 123 );
      expect( tax.id ).to.eq( 123 );
      expect( tax.name ).to.eq( "itsname" );
    } );

    it( "returns a taxon from the cache", async ( ) => {
      const tax = await Taxon.findByID( 123 );
      expect( tax.id ).to.eq( 123 );
      expect( tax.name ).to.eq( "itsname" );
    } );

    it( "returns an error given a bad ID", async ( ) => {
      await expect( Taxon.findByID( "notanint" ) ).to.be.rejectedWith( Error );
    } );

    it( "returns null given an unknown ID", async ( ) => {
      const tax = await Taxon.findByID( 55555 );
      expect( tax ).to.eq( null );
    } );
  } );

  describe( "preferredCommonName", ( ) => {
    it( "returns the first name given a locale", ( ) => {
      expect( t.preferredCommonName( { locale: "en" } ) ).to.eq( "BestEnglish" );
    } );

    it( "defaults to strict locale check", ( ) => {
      expect( t.preferredCommonName( { locale: "de" } ) ).to.be.null;
    } );

    it( "finds names in any locale", ( ) => {
      expect( t.preferredCommonName( { locale: "es" } ) ).to.eq( "BestSpanish" );
    } );

    it( "falls back to primary locales when given a sublocale", ( ) => {
      expect( t.preferredCommonName( { locale: "es-mx" } ) ).to.eq( "BestSpanish" );
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
      expect( t.preferredCommonName( { locale: "de", preferredPlace: p } ) ).to.be.null;
    } );

    it( "return the best name from an ancestor place", ( ) => {
      const p = { id: 333, ancestor_place_ids: [111, 333] };
      expect( t.preferredCommonName( { locale: "en", preferredPlace: p } ) ).to.eq( "BestInAmerica" );
    } );

    it( "does not return anything if the userSession requests no common names", ( ) => {
      const options = {
        locale: "en",
        userSession: {
          prefersCommonNames: false
        }
      };
      expect( t.preferredCommonName( options ) ).to.be.null;
    } );
  } );

  describe( "preferredCommonNames", ( ) => {
    it( "returns nothing without a userSession", ( ) => {
      expect( t.preferredCommonNames( { } ) ).to.be.null;
    } );

    it( "returns all taxonNames matching specified taxonNamePriorities", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "english",
          position: 0
        }, {
          lexicon: "spanish",
          position: 1
        }]
      };
      const preferredCommonNames = t.preferredCommonNames( { userSession } );
      expect( preferredCommonNames[0].name ).to.eq( "BestEnglish" );
      expect( preferredCommonNames[1].name ).to.eq( "BestSpanish" );
    } );

    it( "does not return anything if the userSession requests no common names", ( ) => {
      const userSession = {
        prefersCommonNames: false,
        taxonNamePriorities: [{
          lexicon: "english",
          position: 0
        }, {
          lexicon: "spanish",
          position: 1
        }]
      };
      expect( t.preferredCommonNames( { userSession } ) ).to.be.null;
    } );

    it( "returns names in the proper order", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "spanish",
          position: 0
        }, {
          lexicon: "english",
          position: 1
        }]
      };
      const preferredCommonNames = t.preferredCommonNames( { userSession } );
      expect( preferredCommonNames[0].name ).to.eq( "BestSpanish" );
      expect( preferredCommonNames[1].name ).to.eq( "BestEnglish" );
    } );

    it( "returns nothing for unmatched locales", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "german",
          position: 0
        }]
      };
      expect( t.preferredCommonNames( { userSession } ) ).to.be.empty;
    } );

    it( "uses the locale when preferred name lexicon is null", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: null,
          position: 0
        }]
      };
      expect( t.preferredCommonNames( { locale: "en", userSession } )[0].name ).to.eq( "BestEnglish" );
      expect( t.preferredCommonNames( { locale: "es", userSession } )[0].name ).to.eq( "BestSpanish" );
    } );

    it( "uses returns names in the right order when inferring locale", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "english",
          position: 0
        }, {
          lexicon: null,
          position: 1
        }]
      };
      // en
      expect( t.preferredCommonNames( { locale: "en", userSession } )[0].name ).to.eq( "BestEnglish" );
      expect( t.preferredCommonNames( { locale: "en", userSession } )[1].name ).to.eq( "BestEnglish" );
      // es
      expect( t.preferredCommonNames( { locale: "es", userSession } )[0].name ).to.eq( "BestEnglish" );
      expect( t.preferredCommonNames( { locale: "es", userSession } )[1].name ).to.eq( "BestSpanish" );
      // es-mx
      expect( t.preferredCommonNames( { locale: "es-mx", userSession } )[0].name ).to.eq( "BestEnglish" );
      expect( t.preferredCommonNames( { locale: "es-mx", userSession } )[1].name ).to.eq( "BestSpanish" );
    } );

    it( "returns the best name given a place", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "english",
          position: 0,
          place_id: 222
        }]
      };
      expect( t.preferredCommonNames( { locale: "en", userSession } )[0].name ).to.eq( "BestInCalifornia" );
    } );

    it( "does not return an exact place match when locale doesn't match", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "german",
          position: 0,
          place_id: 222
        }]
      };
      expect( t.preferredCommonNames( { locale: "de", userSession } ) ).to.be.empty;
    } );

    it( "return the best name from an ancestor place", ( ) => {
      const userSession = {
        taxonNamePriorities: [{
          lexicon: "english",
          position: 0,
          place_id: 333,
          ancestor_place_ids: [111, 333]
        }]
      };
      expect( t.preferredCommonNames( { locale: "en", userSession } )[0].name ).to.eq( "BestInAmerica" );
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

    it( "returns the means from an ancestor place when introduced", ( ) => {
      const p = { id: 333, ancestor_place_ids: [222, 333] };
      expect( t.establishmentMeans( p ) ).to.deep.eq( { place_id: 222, establishment_means: "introduced" } );
    } );

    it( "does not return the means from an ancestor place when endemic", ( ) => {
      const p = { id: 333, ancestor_place_ids: [111, 333] };
      expect( t.establishmentMeans( p ) ).to.not.eq( { place_id: 111, establishment_means: "endemic" } );
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
      expect( t2.preferred_common_name ).to.be.null;
    } );
  } );
} );
