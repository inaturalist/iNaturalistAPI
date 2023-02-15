const { expect } = require( "chai" );
const moment = require( "moment" );
const _ = require( "lodash" );
const { observations } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const util = require( "../../../lib/util" );
const Observation = require( "../../../lib/models/observation" );
const Project = require( "../../../lib/models/project" );
const List = require( "../../../lib/models/list" );
const ObservationsController = require( "../../../lib/controllers/v1/observations_controller" );

let eq;

const Q = async params => {
  const { inat } = params;
  delete params.inat;
  const queryString = _.reduce( params, ( components, value, key ) => {
    components.push( `${key}=${( value ? encodeURIComponent( value ) : "" )}` );
    return components;
  }, [] ).join( "&" );
  return ObservationsController.reqToElasticQuery( {
    query: params,
    inat,
    _parsedUrl: { query: queryString }
  } );
};

describe( "ObservationsController", ( ) => {
  it( "uses the test ENV", ( ) => {
    expect( process.env.NODE_ENV ).to.eq( "test" );
  } );

  it( "creates", done => {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "create", Observation, done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "update", Observation, done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "delete", done
    );
  } );

  it( "faves", done => {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "fave", Observation, done
    );
  } );

  it( "unfaves", done => {
    testHelper.testInatJSPreload(
      ObservationsController, observations, "unfave", Observation, done
    );
  } );

  it( "reviews", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "review", done
    );
  } );

  it( "unreviews", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "unreview", done
    );
  } );

  it( "sets quality metrics", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "setQualityMetric", done
    );
  } );

  it( "deletes quality metrics", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "deleteQualityMetric", done
    );
  } );

  it( "calls viewed_updates", done => {
    testHelper.testInatJSNoPreload(
      ObservationsController, observations, "viewedUpdates", done
    );
  } );

  describe( "reqToElasticQuery", ( ) => {
    it( "can apply params from project rules", async ( ) => {
      const p = await Project.findByID( 543 );
      const q = await Q( { inat: { apply_project_rules_for: p } } );
      expect( q.filters ).to.deep.include( { terms: { "place_ids.keyword": [222, 333] } } );
      expect( q.filters ).to.deep.include( {
        terms: { "taxon.ancestor_ids.keyword": [444, 555, 876, 987] }
      } );
      expect( q.filters ).to.deep.include( { term: { captive: false } } );
      expect( q.filters ).to.deep.include( {
        range: { photos_count: { gte: 1 } }
      } );
      expect( q.filters ).to.deep.include( {
        range: { sounds_count: { gte: 1 } }
      } );
      expect( q.filters ).to.deep.include( { exists: { field: "geojson" } } );
      expect( q.filters ).to.deep.include( { exists: { field: "taxon.id" } } );
      // plus a complicated date filter
    } );

    it( "can apply inverse project rules", async ( ) => {
      const p = await Project.findByID( 543 );
      const q = await Q( { inat: { not_matching_project_rules_for: p } } );
      expect( q.grouped_inverse_filters ).to.deep.include( {
        terms: { "place_ids.keyword": [222, 333] }
      } );
      expect( q.grouped_inverse_filters ).to.deep.include( {
        terms: { "taxon.ancestor_ids.keyword": [444, 555, 876, 987] }
      } );
      expect( q.grouped_inverse_filters ).to.deep.include( { term: { captive: false } } );
      expect( q.grouped_inverse_filters ).to.deep.include( {
        range: { photos_count: { gte: 1 } }
      } );
      expect( q.grouped_inverse_filters ).to.deep.include( {
        range: { sounds_count: { gte: 1 } }
      } );
      expect( q.grouped_inverse_filters ).to.deep.include( { exists: { field: "geojson" } } );
      expect( q.grouped_inverse_filters ).to.deep.include( { exists: { field: "taxon.id" } } );
      // plus a complicated date filter
    } );

    it( "queries a list's taxon_ids", async ( ) => {
      const l = await List.findByID( 999 );
      const q = await Q( { inat: { list: l } } );
      expect( q.filters ).to.deep.include( { terms: { "taxon.ancestor_ids.keyword": [876, 987] } } );
    } );

    //
    // Queries
    //

    it( "queries multiple fields", async ( ) => {
      const q = await Q( { q: "search" } );
      expect( q.filters[0].multi_match.operator ).to.eq( "and" );
      expect( q.filters[0].multi_match.query ).to.eq( "search" );
      expect( q.filters[0].multi_match.fields ).to.not.include( "taxon.names_sci" );
      expect( q.filters[0].multi_match.fields ).to.not.include( "taxon.names_en" );
      expect( q.filters[0].multi_match.fields ).to.not.include( "taxon.names_fr" );
      expect( q.filters[0].multi_match.fields ).to.include( "tags" );
      expect( q.filters[0].multi_match.fields ).to.include( "description" );
      expect( q.filters[0].multi_match.fields ).to.include( "place_guess" );
    } );

    it( "queries names", async ( ) => {
      const q = await Q( { q: "search", search_on: "names" } );
      expect( q.filters ).to.deep.include( { term: { id: -1 } } );
    } );

    it( "queries tags", async ( ) => {
      eq = await Q( { q: "search", search_on: "tags" } );
      expect( eq.filters[0].multi_match.fields ).to.eql( ["tags"] );
    } );

    it( "queries descriptions", async ( ) => {
      const q = await Q( { q: "search", search_on: "description" } );
      expect( q.filters[0].multi_match.fields ).to.eql( ["description"] );
    } );

    it( "queries places", async ( ) => {
      const q = await Q( { q: "search", search_on: "place" } );
      expect( q.filters[0].multi_match.fields ).to.eql( ["place_guess"] );
    } );

    it( "queries taxon_name", async ( ) => {
      const q = await Q( { taxon_name: "something" } );
      expect( q.filters ).to.deep.include( { term: { id: -1 } } );
    } );

    //
    // Filters
    //

    it( "filters by taxon_id", async ( ) => {
      const q = await Q( { taxon_id: 88 } );
      expect( q.filters ).to.eql( [{ terms: { "taxon.ancestor_ids.keyword": [88] } }] );
    } );

    it( "filters by taxon_ids", async ( ) => {
      const q = await Q( { taxon_ids: [3, 4, 5] } );
      expect( q.filters ).to.eql( [{ terms: { "taxon.ancestor_ids.keyword": [3, 4, 5] } }] );
    } );

    it( "turns has[] into params", async ( ) => {
      const q = await Q( { has: ["photos"] } );
      expect( q.filters ).to.eql( [
        { range: { photos_count: { gte: 1 } } }
      ] );
    } );

    it( "filters by param values", async ( ) => {
      const asyncTest = async filter => {
        const qp = { };
        // single values (user_id only accepts integers)
        const vSingle = ( filter.http_param === "user_id" ) ? "99" : "test";
        // multiple values (user_id only accepts integers)
        const vArray = ( filter.http_param === "user_id" ) ? ["98", "99"] : ["test1", "test2"];
        let q;
        if ( _.isArray( filter.es_field ) ) {
          qp[filter.http_param] = vSingle;
          q = await Q( qp );
          let f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { terms: { [ff]: [vSingle] } } ) )
            }
          };
          expect( q.filters ).to.eql( [f] );
          // Array values
          qp[filter.http_param] = vArray;
          q = await Q( qp );
          f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { terms: { [ff]: vArray } } ) )
            }
          };
          expect( q.filters ).to.eql( [f] );
        } else {
          qp[filter.http_param] = vSingle;
          q = await Q( qp );
          let f = { terms: { } };
          f.terms[filter.es_field] = [vSingle];
          expect( q.filters ).to.eql( [f] );
          // Array values
          qp[filter.http_param] = vArray;
          q = await Q( qp );
          f = { terms: { } };
          f.terms[filter.es_field] = vArray;
          expect( q.filters ).to.eql( [f] );
        }
      };
      await Promise.all( _.map( [
        { http_param: "rank", es_field: "taxon.rank" },
        { http_param: "user_id", es_field: "user.id.keyword" },
        { http_param: "user_login", es_field: "user.login" },
        { http_param: "day", es_field: "observed_on_details.day" },
        { http_param: "month", es_field: "observed_on_details.month" },
        { http_param: "year", es_field: "observed_on_details.year" },
        { http_param: "place_id", es_field: "place_ids.keyword" },
        { http_param: "site_id", es_field: "site_id.keyword" },
        { http_param: "license", es_field: "license_code" },
        { http_param: "photo_license", es_field: ["photos.license_code", "photo_licenses"] },
        { http_param: "sound_license", es_field: ["sounds.license_code", "sound_licenses"] }
      ], f => asyncTest( f ) ) );
    } );

    it( "filters by booleans", async ( ) => {
      const asyncTest = async filter => {
        const qp = { };
        // true values
        qp[filter.http_param] = "true";
        let q = await Q( qp );
        let f = { terms: { } };
        f.terms[filter.es_field] = [true];
        expect( q.filters ).to.eql( [f] );
        // false values
        qp[filter.http_param] = "false";
        q = await Q( qp );
        f = { term: { } };
        f.term[filter.es_field] = false;
        expect( q.filters ).to.eql( [f] );
      };
      await Promise.all( _.map( [
        { http_param: "introduced", es_field: "taxon.introduced" },
        { http_param: "threatened", es_field: "taxon.threatened" },
        { http_param: "native", es_field: "taxon.native" },
        { http_param: "endemic", es_field: "taxon.endemic" },
        { http_param: "id_please", es_field: "id_please" },
        { http_param: "out_of_range", es_field: "out_of_range" },
        { http_param: "mappable", es_field: "mappable" },
        { http_param: "captive", es_field: "captive" }
      ], f => asyncTest( f ) ) );
    } );

    it( "filters by attribute presence", async ( ) => {
      const asyncTest = async filter => {
        const qp = { };
        let q;
        if ( _.isArray( filter.es_field ) ) {
          // true values
          qp[filter.http_param] = "true";
          q = await Q( qp );
          const f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { exists: { field: ff } } ) )
            }
          };
          expect( q.filters ).to.eql( [f] );
          // false values
          qp[filter.http_param] = "false";
          q = await Q( qp );
          expect( q.inverse_filters ).to.eql( [f] );
        } else {
          // true values
          qp[filter.http_param] = "true";
          q = await Q( qp );
          const f = { exists: { field: filter.es_field } };
          expect( q.filters ).to.eql( [f] );
          // false values
          qp[filter.http_param] = "false";
          q = await Q( qp );
          expect( q.inverse_filters ).to.eql( [f] );
        }
      };
      await Promise.all( _.map( [
        { http_param: "geo", es_field: "geojson" },
        { http_param: "identified", es_field: "taxon.id" }
      ], f => asyncTest( f ) ) );
    } );

    it( "filters by verifiable true", async ( ) => {
      const q = await Q( { verifiable: "true" } );
      expect( q.inverse_filters ).to.eql( [
        { terms: { quality_grade: ["casual"] } }] );
    } );

    it( "filters by verifiable false", async ( ) => {
      const q = await Q( { verifiable: "false" } );
      expect( q.filters ).to.eql( [
        { terms: { quality_grade: ["casual"] } }] );
    } );

    it( "filters by observed_on", async ( ) => {
      const q = await Q( { observed_on: "2009-10-11" } );
      expect( q.filters ).to.eql( [
        { terms: { "observed_on_details.day": [11] } },
        { terms: { "observed_on_details.month": [10] } },
        { terms: { "observed_on_details.year": [2009] } }] );
    } );

    it( "filters by on", async ( ) => {
      const q = await Q( { on: "2009-10-11" } );
      expect( q.filters ).to.eql( [
        { terms: { "observed_on_details.day": [11] } },
        { terms: { "observed_on_details.month": [10] } },
        { terms: { "observed_on_details.year": [2009] } }] );
    } );

    it( "filters by created_on", async ( ) => {
      const q = await Q( { created_on: "2009-10-11" } );
      expect( q.filters ).to.eql( [
        { terms: { "created_at_details.day": [11] } },
        { terms: { "created_at_details.month": [10] } },
        { terms: { "created_at_details.year": [2009] } }] );
    } );

    it( "filters by project_id", async ( ) => {
      const q = await Q( { project_id: 3 } );
      expect( q.filters ).to.eql( [{ terms: { "project_ids.keyword": [3] } }] );
    } );

    it( "filters by project_id and ignores bad pcid values", async ( ) => {
      const q = await Q( { project_id: 3, pcid: "bad" } );
      expect( q.filters ).to.eql( [{ terms: { "project_ids.keyword": [3] } }] );
    } );

    it( "filters by project_id and pcid=true", async ( ) => {
      const q = await Q( { project_id: 3, pcid: "true" } );
      expect( q.filters ).to.eql( [
        { terms: { "project_ids.keyword": [3] } },
        { terms: { project_ids_with_curator_id: [3] } }] );
    } );

    it( "filters by project_id and pcid=false", async ( ) => {
      const q = await Q( { project_id: 3, pcid: "false" } );
      expect( q.filters ).to.eql( [
        { terms: { "project_ids.keyword": [3] } },
        { terms: { project_ids_without_curator_id: [3] } }] );
    } );

    it( "ignores bad pcid values", async ( ) => {
      const q = await Q( { pcid: "bad" } );
      expect( q.filters ).to.be.empty;
    } );

    it( "filters by pcid=true", async ( ) => {
      const q = await Q( { pcid: "true" } );
      expect( q.filters ).to.eql( [{ exists: { field: "project_ids_with_curator_id" } }] );
    } );

    it( "filters by pcid=false", async ( ) => {
      const q = await Q( { pcid: "false" } );
      expect( q.filters ).to.eql( [{ exists: { field: "project_ids_without_curator_id" } }] );
    } );

    it( "filters by project_ids", async ( ) => {
      const q = await Q( { project_ids: [4, 5] } );
      expect( q.filters ).to.eql( [{ terms: { "project_ids.keyword": [4, 5] } }] );
    } );

    it( "filters by lrank", async ( ) => {
      const q = await Q( { lrank: "family" } );
      expect( q.filters ).to.eql( [{
        range: { "taxon.rank_level": { gte: 30, lte: 100 } }
      }] );
    } );

    it( "filters by hrank", async ( ) => {
      const q = await Q( { hrank: "class" } );
      expect( q.filters ).to.eql( [{
        range: { "taxon.rank_level": { gte: 0, lte: 50 } }
      }] );
    } );

    it( "filters by quality grade except 'any'", async ( ) => {
      let q = await Q( { quality_grade: "research" } );
      expect( q.filters ).to.eql( [{ terms: { quality_grade: ["research"] } }] );
      q = await Q( { quality_grade: "any" } );
      expect( q.filters ).to.be.empty;
    } );

    it( "applies no filters with quality_grade=research,needs_id,casual'", async ( ) => {
      const q = await Q( { quality_grade: "research,needs_id,casual" } );
      expect( q.filters ).to.be.empty;
      expect( q.inverse_filters ).to.be.empty;
    } );

    it( "applies a more efficient filter for quality_grade=research,needs_id'", async ( ) => {
      const q = await Q( { quality_grade: "research,needs_id" } );
      expect( q.filters ).to.be.empty;
      expect( q.inverse_filters ).to.eql( [
        { terms: { quality_grade: ["casual"] } }] );
    } );

    it( "filters by identifications most_agree", async ( ) => {
      const q = await Q( { identifications: "most_agree" } );
      expect( q.filters ).to.eql( [{ terms: { identifications_most_agree: [true] } }] );
    } );

    it( "filters by identifications some_agree", async ( ) => {
      const q = await Q( { identifications: "some_agree" } );
      expect( q.filters ).to.eql( [{ terms: { identifications_some_agree: [true] } }] );
    } );

    it( "filters by identifications most_disagree", async ( ) => {
      const q = await Q( { identifications: "most_disagree" } );
      expect( q.filters ).to.eql( [{ terms: { identifications_most_disagree: [true] } }] );
    } );

    it( "filters by bounding box", async ( ) => {
      const q = await Q( {
        nelat: 1,
        nelng: 2,
        swlat: 3,
        swlng: 4
      } );
      expect( q.filters ).to.eql( [{
        envelope: {
          geojson: {
            nelat: 1,
            nelng: 2,
            swlat: 3,
            swlng: 4
          }
        }
      }] );
    } );

    it( "filters by point and radius", async ( ) => {
      const q = await Q( { lat: 10, lng: 20, radius: 30 } );
      expect( q.filters ).to.eql( [{
        geo_distance: { distance: "30km", location: { lat: 10, lon: 20 } }
      }] );
    } );

    it( "defaults to a radius of 10k", async ( ) => {
      const q = await Q( { lat: 10, lng: 20 } );
      expect( q.filters ).to.eql( [{
        geo_distance: { distance: "10km", location: { lat: 10, lon: 20 } }
      }] );
    } );

    it( "filters by iconic_taxa", async ( ) => {
      const q = await Q( { iconic_taxa: ["Animalia", "Plantae"] } );
      expect( q.filters ).to.eql( [{ terms: { "taxon.iconic_taxon_id.keyword": [103, 111] } }] );
    } );

    it( "filters by unknown iconic_taxa", async ( ) => {
      const q = await Q( { iconic_taxa: ["Animalia", "Plantae", "unknown"] } );
      expect( q.filters ).to.eql( [{
        bool: {
          should: [
            { terms: { "taxon.iconic_taxon_id.keyword": [103, 111] } },
            { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" } } } }
          ]
        }
      }] );
    } );

    it( "filters observed_on by date", async ( ) => {
      const q = await Q( { d1: "2015-01-01T00:00:00+00:00", d2: "2015-02-02T23:59:59+00:00" } );
      const shoulds = q.filters[0].bool.should;
      expect( shoulds[0].bool.filter[0].range.time_observed_at ).to.eql( {
        gte: "2015-01-01T00:00:00+00:00",
        lte: "2015-02-02T23:59:59+00:00"
      } );
      expect( shoulds[0].bool.filter[1].exists.field ).to.eql( "time_observed_at" );
      expect( shoulds[1].bool.filter[0].range["observed_on_details.date"] ).to.eql( {
        gte: "2015-01-01",
        lte: "2015-02-02"
      } );
      expect( shoulds[1].bool.must_not[0].exists.field ).to.eql( "time_observed_at" );
    } );

    it( "does nothing without an invalid date", async ( ) => {
      let q = await Q( { d1: "nonsense" } );
      expect( q.where ).to.be.undefined;
      expect( q.filters ).to.be.empty;
      q = await Q( { d2: "nonsense" } );
      expect( q.where ).to.be.undefined;
      expect( q.filters ).to.be.empty;
    } );

    it( "defaults d2 to tomorrow", async ( ) => {
      const q = await Q( { d1: "2015-01-01" } );
      expect( q.filters[0].range["observed_on_details.date"] ).to.eql( {
        gte: "2015-01-01",
        lte: moment.utc( ).add( 2, "day" ).format( "YYYY-MM-DD" )
      } );
    } );

    it( "defaults d1 to 1800-01-01", async ( ) => {
      const q = await Q( { d2: "2015-02-02" } );
      expect( q.filters[0].range["observed_on_details.date"] ).to.eql( {
        gte: "1800-01-01",
        lte: "2015-02-02"
      } );
    } );

    it( "filters created_at time", async ( ) => {
      const q = await Q( {
        created_d1: "2015-01-01T00:00:00+00:00",
        created_d2: "2015-02-02T23:59:59+00:00"
      } );
      const shoulds = q.filters[0].bool.should;
      expect( shoulds[0].bool.filter[0].range.created_at ).to.eql( {
        gte: "2015-01-01T00:00:00+00:00",
        lte: "2015-02-02T23:59:59+00:00"
      } );
      expect( shoulds[0].bool.filter[1].exists.field ).to.eql( "created_at" );
      expect( shoulds[1].bool.filter[0].range["created_at_details.date"] ).to.eql( {
        gte: "2015-01-01",
        lte: "2015-02-02"
      } );
      expect( shoulds[1].bool.must_not[0].exists.field ).to.eql( "created_at" );
    } );

    it( "filters created_at date", async ( ) => {
      const q = await Q( {
        created_d1: "2015-01-01",
        created_d2: "2015-02-02"
      } );
      expect( q.filters[0].range["created_at_details.date"] ).to.eql( {
        gte: "2015-01-01",
        lte: "2015-02-02"
      } );
    } );

    it( "filters by not_in_project", async ( ) => {
      const q = await Q( { not_in_project: [6, 7] } );
      expect( q.inverse_filters ).to.eql( [{ terms: { "project_ids.keyword": [6, 7] } }] );
    } );

    it( "filters by featured observation", async ( ) => {
      const q = await Q( { featured_observation_id: 8 } );
      expect( q.inverse_filters ).to.eql( [{ term: { id: 8 } }] );
    } );

    it( "filters by updated_since", async ( ) => {
      const q = await Q( { updated_since: "2015-01-02T00:00:00+00:00" } );
      expect( q.filters ).to.eql( [{
        range: { updated_at: { gte: "2015-01-02T00:00:00+00:00" } }
      }] );
    } );

    it( "ignores bad updated_since values", async ( ) => {
      const q = await Q( { updated_since: "nonsense" } );
      expect( q.filters ).to.be.empty;
    } );

    it( "filters by observed_after", async ( ) => {
      const q = await Q( { observed_after: "2015-01-02T00:00:00+00:00" } );
      expect( q.filters ).to.eql( [{
        range: { observed_on: { gte: "2015-01-02T00:00:00+00:00" } }
      }] );
    } );

    it( "filters by observation fields", async ( ) => {
      const q = await Q( { "field:habitat": null } );
      expect( q.filters[0].nested.query.bool.filter.length ).to.eql( 1 );
      expect( q.filters[0].nested.query.bool.filter[0].match["ofvs.name_ci"] ).to.eql( "habitat" );
    } );

    it( "filters by observation field values", async ( ) => {
      const q = await Q( { "field:habitat": "marine" } );
      expect( q.filters[0].nested.query.bool.filter.length ).to.eql( 2 );
      expect( q.filters[0].nested.query.bool.filter[0].match["ofvs.name_ci"] ).to.eql( "habitat" );
      expect( q.filters[0].nested.query.bool.filter[1].match["ofvs.value_ci"] ).to.eql( "marine" );
    } );

    it( "filters by conservation status", async ( ) => {
      const q = await Q( { cs: "endangered" } );
      expect( q.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( q.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.status"][0] ).to.eql( "endangered" );
    } );

    it( "filters by conservation status with a place", async ( ) => {
      const q = await Q( { cs: "endangered", place_id: 1 } );
      expect( q.filters[1].nested.query.bool.filter[1].bool.should[0]
        .terms["taxon.statuses.place_id"] ).to.eql( [1] );
      expect( q.filters[1].nested.query.bool.filter[1].bool.should[1]
        .bool.must_not.exists.field ).to.eql( "taxon.statuses.place_id" );
      expect( q.filters[1].nested.query.bool.filter[0]
        .terms["taxon.statuses.status"][0] ).to.eql( "endangered" );
    } );

    it( "filters by iucn conservation status", async ( ) => {
      const q = await Q( { csi: "en" } );
      expect( q.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( q.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.iucn"][0] ).to.eql( 40 );
    } );

    it( "ignores bad values for csi", async ( ) => {
      const q = await Q( { csi: "bad" } );
      expect( q.filters ).to.be.empty;
    } );

    it( "filters by conservation status authority", async ( ) => {
      const q = await Q( { csa: "natureserve" } );
      expect( q.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( q.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.authority"][0] ).to.eql( "natureserve" );
    } );

    it( "filters by popular", async ( ) => {
      let q = await Q( { popular: "true" } );
      expect( q.filters ).to.eql( [{ range: { faves_count: { gte: 1 } } }] );
      q = await Q( { popular: "false" } );
      expect( q.filters ).to.eql( [{ term: { faves_count: 0 } }] );
    } );

    it( "filters by id_above", async ( ) => {
      const q = await Q( { id_above: 51 } );
      expect( q.filters ).to.eql( [{ range: { id: { gt: 51 } } }] );
    } );

    it( "filters by reviewed true", async ( ) => {
      const q = await Q( { reviewed: "true", viewer_id: 21 } );
      expect( q.filters ).to.eql( [{ terms: { reviewed_by: [21] } }] );
    } );

    it( "filters by reviewed false", async ( ) => {
      const q = await Q( { reviewed: "false", viewer_id: 21 } );
      expect( q.inverse_filters ).to.eql( [{ terms: { reviewed_by: [21] } }] );
    } );

    it( "ignored bad values for reviewed", async ( ) => {
      const q = await Q( { reviewed: "bad", viewer_id: 21 } );
      expect( q.filters ).to.be.empty;
    } );

    it( "filters by geoprivacy", async ( ) => {
      const q = await Q( { geoprivacy: "whatever" } );
      expect( q.filters ).to.eql( [{ terms: { geoprivacy: ["whatever"] } }] );
    } );

    it( "filters by geoprivacy open", async ( ) => {
      const q = await Q( { geoprivacy: "open" } );
      expect( q.filters ).to.eql( [{
        bool: {
          should: [
            { terms: { geoprivacy: ["open"] } },
            { bool: { must_not: { exists: { field: "geoprivacy" } } } }
          ]
        }
      }] );
    } );

    it( "filters by geoprivacy obscured_private", async ( ) => {
      const q = await Q( { geoprivacy: "obscured_private" } );
      expect( q.filters ).to.eql( [{ terms: { geoprivacy: ["obscured", "private"] } }] );
    } );

    it( "filters by licensed", async ( ) => {
      let q = await Q( { licensed: "true" } );
      expect( q.filters ).to.eql( [{ exists: { field: "license_code" } }] );
      q = await Q( { licensed: "false" } );
      expect( q.inverse_filters ).to.eql( [{ exists: { field: "license_code" } }] );
    } );

    it( "filters by photo_licensed", async ( ) => {
      let q = await Q( { photo_licensed: "true" } );
      expect( q.filters ).to.eql( [{ exists: { field: "photo_licenses" } }] );
      q = await Q( { photo_licensed: "false" } );
      expect( q.inverse_filters ).to.eql( [{ exists: { field: "photo_licenses" } }] );
    } );

    it( "filters by month", async ( ) => {
      const q = await Q( { month: [1, 2] } );
      expect( q.filters ).to.eql( [{ terms: { "observed_on_details.month": [1, 2] } }] );
    } );

    it( "does not add a filter when all months are requested", async ( ) => {
      const q = await Q( { month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } );
      expect( q.filters ).to.be.empty;
    } );

    //
    // Sorting
    //
    it( "sorts by created_at desc by default", async ( ) => {
      const q = await Q( { } );
      expect( q.sort ).to.eql( { created_at: "desc" } );
    } );

    it( "allows sorting asc", async ( ) => {
      const q = await Q( { order: "asc" } );
      expect( q.sort ).to.eql( { created_at: "asc" } );
    } );

    it( "sorts by observed_on desc", async ( ) => {
      const q = await Q( { order_by: "observed_on" } );
      expect( q.sort ).to.eql( {
        created_at: "desc",
        "observed_on_details.date": "desc",
        time_observed_at: {
          missing: "_last",
          order: "desc"
        }
      } );
    } );

    it( "sorts by observed_on asc", async ( ) => {
      const q = await Q( { order_by: "observed_on", order: "asc" } );
      expect( q.sort ).to.eql( {
        created_at: "asc",
        "observed_on_details.date": "asc",
        time_observed_at: {
          missing: "_first",
          order: "asc"
        }
      } );
    } );

    it( "sorts by species_guess", async ( ) => {
      const q = await Q( { order_by: "species_guess" } );
      expect( q.sort ).to.eql( { species_guess: "desc" } );
    } );

    it( "sorts by votes", async ( ) => {
      const q = await Q( { order_by: "votes" } );
      expect( q.sort ).to.eql( { cached_votes_total: "desc" } );
    } );

    it( "sorts by id", async ( ) => {
      const q = await Q( { order_by: "id" } );
      expect( q.sort ).to.eql( { id: "desc" } );
    } );
  } );

  describe( "index", ( ) => {
    it( "fetches results", async ( ) => {
      await ObservationsController.search( { query: { } } );
    } );
  } );

  describe( "projectsQueryFilters", ( ) => {
    it( "applies project rules", async ( ) => {
      const projects = [{
        id: 11,
        slug: "test-project",
        project_type: "collection",
        search_parameters: [
          {
            field: "quality_grade",
            value: "research,needs_id"
          },
          {
            field: "taxon_id",
            value: 1
          }
        ]
      }];
      const req = {
        taxon_id: 1,
        project_id: "test-project,12",
        inat: {
          project: projects
        }
      };
      const q = await Q( req );
      expect( q.filters[0] ).to.deep.eq( {
        terms: {
          "taxon.ancestor_ids.keyword": [1]
        }
      } );
      expect( q.filters[1].bool.should ).to.not.be.undefined;
      const shoulds = q.filters[1].bool.should;
      expect( shoulds[0] ).to.deep.eq( {
        bool: {
          filter: [
            {
              terms: {
                "taxon.ancestor_ids.keyword": ["1"]
              }
            }
          ],
          must_not: [
            {
              terms: {
                quality_grade: [
                  "casual"
                ]
              }
            }
          ]
        }
      } );
      // the "collection" project slug will be removed from project_id param
      expect( shoulds[1] ).to.deep.eq( {
        bool: {
          filter: [{
            terms: {
              "project_ids.keyword": ["12"]
            }
          }]
        }
      } );
    } );
  } );
} );
