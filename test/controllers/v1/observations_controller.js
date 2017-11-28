var expect = require( "chai" ).expect,
    moment = require( "moment" ),
    _ = require( "underscore" ),
    observations = require( "inaturalistjs" ).observations,
    testHelper = require( "../../../lib/test_helper" ),
    Observation = require( "../../../lib/models/observation" ),
    Project = require( "../../../lib/models/project" ),
    List = require( "../../../lib/models/list" ),
    ObservationsController = require( "../../../lib/controllers/v1/observations_controller" ),
    eq;

var Q = function( params, callback ) {
  var inat = params.inat;
  delete params.inat;
  var queryString = _.reduce( params,
    function ( components, value, key ) {
      components.push( key + "=" + (value ? encodeURIComponent( value ) : "") );
      return components;
    }, [ ] ).join( "&" );
  ObservationsController.reqToElasticQuery({ query: params, inat:inat,
    _parsedUrl: { query: queryString }}, callback );
};

describe( "ObservationsController", function( ) {
  it( "uses the test ENV", function( ) {
    expect( process.env.NODE_ENV ).to.eq( "test" );
  });

  it( "creates", function( done ) {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "create", Observation, done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "update", Observation, done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "delete", done );
  });

  it( "faves", function( done ) {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "fave", Observation, done );
  });

  it( "unfaves", function( done ) {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "unfave", Observation, done );
  });

  it( "reviews", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "review", done );
  });

  it( "unreviews", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "unreview", done );
  });

  it( "sets quality metrics", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "setQualityMetric", done );
  });

  it( "deletes quality metrics", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "deleteQualityMetric", done );
  });

  it( "calls viewed_updates", function( done ) {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "viewedUpdates", done );
  });

  describe( "reqToElasticQuery", function( ) {
    it( "can apply params from project rules", function( done ) {
      Project.findByID( 543, function( err, p ) {
        Q( { inat: { apply_project_rules_for: p } }, function( e, q ) {
          expect( q.filters ).to.deep.include({ terms: { place_ids: [ 222, 333 ] }});
          expect( q.filters ).to.deep.include({ terms: { "taxon.ancestor_ids": [ 444, 555, 876, 987 ] }});
          expect( q.filters ).to.deep.include({ term: { captive: false }});
          expect( q.filters ).to.deep.include({ exists: { field: "photos.url" }});
          expect( q.filters ).to.deep.include({ exists: { field: "sounds" }});
          expect( q.filters ).to.deep.include({ exists: { field: "geojson" }});
          expect( q.filters ).to.deep.include({ exists: { field: "taxon" }});
          // plus a complicated date filter
          done( );
        });
      });
    });

    it( "can apply inverse project rules", function( done ) {
      Project.findByID( 543, function( err, p ) {
        Q( { inat: { not_matching_project_rules_for: p } }, function( e, q ) {
          expect( q.grouped_inverse_filters ).to.deep.include({ terms: { place_ids: [ 222, 333 ] }});
          expect( q.grouped_inverse_filters ).to.deep.include({ terms: { "taxon.ancestor_ids": [ 444, 555, 876, 987 ] }});
          expect( q.grouped_inverse_filters ).to.deep.include({ term: { captive: false }});
          expect( q.grouped_inverse_filters ).to.deep.include({ exists: { field: "photos.url" }});
          expect( q.grouped_inverse_filters ).to.deep.include({ exists: { field: "sounds" }});
          expect( q.grouped_inverse_filters ).to.deep.include({ exists: { field: "geojson" }});
          expect( q.grouped_inverse_filters ).to.deep.include({ exists: { field: "taxon" }});
          // plus a complicated date filter
          done( );
        });
      });
    });

    it( "queries a list's taxon_ids", function( done ) {
      List.findByID( 999, function( err, l ) {
        Q( { inat: { list: l } }, function( e, q ) {
          expect( q.filters ).to.deep.include({ terms: { "taxon.ancestor_ids": [ 876, 987 ] }});
          done( );
        });
      });
    });

    //
    // Queries
    //

    it( "queries multiple fields", function( ) {
      Q( { q: "search" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ multi_match: {
        fields: [
          "taxon.names.name",
          "tags",
          "description",
          "place_guess"
        ],
        operator: "and",
        query: "search" } }]);
    });

    it( "queries names", function( ) {
      Q( { q: "search", search_on: "names" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.
        eql([ "taxon.names.name" ]);
    });

    it( "queries tags", function( ) {
      Q( { q: "search", search_on: "tags" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.
        eql([ "tags" ]);
    });

    it( "queries descriptions", function( ) {
      Q( { q: "search", search_on: "description" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.
        eql([ "description" ]);
    });

    it( "queries places", function( ) {
      Q( { q: "search", search_on: "place" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.
        eql([ "place_guess" ]);
    });

    //
    // Filters
    //

    it( "filters by taxon_id", function( ) {
      Q( { taxon_id: 88 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.ancestor_ids": [ 88 ] } }]);
    });

    it( "filters by taxon_ids", function( ) {
      Q( { taxon_ids: [ 3, 4, 5 ] }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.ancestor_ids": [ 3, 4, 5 ] } }]);
    });

    it( "turns has[] into params", function( ) {
      Q( { has: [ "photos" ] }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ exists: { field: "photos.url" } }]);
    });

    it( "filters by user login", function( ) {
      Q( { user_id: "aname" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { "user.login": [ "aname" ] } }]);
    });

    it( "filters by param values", function( ) {
      _.each([ { http_param: "rank", es_field: "taxon.rank" },
        { http_param: "user_id", es_field: "user.id" },
        { http_param: "user_login", es_field: "user.login" },
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
        // single values (user_id only accepts integers)
        var v = (filter.http_param == "user_id") ? 99 : "test";
        qp[ filter.http_param ] = v;
        Q( qp, function( e, q ) { eq = q; } );
        var f = { terms: { } };
        f.terms[ filter.es_field ] = [ v ];
        expect( eq.filters ).to.eql([ f ]);
        // multiple values (user_id only accepts integers)
        v = (filter.http_param == "user_id") ? [ 98, 99 ] : [ "test1", "test2" ];
        qp[ filter.http_param ] = v;
        Q( qp, function( e, q ) { eq = q; } );
        f = { terms: { } };
        f.terms[ filter.es_field ] = v;
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
        { http_param: "captive", es_field: "captive" }
      ], function( filter ) {
        var qp = { };
        // true values
        qp[ filter.http_param ] = "true";
        Q( qp, function( e, q ) { eq = q; } );
        var f = { terms: { } };
        f.terms[ filter.es_field ] = [ true ];
        expect( eq.filters ).to.eql([ f ]);
        // false values
        qp[ filter.http_param ] = "false";
        Q( qp, function( e, q ) { eq = q; } );
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
        Q( qp, function( e, q ) { eq = q; } );
        var f = { exists: { field: filter.es_field } };
        expect( eq.filters ).to.eql([ f ]);
        // false values
        qp[ filter.http_param ] = "false";
        Q( qp, function( e, q ) { eq = q; } );
        expect( eq.inverse_filters ).to.eql([ f ]);
      });
    });

    it( "filters by verifiable true", function( ) {
      Q( { verifiable: "true" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { quality_grade: [ "needs_id", "research" ] } }]);
    });

    it( "filters by verifiable false", function( ) {
      Q( { verifiable: "false" }, function( e, q ) { eq = q; } );
      expect( eq.inverse_filters ).to.eql([
        { terms: { quality_grade: [ "needs_id", "research" ] } }]);
    });

    it( "filters by observed_on", function( ) {
      Q( { observed_on: "2009-10-11" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { "observed_on_details.day": [ 11 ] } },
        { terms: { "observed_on_details.month": [ 10 ] } },
        { terms: { "observed_on_details.year": [ 2009 ] } }]);
    });

    it( "filters by on", function( ) {
      Q( { on: "2009-10-11" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { "observed_on_details.day": [ 11 ] } },
        { terms: { "observed_on_details.month": [ 10 ] } },
        { terms: { "observed_on_details.year": [ 2009 ] } }]);
    });

    it( "filters by created_on", function( ) {
      Q( { created_on: "2009-10-11" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { "created_at_details.day": [ 11 ] } },
        { terms: { "created_at_details.month": [ 10 ] } },
        { terms: { "created_at_details.year": [ 2009 ] } }]);
    });

    it( "filters by project_id", function( ) {
      Q( { project_id: 3 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { project_ids: [ 3 ] } }]);
    });

    it( "filters by project_id and ignores bad pcid values", function( ) {
      Q( { project_id: 3, pcid: "bad" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { project_ids: [ 3 ] } }]);
    });

    it( "filters by project_id and pcid=true", function( ) {
      Q( { project_id: 3, pcid: "true" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { project_ids: [ 3 ] } },
        { terms: { project_ids_with_curator_id: [ 3 ] }}]);
    });

    it( "filters by project_id and pcid=false", function( ) {
      Q( { project_id: 3, pcid: "false" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([
        { terms: { project_ids: [ 3 ] } },
        { terms: { project_ids_without_curator_id: [ 3 ] }}]);
    });

    it( "ignores bad pcid values", function( ) {
      Q( { pcid: "bad" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.be.empty;
    });

    it( "filters by pcid=true", function( ) {
      Q( { pcid: "true" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ exists: { field: "project_ids_with_curator_id" } }]);
    });

    it( "filters by pcid=false", function( ) {
      Q( { pcid: "false" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ exists: { field: "project_ids_without_curator_id" } }]);
    });

    it( "filters by project_ids", function( ) {
      Q( { project_ids: [ 4, 5 ] }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { project_ids: [ 4, 5 ] } }]);
    });

    it( "filters by lrank", function( ) {
      Q( { lrank: "family" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: {
        "taxon.rank_level": { gte: 30, lte: 100 }}}]);
    });

    it( "filters by hrank", function( ) {
      Q( { hrank: "class" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: {
        "taxon.rank_level": { gte: 0, lte: 50 }}}]);
    });

    it( "filters by quality grade except 'any'", function( ) {
      Q( { quality_grade: "research" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { quality_grade: [ "research" ] } }]);
      Q( { quality_grade: "any" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.be.empty;
    });

    it( "filters by identifications most_agree", function( ) {
      Q( { identifications: "most_agree" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { identifications_most_agree: [ true ] } }]);
    });

    it( "filters by identifications some_agree", function( ) {
      Q( { identifications: "some_agree" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { identifications_some_agree: [ true ] } }]);
    });

    it( "filters by identifications most_disagree", function( ) {
      Q( { identifications: "most_disagree" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { identifications_most_disagree: [ true ] } }]);
    });

    it( "filters by bounding box", function( ) {
      Q( { nelat: 1, nelng: 2, swlat: 3, swlng: 4 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ envelope: { geojson: {
        nelat: 1, nelng: 2, swlat: 3, swlng: 4 }}}]);
    });

    it( "filters by point and radius", function( ) {
      Q( { lat: 10, lng: 20, radius: 30 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ geo_distance: {
        distance: "30km", location: { lat: 10, lon: 20 }}}]);
    });

    it( "defaults to a radius of 10k", function( ) {
      Q( { lat: 10, lng: 20 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ geo_distance: {
        distance: "10km", location: { lat: 10, lon: 20 }}}]);
    });

    it( "filters by iconic_taxa", function( ) {
      Q( { iconic_taxa: [ "Animalia", "Plantae" ] }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { "taxon.iconic_taxon_id": [ 103, 111 ] } }]);
    });

    it( "filters by unknown iconic_taxa", function( ) {
      Q( { iconic_taxa: [ "Animalia", "Plantae", "unknown" ] }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ bool: { should: [
        { terms: { "taxon.iconic_taxon_id": [ 103, 111 ] } },
        { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" }}}}]}}]);
    });

    it( "filters observed_on by date", function( ) {
      Q( { d1: "2015-01-01T00:00:00+00:00", d2: "2015-02-02T23:59:59+00:00" },
        function( e, q ) { eq = q; } );
      var shoulds = eq.filters[0].bool.should;
      expect( shoulds[0].bool.filter[0].range.time_observed_at ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: "2015-02-02T23:59:59+00:00" });
      expect( shoulds[0].bool.filter[1].exists.field ).to.eql( "time_observed_at" );
      expect( shoulds[1].bool.filter[0].range["observed_on_details.date"] ).to.eql(
        { gte: "2015-01-01",
          lte: "2015-02-02" });
      expect( shoulds[1].bool.must_not[0].exists.field ).to.eql( "time_observed_at" );
    });

    it( "does nothing without an invalid date", function( ) {
      Q( { d1: "nonsense" }, function( e, q ) { eq = q; } );
      expect( eq.where ).to.be.undefined;
      expect( eq.filters ).to.be.empty;
      Q( { d2: "nonsense" }, function( e, q ) { eq = q; } );
      expect( eq.where ).to.be.undefined;
      expect( eq.filters ).to.be.empty;
    });

    it( "defaults d2 to tomorrow", function( ) {
      Q( { d1: "2015-01-01" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].range["observed_on_details.date"] ).to.eql(
        { gte: "2015-01-01",
          lte: moment.utc( ).add( 2, "day").format( "YYYY-MM-DD" ) });
    });

    it( "defaults d1 to 1800-01-01", function( ) {
      Q( { d2: "2015-02-02" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].range["observed_on_details.date"] ).to.eql(
        { gte: "1800-01-01",
          lte: "2015-02-02" });
    });

    it( "filters created_at time", function( ) {
      Q( { created_d1: "2015-01-01T00:00:00+00:00", created_d2: "2015-02-02T23:59:59+00:00" },
        function( e, q ) { eq = q; } );
      expect( eq.filters[0].range.created_at ).to.eql(
        { gte: "2015-01-01T00:00:00+00:00",
          lte: "2015-02-02T23:59:59+00:00" });
    });

    it( "filters by not_in_project", function( ) {
      Q( { not_in_project: [ 6, 7 ] }, function( e, q ) { eq = q; } );
      expect( eq.inverse_filters ).to.eql([{ term: { project_ids: [ 6, 7 ] }}]);
    });

    it( "filters by featured observation", function( ) {
      Q( { featured_observation_id: 8 }, function( e, q ) { eq = q; } );
      expect( eq.inverse_filters ).to.eql([{ term: { id: 8 }}]);
    });

    it( "filters by updated_since", function( ) {
      Q( { updated_since: "2015-01-02T00:00:00+00:00" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: {
        updated_at: { gte: "2015-01-02T00:00:00+00:00" } } }]);
    });

    it( "ignores bad updated_since values", function( ) {
      Q( { updated_since: "nonsense" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.be.empty;
    });

    it( "filters by observed_after", function( ) {
      Q( { observed_after: "2015-01-02T00:00:00+00:00" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: {
        observed_on: { gte: "2015-01-02T00:00:00+00:00" } } }]);
    });

    it( "filters by observation fields", function( ) {
      Q( { "field:habitat": null }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter.length ).to.eql( 1 );
      expect( eq.filters[0].nested.query.bool.filter[0].match[ "ofvs.name_ci"] ).to.eql( "habitat" );
    });

    it( "filters by observation field values", function( ) {
      Q( { "field:habitat": "marine" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter.length ).to.eql( 2 );
      expect( eq.filters[0].nested.query.bool.filter[0].match[ "ofvs.name_ci"] ).to.eql( "habitat" );
      expect( eq.filters[0].nested.query.bool.filter[1].match[ "ofvs.value_ci"] ).to.eql( "marine" );
    });

    it( "filters by conservation status", function( ) {
      Q( { cs: "endangered" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field ).
        to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0].
        terms["taxon.statuses.status" ][0] ).to.eql( "endangered" );
    });

    it( "filters by conservation status with a place", function( ) {
      Q( { cs: "endangered", place_id: 1 }, function( e, q ) { eq = q; } );
      expect( eq.filters[1].nested.query.bool.filter[1].bool.should[0].
        terms["taxon.statuses.place_id"] ).to.eql( [ 1 ] );
      expect( eq.filters[1].nested.query.bool.filter[1].bool.should[1].
        bool.must_not.exists.field ).to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[1].nested.query.bool.filter[0].
        terms["taxon.statuses.status" ][0] ).to.eql( "endangered" );
    });

    it( "filters by iucn conservation status", function( ) {
      Q( { csi: "en" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field ).
        to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0].
        terms["taxon.statuses.iucn" ][0] ).to.eql( 40 );
    });

    it( "ignores bad values for csi", function( ) {
      Q( { csi: "bad" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.be.empty;
    });

    it( "filters by conservation status authority", function( ) {
      Q( { csa: "natureserve" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field ).
        to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0].
        terms["taxon.statuses.authority" ][0] ).to.eql( "natureserve" );
    });

    it( "filters by popular", function( ) {
      Q( { popular: "true" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: { cached_votes_total: { gte: 1 } } }]);
      Q( { popular: "false" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ term: { cached_votes_total: 0 } }]);
    });

    it( "filters by id_above", function( ) {
      Q( { id_above: 51 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ range: { id: { gt: 51 } } }]);
    });

    it( "filters by reviewed true", function( ) {
      Q( { reviewed: "true", viewer_id: 21 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { reviewed_by: [ 21 ] } }]);
    });

    it( "filters by reviewed false", function( ) {
      Q( { reviewed: "false", viewer_id: 21 }, function( e, q ) { eq = q; } );
      expect( eq.inverse_filters ).to.eql([{ term: { reviewed_by: 21 }}]);
    });

    it( "ignored bad values for reviewed", function( ) {
      Q( { reviewed: "bad", viewer_id: 21 }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.be.empty;
    });

    it( "filters by geoprivacy", function( ) {
      Q( { geoprivacy: "whatever" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { geoprivacy: [ "whatever" ] } }]);
    });

    it( "filters by geoprivacy open", function( ) {
      Q( { geoprivacy: "open" }, function( e, q ) { eq = q; } );
      expect( eq.inverse_filters ).to.eql([{ exists: { field: "geoprivacy" } }]);
    });

    it( "filters by geoprivacy obscured_private", function( ) {
      Q( { geoprivacy: "obscured_private" }, function( e, q ) { eq = q; } );
      expect( eq.filters ).to.eql([{ terms: { geoprivacy: [ "obscured", "private" ] } }]);
    });

    it( "filters by changed_since date", function( ) {
      Q( { changed_since: "2015-01-02T00:00:00+00:00" }, function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter[0] ).to.eql({
        range: { "field_change_times.changed_at": {
          gte: "2015-01-02T00:00:00+00:00" } }
      });
    });

    it( "does nothing with an invalid changed_since date", function( ) {
      Q( { changed_since: "whenever" }, function( e, q ) { eq = q; } );
      expect( eq.filters.length ).to.eq( 0 );
    });

    it( "filters by changed_fields", function( ) {
      Q( { changed_since: "2015-01-02T00:00:00+00:00", changed_fields: "description" },
        function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter[1] ).to.eql({
        terms: { "field_change_times.field_name": [ "description" ] }
      });
    });

    it( "filters by changed_fields", function( ) {
      Q( { changed_since: "2015-01-02T00:00:00+00:00", change_project_id: "4" },
        function( e, q ) { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter[1].or[0] ).to.eql({
        terms: { "field_change_times.project_id": [ "4" ] }
      });
    });

    //
    // Sorting
    //
    it( "sorts by created_at desc by default", function( ) {
      Q({ }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql( { created_at: "desc"} );
    });

    it( "allows sorting asc", function( ) {
      Q({ order: "asc" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql( { created_at: "asc"} );
    });

    it( "sorts by observed_on desc", function( ) {
      Q({ order_by: "observed_on" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql({
        created_at: "desc",
        "observed_on_details.date": "desc",
        time_observed_at: {
          missing: "_last",
          order: "desc"
        }
      });
    });

    it( "sorts by observed_on asc", function( ) {
      Q({ order_by: "observed_on", order: "asc" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql({
        created_at: "asc",
        "observed_on_details.date": "asc",
        time_observed_at: {
          missing: "_first",
          order: "asc"
        }
      });
    });

    it( "sorts by species_guess", function( ) {
      Q({ order_by: "species_guess" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql( { species_guess: "desc"} );
    });

    it( "sorts by votes", function( ) {
      Q({ order_by: "votes" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql( { cached_votes_total: "desc"} );
    });

    it( "sorts by id", function( ) {
      Q({ order_by: "id" }, function( e, q ) { eq = q; } );
      expect( eq.sort ).to.eql( { id: "desc"} );
    });

  });

  describe( "index", function( ) {
    it( "fetches results", function( done ) {
      ObservationsController.search( { query: { } }, function( ) {
        // this needs some work - fixtures, etc
        done( );
      });
    });
  });

});
