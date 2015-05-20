var expect = require( "chai" ).expect,
    config = require( "../config_example" ),
    InaturalistAPI = require( "../lib/inaturalist_api" ),
    req;

function stubRequest( ) {
  return { query: { filtered: { filter: [ ] } } };
}

describe( "InaturalistAPI", function( ) {
  beforeEach( function( ) {
    stubReq = stubRequest( );
    global.config = config;
  });

  describe( "filterDateRange", function( ) {
    it( "filters observed_on by date", function( ) {
      InaturalistAPI.filterDateRange(
        stubReq, { d1: "2015-01-01", d2: "2015-02-02" } );
      expect( stubReq.query.filtered.filter[0].range.observed_on ).to.eql(
        { gte: new Date( "2015-01-01" ), lte: new Date( "2015-02-02" ) });
    });

    it( "uses todays date if either date is in the future ", function( ) {
      InaturalistAPI.filterDateRange( stubReq, { d1: "2100-01-01" } );
      expect( new Date( ) -
        stubReq.query.filtered.filter[0].range.observed_on.gte).to.below( 2 );
      InaturalistAPI.filterDateRange( stubReq, { d2: "2100-01-01" } );
      expect( new Date( ) -
        stubReq.query.filtered.filter[0].range.observed_on.lte).to.below( 2 );
    });

    it( "does nothing without an invalid date", function( ) {
      InaturalistAPI.filterDateRange( stubReq, { d1: "nonsense" } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });

    it( "does nothing without a d1 or d2", function( ) {
      InaturalistAPI.filterDateRange( stubReq, { } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });
  });

  describe( "filterUser", function( ) {
    it( "filters by user.id", function( ) {
      InaturalistAPI.filterUser( stubReq, { user_id: 99 } );
      expect( stubReq.query.filtered.filter[0] ).to.eql(
        { term: { "user.id": 99 } });
    });

    it( "does nothing without a user_id", function( ) {
      InaturalistAPI.filterUser( stubReq, { } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });
  });

  describe( "filterProject", function( ) {
    it( "filters by project_id", function( ) {
      InaturalistAPI.filterProject( stubReq, { project_id: 88 } );
      expect( stubReq.query.filtered.filter[0] ).to.eql(
        { term: { "project_ids": 88 } });
    });

    it( "does nothing without a project_id", function( ) {
      InaturalistAPI.filterProject( stubReq, { } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });
  });

  describe( "filterTaxon", function( ) {
    it( "filters by taxon.ancestor_ids", function( ) {
      InaturalistAPI.filterTaxon( stubReq, { taxon_id: 77 } );
      expect( stubReq.query.filtered.filter[0] ).to.eql(
        { term: { "taxon.ancestor_ids": 77 } });
    });

    it( "does nothing without a taxon_id", function( ) {
      InaturalistAPI.filterTaxon( stubReq, { } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });
  });

  describe( "filterPlace", function( ) {
    it( "filters by place geometry", function( ) {
      InaturalistAPI.filterPlace( stubReq, { place_id: 66 } );
      expect( stubReq.query.filtered.filter[0].geo_shape ).to.eql({
         _cache: true, geojson: { indexed_shape: { id: 66,
          type: "place", index: global.config.elasticsearch.placeIndex,
          path: "geometry_geojson" } } });
    });

    it( "does nothing without a place_id", function( ) {
      InaturalistAPI.filterPlace( stubReq, { } );
      expect( stubReq ).to.eql( stubRequest( ) );
    });
  });

  describe( "defaultMapFilters", function( ) {
    it( "returns the proper default filters", function( ) {
      expect( InaturalistAPI.defaultMapFilters( ) ).to.eql(
        { filtered: { query: { match: { mappable: true } }, filter: [
          { not: { exists: { field: "private_location" } } } ] } });
    });
  });

  describe( "defaultMapFields", function( ) {
    it( "returns the proper default select fields", function( ) {
      expect( InaturalistAPI.defaultMapFields( ) ).to.eql( [ "id", "location",
       "taxon.iconic_taxon_id", "captive", "quality_grade" ]);
    });
  });

  describe( "filterRequest", function( ) {
    it( "applies all the filters", function( ) {
      InaturalistAPI.filterRequest( stubReq, { user_id: 99, taxon_id: 77 } );
      expect( stubReq.query.filtered.filter[0] ).to.eql(
        { term: { "user.id": 99 } });
      expect( stubReq.query.filtered.filter[1] ).to.eql(
        { term: { "taxon.ancestor_ids": 77 } });
    });
  });

});
