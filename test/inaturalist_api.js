var expect = require( "chai" ).expect,
    moment = require( "moment" ),
    _ = require( "underscore" ),
    config = require( "../config_example" ),
    InaturalistAPI = require( "../lib/inaturalist_api" ),
    req, Q;

describe( "InaturalistAPI", function( ) {
  beforeEach( function( ) {
    global.config = config;
  });

  describe( "elasticResults", function( ) {
    it( "filters by user.id", function( done ) {
      var eq = InaturalistAPI.elasticResults( { query: { } }, "observations", function( err, res ) {
        // not testing anything yet
        done( );
      });
    });
  });

  describe( "paramsToElasticQuery", function( ) {
    beforeEach( function( ) { Q = InaturalistAPI.paramsToElasticQuery; });

    it( "filters by query", function( ) {
      var eq = Q( { q: "search" } );
      expect( eq.where ).to.eql({ multi_match: {
        fields: [
          "taxon.names.name",
          "tags",
          "description",
          "place_guess"
        ],
        operator: "and",
        query: "search" } });
    });

    it( "queries names", function( ) {
      var eq = Q( { q: "search", search_on: "names" } );
      expect( eq.where.multi_match.fields ).to.
        eql([ "taxon.names.name" ]);
    });

    it( "queries tags", function( ) {
      var eq = Q( { q: "search", search_on: "tags" } );
      expect( eq.where.multi_match.fields ).to.
        eql([ "tags" ]);
    });

    it( "queries descriptions", function( ) {
      var eq = Q( { q: "search", search_on: "description" } );
      expect( eq.where.multi_match.fields ).to.
        eql([ "description" ]);
    });

    it( "queries places", function( ) {
      var eq = Q( { q: "search", search_on: "place" } );
      expect( eq.where.multi_match.fields ).to.
        eql([ "place_guess" ]);
    });

    it( "filters by user.id", function( ) {
      var eq = Q( { user_id: 99 } );
      expect( eq.where ).to.eql({ "user.id": 99 });
    });

    it( "filters by rank", function( ) {
      var eq = Q( { rank: "species" } );
      expect( eq.where ).to.eql({ "taxon.rank": "species" });
    });

    it( "filters by taxon_id", function( ) {
      var eq = Q( { taxon_id: 88 } );
      expect( eq.where ).to.eql({ "taxon.ancestor_ids": 88 });
    });

    it( "filters by taxon_ids", function( ) {
      var eq = Q( { taxon_ids: [ 3, 4, 5 ] } );
      expect( eq.where ).to.eql({ "taxon.ancestor_ids": [ 3, 4, 5 ] });
    });

    it( "filters by site_id", function( ) {
      var eq = Q( { site_id: 22 } );
      expect( eq.where ).to.eql({ site_id: 22 });
    });

    it( "filters by place_id", function( ) {
      var eq = Q( { place_id: 23 } );
      expect( eq.where ).to.eql({ place_ids: 23 });
    });

    it( "filters by id_please", function( ) {
      var eq = Q( { has: [ "id_please" ] } );
      expect( eq.where ).to.eql({ id_please: true });
    });

    it( "filters by out_of_range", function( ) {
      var eq = Q( { out_of_range: "true" } );
      expect( eq.where ).to.eql({ out_of_range: true });
    });

    it( "filters by mappable true", function( ) {
      var eq = Q( { mappable: "true" } );
      expect( eq.where ).to.eql({ mappable: true });
    });

    it( "filters by mappable false", function( ) {
      var eq = Q( { mappable: "false" } );
      expect( eq.where ).to.eql({ mappable: false });
    });

    it( "filters by captive true", function( ) {
      var eq = Q( { captive: "true" } );
      expect( eq.where ).to.eql({ captive: true });
    });

    it( "filters by captive false", function( ) {
      var eq = Q( { captive: "false" } );
      expect( eq.where ).to.eql({ captive: false });
    });

    it( "filters by license", function( ) {
      var eq = Q( { license: "cc-by" } );
      expect( eq.where ).to.eql({ license_code: "cc-by" });
    });

    it( "filters by photo license", function( ) {
      var eq = Q( { photo_license: "cc-by-nc" } );
      expect( eq.where ).to.eql({ "photos.license_code": "cc-by-nc" });
    });

    it( "filters by sound license", function( ) {
      var eq = Q( { sound_license: "cc-by-sa" } );
      expect( eq.where ).to.eql({ "sounds.license_code": "cc-by-sa" });
    });

    it( "filters by day", function( ) {
      var eq = Q( { day: 6 } );
      expect( eq.where ).to.eql({ "observed_on_details.day": 6 });
    });

    it( "filters by month", function( ) {
      var eq = Q( { month: 7 } );
      expect( eq.where ).to.eql({ "observed_on_details.month": 7 });
    });

    it( "filters by year", function( ) {
      var eq = Q( { year: 2008 } );
      expect( eq.where ).to.eql({ "observed_on_details.year": 2008 });
    });

    it( "filters by created_on", function( ) {
      var eq = Q( { created_on: "10-11-2009" } );
      expect( eq.where ).to.eql({
        "created_at_details.day": 11,
        "created_at_details.month": 10,
        "created_at_details.year": 2009 });
    });

    it( "filters by project_id", function( ) {
      var eq = Q( { project_id: 3 } );
      expect( eq.where ).to.eql({ project_ids: 3 });
    });

    it( "filters by project_ids", function( ) {
      var eq = Q( { project_ids: [ 4, 5 ] } );
      expect( eq.where ).to.eql({ project_ids: [ 4, 5 ] });
    });

    it( "filters by lrank", function( ) {
      var eq = Q( { lrank: "family" } );
      expect( eq.where ).to.eql({ range: {
        "taxon.rank_level": { from: 30, to: 100 }}});
    });

    it( "filters by hrank", function( ) {
      var eq = Q( { hrank: "class" } );
      expect( eq.where ).to.eql({ range: {
        "taxon.rank_level": { from: 0, to: 50 }}});
    });

    it( "filters by quality grade except 'any'", function( ) {
      var eq = Q( { quality_grade: "research" } );
      expect( eq.where ).to.eql({ quality_grade: "research" });
      var eq = Q( { quality_grade: "any" } );
      expect( eq.where ).to.eql({ });
    });

    it( "filters by identifications most_agree", function( ) {
      var eq = Q( { identifications: "most_agree" } );
      expect( eq.where ).to.eql({ identifications_most_agree: true });
    });

    it( "filters by identifications some_agree", function( ) {
      var eq = Q( { identifications: "some_agree" } );
      expect( eq.where ).to.eql({ identifications_some_agree: true });
    });

    it( "filters by identifications most_disagree", function( ) {
      var eq = Q( { identifications: "most_disagree" } );
      expect( eq.where ).to.eql({ identifications_most_disagree: true });
    });

    //
    // Filters
    //

    it( "filters by bounding box", function( ) {
      var eq = Q( { nelat: 1, nelng: 2, swlat: 3, swlng: 4 } );
      expect( eq.filters ).to.eql([{ envelope: { geojson: {
        nelat: 1, nelng: 2, swlat: 3, swlng: 4 }}}]);
    });

    it( "filters by point and radius", function( ) {
      var eq = Q( { lat: 10, lng: 20, radius: 30 } );
      expect( eq.filters ).to.eql([{ geo_distance: {
        distance: "30km", location: { lat: 10, lon: 20 }}}]);
    });

    it( "defaults to a radius of 10k", function( ) {
      var eq = Q( { lat: 10, lng: 20 } );
      expect( eq.filters ).to.eql([{ geo_distance: {
        distance: "10km", location: { lat: 10, lon: 20 }}}]);
    });

    it( "filters by photos", function( ) {
      var eq = Q( { has: [ "photos" ] } );
      expect( eq.filters ).to.eql([{ exists: { field: "photos.url" } }]);
    });

    it( "filters by sounds", function( ) {
      var eq = Q( { has: [ "sounds" ] } );
      expect( eq.filters ).to.eql([{ exists: { field: "sounds" } }]);
    });

    it( "filters by geo", function( ) {
      var eq = Q( { has: [ "geo" ] } );
      expect( eq.filters ).to.eql([{ exists: { field: "geojson" } }]);
    });

    it( "filters by iconic_taxa", function( ) {
      var eq = Q( { iconic_taxa: [ "Animalia", "Plantae" ] } );
      expect( eq.where ).to.eql({ "taxon.iconic_taxon_id": [ "1", "47126" ] });
    });

    it( "filters by unknown iconic_taxa", function( ) {
      var eq = Q( { iconic_taxa: [ "Animalia", "Plantae", "unknown" ] } );
      expect( eq.filters ).to.eql([{ bool: { should: [
        { terms: { "taxon.iconic_taxon_id": [ "1", "47126" ] } },
        { missing: { field: "taxon.iconic_taxon_id" }}]}}]);
    });

    it( "filters observed_on by date", function( ) {
      var eq = Q( { d1: "2015-01-01", d2: "2015-02-02" } );
      expect( eq.filters[0].or[0].and[0].range.observed_on ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: "2015-02-02T00:00:00+00:00" });
      expect( eq.filters[0].or[0].and[1].exists.field ).to.eql( "time_observed_at" );
      expect( eq.filters[0].or[1].and[0].range.observed_on ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: "2015-02-02T23:59:59+00:00" });
      expect( eq.filters[0].or[1].and[1].missing.field ).to.eql( "time_observed_at" );
    });

    it( "does nothing without an invalid date", function( ) {
      var eq = Q( { d1: "nonsense" } );
      expect( eq.where ).to.eql( { } );
      expect( eq.filters ).to.eql( [ ] );
      var eq = Q( { d2: "nonsense" } );
      expect( eq.where ).to.eql( { } );
      expect( eq.filters ).to.eql( [ ] );
    });

    it( "defaults d2 to today", function( ) {
      var eq = Q( { d1: "2015-01-01" } );
      expect( eq.filters[0].or[0].and[0].range.observed_on ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: moment.utc( ).format( ) });
      expect( eq.filters[0].or[0].and[1].exists.field ).to.eql( "time_observed_at" );
      expect( eq.filters[0].or[1].and[0].range.observed_on ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: moment.utc( ).endOf( "day" ).format( ) });
      expect( eq.filters[0].or[1].and[1].missing.field ).to.eql( "time_observed_at" );
    });

    it( "defaults d1 to 1800-1-1", function( ) {
      var eq = Q( { d2: "2015-02-02" } );
      expect( eq.filters[0].or[0].and[0].range.observed_on ).to.eql(
        { gte: "1800-01-01T00:00:00+00:00",
          lte: "2015-02-02T00:00:00+00:00" });
      expect( eq.filters[0].or[0].and[1].exists.field ).to.eql( "time_observed_at" );
      expect( eq.filters[0].or[1].and[0].range.observed_on ).to.eql(
        { gte: "1800-01-01T00:00:00+00:00",
          lte: "2015-02-02T23:59:59+00:00" });
      expect( eq.filters[0].or[1].and[1].missing.field ).to.eql( "time_observed_at" );
    });

    it( "filters by not_in_project", function( ) {
      var eq = Q( { not_in_project: [ 6, 7 ] } );
      expect( eq.filters ).to.eql([{ not: { term: { project_ids: [ 6, 7 ] }}}]);
    });

    it( "filters by identified true", function( ) {
      var eq = Q( { identified: "true" } );
      expect( eq.filters ).to.eql([{ exists: { field: "taxon" } }]);
    });

    it( "filters by identified false", function( ) {
      var eq = Q( { identified: "false" } );
      expect( eq.filters ).to.eql([{ not: { exists: { field: "taxon" } } }]);
    });

    it( "filters by updated_since", function( ) {
      var eq = Q( { updated_since: "2015-01-02T00:00:00+00:00" } );
      expect( eq.filters ).to.eql([{ range: {
        updated_at: { gte: "2015-01-02T00:00:00+00:00" } } }]);
    });

    it( "ignores bad updated_since values", function( ) {
      var eq = Q( { updated_since: "nonsense" } );
      expect( eq.filters ).to.eql([ ]);
    });

    it( "filters by id_above", function( ) {
      var eq = Q( { id_above: 51 } );
      expect( eq.filters ).to.eql([{ range: { id: { gt: 51 } } }]);
    });

    //
    // Sorting
    //
    it( "sorts by created_at desc by default", function( ) {
      var eq = Q({ });
      expect( eq.sort ).to.eql( { created_at: "desc"} );
    });

    it( "allows sorting asc", function( ) {
      var eq = Q({ order: "asc" });
      expect( eq.sort ).to.eql( { created_at: "asc"} );
    });

    it( "sorts by observed_on", function( ) {
      var eq = Q({ order_by: "observed_on" });
      expect( eq.sort ).to.eql( { observed_on: "desc"} );
    });

    it( "sorts by species_guess", function( ) {
      var eq = Q({ order_by: "species_guess" });
      expect( eq.sort ).to.eql( { species_guess: "desc"} );
    });

    it( "sorts by votes", function( ) {
      var eq = Q({ order_by: "votes" });
      expect( eq.sort ).to.eql( { cached_votes_total: "desc"} );
    });

    it( "sorts by id", function( ) {
      var eq = Q({ order_by: "id" });
      expect( eq.sort ).to.eql( { id: "desc"} );
    });

  });

  describe( "defaultMapFields", function( ) {
    it( "returns the proper default select fields", function( ) {
      expect( InaturalistAPI.defaultMapFields( ) ).to.eql( [ "id", "location",
       "taxon.iconic_taxon_id", "captive", "quality_grade" ]);
    });
  });

  describe( "fetchIDs", function( ) {
    it( "requires an ID", function( done ) {
      InaturalistAPI.fetchIDs({ params: { } }, "obs", function( err, rsp ) {
        expect( err ).to.eql({ messsage: "ID missing", status: "400" });
        done( );
      });
    });

    it( "requires an integer ID", function( done ) {
      InaturalistAPI.fetchIDs({ params: { id: "what" } }, "obs", function( err, rsp ) {
        expect( err ).to.eql({ messsage: "invalid ID", status: "400" });
        done( );
      });
    });

    it( "allows comma separated IDs", function( done ) {
      InaturalistAPI.fetchIDs({ params: { id: _.range( 55 ).join(",") } }, "obs", function( err, rsp ) {
        expect( err ).to.eql({ messsage: "too many IDs", status: "400" });
        done( );
      });
    });

    it( "fetches results", function( done ) {
      InaturalistAPI.fetchIDs({ params: { id: "1" } }, "obs", function( err, rsp ) {
        // this needs some work - fixtures, etc
        done( );
      });
    });
  });

  describe( "lookupTaxon", function( ) {
    it( "fetches results", function( done ) {
      InaturalistAPI.lookupTaxon( 1, function( err, rsp ) {
        // this needs some work - fixtures, etc
        done( );
      });
    });
  });

});
