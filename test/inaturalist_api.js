var expect = require( "chai" ).expect,
    moment = require( "moment" ),
    _ = require( "underscore" ),
    config = require( "../config_example" ),
    util = require( "../lib/util" ),
    InaturalistAPI = require( "../lib/inaturalist_api" ),
    Q = InaturalistAPI.paramsToElasticQuery,
    req;

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
    //
    // Queries
    //

    it( "queries multiple fields", function( ) {
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

    //
    // Filters
    //

    it( "filters by taxon_id", function( ) {
      var eq = Q( { taxon_id: 88 } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.ancestor_ids": [ 88 ] } }]);
    });

    it( "filters by taxon_ids", function( ) {
      var eq = Q( { taxon_ids: [ 3, 4, 5 ] } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.ancestor_ids": [ 3, 4, 5 ] } }]);
    });

    it( "filters by param values", function( ) {
      _.each([ { http_param: "rank", es_field: "taxon.rank" },
        { http_param: "user_id", es_field: "user.id" },
        { http_param: "taxon_name", es_field: "taxon.names.name" },
        { http_param: "day", es_field: "observed_on_details.day" },
        { http_param: "month", es_field: "observed_on_details.month" },
        { http_param: "year", es_field: "observed_on_details.year" },
        { http_param: "place_id", es_field: "place_ids" },
        { http_param: "site_id", es_field: "site_id" },
        { http_param: "license", es_field: "license_code" },
        { http_param: "photo_license", es_field: "photos.license_code" },
        { http_param: "sound_license", es_field: "sounds.license_code" }
      ], function( filter ) {
        var qp = { };
        // single values
        qp[ filter.http_param ] = "test";
        var eq = Q( qp );
        var f = { terms: { } };
        f.terms[ filter.es_field ] = [ "test" ];
        expect( eq.filters ).to.eql([ f ]);
        // multiple values
        qp[ filter.http_param ] = [ "test1", "test2" ];
        var eq = Q( qp );
        var f = { terms: { } };
        f.terms[ filter.es_field ] = [ "test1", "test2" ];
        expect( eq.filters ).to.eql([ f ]);
      });
    });

    it( "filters by booleans", function( ) {
      _.each([ { http_param: "introduced", es_field: "taxon.introduced" },
        { http_param: "threatened", es_field: "taxon.threatened" },
        { http_param: "native", es_field: "taxon.native" },
        { http_param: "endemic", es_field: "taxon.endemic" },
        { http_param: "id_please", es_field: "id_please" },
        { http_param: "out_of_range", es_field: "out_of_range" },
        { http_param: "mappable", es_field: "mappable" },
        { http_param: "verifiable", es_field: "verifiable" },
        { http_param: "captive", es_field: "captive" }
      ], function( filter ) {
        var qp = { };
        // true values
        qp[ filter.http_param ] = "true";
        var eq = Q( qp );
        var f = { terms: { } };
        f.terms[ filter.es_field ] = [ true ];
        expect( eq.filters ).to.eql([ f ]);
        // false values
        qp[ filter.http_param ] = "false";
        eq = Q( qp );
        f = { term: { } };
        f.term[ filter.es_field ] = false;
        expect( eq.filters ).to.eql([ f ]);
      });
    });

    it( "filters by attribute presence", function( ) {
      _.each([ { http_param: "photos", es_field: "photos.url" },
        { http_param: "sounds", es_field: "sounds" },
        { http_param: "geo", es_field: "geojson" },
        { http_param: "identified", es_field: "taxon" }
      ], function( filter ) {
        var qp = { };
        // true values
        qp[ filter.http_param ] = "true";
        var eq = Q( qp );
        var f = { exists: { field: filter.es_field } };
        expect( eq.filters ).to.eql([ f ]);
        // false values
        qp[ filter.http_param ] = "false";
        eq = Q( qp );
        expect( eq.filters ).to.eql([ { not: f } ]);
      });
    });

    it( "filters by observed_on", function( ) {
      var eq = Q( { observed_on: "10-11-2009" } );
      expect( eq.filters ).to.eql([
        { terms: { "observed_on_details.day": [ 11 ] } },
        { terms: { "observed_on_details.month": [ 10 ] } },
        { terms: { "observed_on_details.year": [ 2009 ] } }]);
    });

    it( "filters by on", function( ) {
      var eq = Q( { on: "10-11-2009" } );
      expect( eq.filters ).to.eql([
        { terms: { "observed_on_details.day": [ 11 ] } },
        { terms: { "observed_on_details.month": [ 10 ] } },
        { terms: { "observed_on_details.year": [ 2009 ] } }]);
    });

    it( "filters by created_on", function( ) {
      var eq = Q( { created_on: "10-11-2009" } );
      expect( eq.filters ).to.eql([
        { terms: { "created_at_details.day": [ 11 ] } },
        { terms: { "created_at_details.month": [ 10 ] } },
        { terms: { "created_at_details.year": [ 2009 ] } }]);
    });

    it( "filters by project_id", function( ) {
      var eq = Q( { project_id: 3 } );
      expect( eq.filters ).to.eql([{ terms: { project_ids: [ 3 ] } }]);
    });

    it( "filters by project_ids", function( ) {
      var eq = Q( { project_ids: [ 4, 5 ] } );
      expect( eq.filters ).to.eql([{ terms: { project_ids: [ 4, 5 ] } }]);
    });

    it( "filters by lrank", function( ) {
      var eq = Q( { lrank: "family" } );
      expect( eq.filters ).to.eql([{ range: {
        "taxon.rank_level": { gte: 30, lte: 100 }}}]);
    });

    it( "filters by hrank", function( ) {
      var eq = Q( { hrank: "class" } );
      expect( eq.filters ).to.eql([{ range: {
        "taxon.rank_level": { gte: 0, lte: 50 }}}]);
    });

    it( "filters by quality grade except 'any'", function( ) {
      var eq = Q( { quality_grade: "research" } );
      expect( eq.filters ).to.eql([{ terms: { quality_grade: [ "research" ] } }]);
      var eq = Q( { quality_grade: "any" } );
      expect( eq.filters ).to.eql([ ]);
    });

    it( "filters by identifications most_agree", function( ) {
      var eq = Q( { identifications: "most_agree" } );
      expect( eq.filters ).to.eql([{ terms: { identifications_most_agree: [ true ] } }]);
    });

    it( "filters by identifications some_agree", function( ) {
      var eq = Q( { identifications: "some_agree" } );
      expect( eq.filters ).to.eql([{ terms: { identifications_some_agree: [ true ] } }]);
    });

    it( "filters by identifications most_disagree", function( ) {
      var eq = Q( { identifications: "most_disagree" } );
      expect( eq.filters ).to.eql([{ terms: { identifications_most_disagree: [ true ] } }]);
    });

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

    it( "filters by iconic_taxa", function( ) {
      var eq = Q( { iconic_taxa: [ "Animalia", "Plantae" ] } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.iconic_taxon_id": [ "1", "47126" ] } }]);
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

    it( "filters by featured observation", function( ) {
      var eq = Q( { featured_observation_id: 8 } );
      expect( eq.filters ).to.eql([{ not: { term: { id: 8 }}}]);
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

    it( "filters by popular", function( ) {
      var eq = Q( { popular: "true" } );
      expect( eq.filters ).to.eql([{ range: { cached_votes_total: { gte: 1 } } }]);
      eq = Q( { popular: "false" } );
      expect( eq.filters ).to.eql([{ term: { cached_votes_total: 0 } }]);
    });

    it( "filters by id_above", function( ) {
      var eq = Q( { id_above: 51 } );
      expect( eq.filters ).to.eql([{ range: { id: { gt: 51 } } }]);
    });

    it( "filters by reviewed true", function( ) {
      var eq = Q( { reviewed: "true", viewer_id: 21 } );
      expect( eq.filters ).to.eql([{ terms: { reviewed_by: [ 21 ] } }]);
    });

    it( "filters by reviewed false", function( ) {
      var eq = Q( { reviewed: "false", viewer_id: 21 } );
      expect( eq.filters ).to.eql([{ not: { term: { reviewed_by: 21 }}}]);
    });

    it( "filters by geoprivacy", function( ) {
      var eq = Q( { geoprivacy: "whatever" } );
      expect( eq.filters ).to.eql([{ terms: { geoprivacy: [ "whatever" ] } }]);
    });

    it( "filters by geoprivacy open", function( ) {
      var eq = Q( { geoprivacy: "open" } );
      expect( eq.filters ).to.eql([{ not: { exists: { field: "geoprivacy" } } }]);
    });

    it( "filters by geoprivacy obscured_private", function( ) {
      var eq = Q( { geoprivacy: "obscured_private" } );
      expect( eq.filters ).to.eql([{ terms: { geoprivacy: [ "obscured", "private" ] } }]);
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
       "taxon.iconic_taxon_id", "captive", "quality_grade", "geoprivacy",
       "private_location" ]);
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

  describe( "observationsIndex", function( ) {
    it( "fetches results", function( done ) {
      InaturalistAPI.observationsIndex( { query: { } }, function( err, rsp ) {
        // this needs some work - fixtures, etc
        done( );
      });
    });
  });

});
