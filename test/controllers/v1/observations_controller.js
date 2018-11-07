const { expect } = require( "chai" );
const moment = require( "moment" );
const _ = require( "lodash" );
const { observations } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const Observation = require( "../../../lib/models/observation" );
const Project = require( "../../../lib/models/project" );
const List = require( "../../../lib/models/list" );
const ObservationsController = require( "../../../lib/controllers/v1/observations_controller" );

let eq;

const Q = ( params, callback ) => {
  const { inat } = params;
  delete params.inat;
  const queryString = _.reduce( params, ( components, value, key ) => {
    components.push( `${key}=${( value ? encodeURIComponent( value ) : "" )}` );
    return components;
  }, [] ).join( "&" );
  ObservationsController.reqToElasticQuery( {
    query: params,
    inat,
    _parsedUrl: { query: queryString }
  }, callback );
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
    it( "can apply params from project rules", done => {
      Project.findByID( 543, ( err, p ) => {
        Q( { inat: { apply_project_rules_for: p } }, ( e, q ) => {
          expect( q.filters ).to.deep.include( { terms: { place_ids: [222, 333] } } );
          expect( q.filters ).to.deep.include( {
            terms: { "taxon.ancestor_ids": [444, 555, 876, 987] }
          } );
          expect( q.filters ).to.deep.include( { term: { captive: false } } );
          expect( q.filters ).to.deep.include( {
            bool: {
              should: [
                { exists: { field: "photos.url" } },
                { exists: { field: "photos_count" } }
              ]
            }
          } );
          expect( q.filters ).to.deep.include( {
            bool: {
              should: [
                { exists: { field: "sounds" } },
                { exists: { field: "sounds_count" } }
              ]
            }
          } );
          expect( q.filters ).to.deep.include( { exists: { field: "geojson" } } );
          expect( q.filters ).to.deep.include( { exists: { field: "taxon" } } );
          // plus a complicated date filter
          done( );
        } );
      } );
    } );

    it( "can apply inverse project rules", done => {
      Project.findByID( 543, ( err, p ) => {
        Q( { inat: { not_matching_project_rules_for: p } }, ( e, q ) => {
          expect( q.grouped_inverse_filters ).to.deep.include( {
            terms: { place_ids: [222, 333] }
          } );
          expect( q.grouped_inverse_filters ).to.deep.include( {
            terms: { "taxon.ancestor_ids": [444, 555, 876, 987] }
          } );
          expect( q.grouped_inverse_filters ).to.deep.include( { term: { captive: false } } );
          expect( q.grouped_inverse_filters ).to.deep.include( {
            bool: {
              should: [
                { exists: { field: "photos.url" } },
                { exists: { field: "photos_count" } }
              ]
            }
          } );
          expect( q.grouped_inverse_filters ).to.deep.include( {
            bool: {
              should: [
                { exists: { field: "sounds" } },
                { exists: { field: "sounds_count" } }
              ]
            }
          } );
          expect( q.grouped_inverse_filters ).to.deep.include( { exists: { field: "geojson" } } );
          expect( q.grouped_inverse_filters ).to.deep.include( { exists: { field: "taxon" } } );
          // plus a complicated date filter
          done( );
        } );
      } );
    } );

    it( "queries a list's taxon_ids", done => {
      List.findByID( 999, ( err, l ) => {
        Q( { inat: { list: l } }, ( e, q ) => {
          expect( q.filters ).to.deep.include( { terms: { "taxon.ancestor_ids": [876, 987] } } );
          done( );
        } );
      } );
    } );

    //
    // Queries
    //

    it( "queries multiple fields", ( ) => {
      Q( { q: "search" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        {
          multi_match: {
            fields: [
              "taxon.names.name",
              "taxon.names_*",
              "tags",
              "description",
              "place_guess"
            ],
            operator: "and",
            query: "search"
          }
        }
      ] );
    } );

    it( "queries names", ( ) => {
      Q( { q: "search", search_on: "names" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.eql( ["taxon.names.name", "taxon.names_*"] );
    } );

    it( "queries tags", ( ) => {
      Q( { q: "search", search_on: "tags" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.eql( ["tags"] );
    } );

    it( "queries descriptions", ( ) => {
      Q( { q: "search", search_on: "description" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.eql( ["description"] );
    } );

    it( "queries places", ( ) => {
      Q( { q: "search", search_on: "place" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to.eql( ["place_guess"] );
    } );

    it( "queries taxon_name", ( ) => {
      Q( { taxon_name: "something" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].multi_match.fields ).to
        .eql( ["taxon.names.name", "taxon.names_*"] );
    } );

    //
    // Filters
    //

    it( "filters by taxon_id", ( ) => {
      Q( { taxon_id: 88 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { "taxon.ancestor_ids": [88] } }] );
    } );

    it( "filters by taxon_ids", ( ) => {
      Q( { taxon_ids: [3, 4, 5] }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { "taxon.ancestor_ids": [3, 4, 5] } }] );
    } );

    it( "turns has[] into params", ( ) => {
      Q( { has: ["photos"] }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        {
          bool: {
            should: [
              { exists: { field: "photos.url" } },
              { exists: { field: "photos_count" } }
            ]
          }
        }
      ] );
    } );

    it( "filters by param values", ( ) => {
      _.each( [{ http_param: "rank", es_field: "taxon.rank" },
        { http_param: "user_id", es_field: "user.id" },
        { http_param: "user_login", es_field: "user.login" },
        { http_param: "day", es_field: "observed_on_details.day" },
        { http_param: "month", es_field: "observed_on_details.month" },
        { http_param: "year", es_field: "observed_on_details.year" },
        { http_param: "place_id", es_field: "place_ids" },
        { http_param: "site_id", es_field: "site_id" },
        { http_param: "license", es_field: "license_code" },
        { http_param: "photo_license", es_field: ["photos.license_code", "photo_licenses"] },
        { http_param: "sound_license", es_field: ["sounds.license_code", "sound_licenses"] }
      ], filter => {
        const qp = { };
        // single values (user_id only accepts integers)
        const vSingle = ( filter.http_param === "user_id" ) ? "99" : "test";
        // multiple values (user_id only accepts integers)
        const vArray = ( filter.http_param === "user_id" ) ? ["98", "99"] : ["test1", "test2"];
        if ( _.isArray( filter.es_field ) ) {
          qp[filter.http_param] = vSingle;
          Q( qp, ( e, q ) => { eq = q; } );
          let f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { terms: { [ff]: [vSingle] } } ) )
            }
          };
          expect( eq.filters ).to.eql( [f] );
          // Array values
          qp[filter.http_param] = vArray;
          Q( qp, ( e, q ) => { eq = q; } );
          f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { terms: { [ff]: vArray } } ) )
            }
          };
          expect( eq.filters ).to.eql( [f] );
        } else {
          qp[filter.http_param] = vSingle;
          Q( qp, ( e, q ) => { eq = q; } );
          let f = { terms: { } };
          f.terms[filter.es_field] = [vSingle];
          expect( eq.filters ).to.eql( [f] );
          // Array values
          qp[filter.http_param] = vArray;
          Q( qp, ( e, q ) => { eq = q; } );
          f = { terms: { } };
          f.terms[filter.es_field] = vArray;
          expect( eq.filters ).to.eql( [f] );
        }
      } );
    } );

    it( "filters by booleans", ( ) => {
      _.each( [{ http_param: "introduced", es_field: "taxon.introduced" },
        { http_param: "threatened", es_field: "taxon.threatened" },
        { http_param: "native", es_field: "taxon.native" },
        { http_param: "endemic", es_field: "taxon.endemic" },
        { http_param: "id_please", es_field: "id_please" },
        { http_param: "out_of_range", es_field: "out_of_range" },
        { http_param: "mappable", es_field: "mappable" },
        { http_param: "captive", es_field: "captive" }
      ], filter => {
        const qp = { };
        // true values
        qp[filter.http_param] = "true";
        Q( qp, ( e, q ) => { eq = q; } );
        let f = { terms: { } };
        f.terms[filter.es_field] = [true];
        expect( eq.filters ).to.eql( [f] );
        // false values
        qp[filter.http_param] = "false";
        Q( qp, ( e, q ) => { eq = q; } );
        f = { term: { } };
        f.term[filter.es_field] = false;
        expect( eq.filters ).to.eql( [f] );
      } );
    } );

    it( "filters by attribute presence", ( ) => {
      _.each( [{ http_param: "photos", es_field: ["photos.url", "photos_count"] },
        { http_param: "sounds", es_field: ["sounds", "sounds_count"] },
        { http_param: "geo", es_field: "geojson" },
        { http_param: "identified", es_field: "taxon" }
      ], filter => {
        const qp = { };
        if ( _.isArray( filter.es_field ) ) {
          // true values
          qp[filter.http_param] = "true";
          Q( qp, ( e, q ) => { eq = q; } );
          const f = {
            bool: {
              should: _.map( filter.es_field, ff => ( { exists: { field: ff } } ) )
            }
          };
          expect( eq.filters ).to.eql( [f] );
          // false values
          qp[filter.http_param] = "false";
          Q( qp, ( e, q ) => { eq = q; } );
          expect( eq.inverse_filters ).to.eql( [f] );
        } else {
          // true values
          qp[filter.http_param] = "true";
          Q( qp, ( e, q ) => { eq = q; } );
          const f = { exists: { field: filter.es_field } };
          expect( eq.filters ).to.eql( [f] );
          // false values
          qp[filter.http_param] = "false";
          Q( qp, ( e, q ) => { eq = q; } );
          expect( eq.inverse_filters ).to.eql( [f] );
        }
      } );
    } );

    it( "filters by verifiable true", ( ) => {
      Q( { verifiable: "true" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { quality_grade: ["needs_id", "research"] } }] );
    } );

    it( "filters by verifiable false", ( ) => {
      Q( { verifiable: "false" }, ( e, q ) => { eq = q; } );
      expect( eq.inverse_filters ).to.eql( [
        { terms: { quality_grade: ["needs_id", "research"] } }] );
    } );

    it( "filters by observed_on", ( ) => {
      Q( { observed_on: "2009-10-11" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { "observed_on_details.day": [11] } },
        { terms: { "observed_on_details.month": [10] } },
        { terms: { "observed_on_details.year": [2009] } }] );
    } );

    it( "filters by on", ( ) => {
      Q( { on: "2009-10-11" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { "observed_on_details.day": [11] } },
        { terms: { "observed_on_details.month": [10] } },
        { terms: { "observed_on_details.year": [2009] } }] );
    } );

    it( "filters by created_on", ( ) => {
      Q( { created_on: "2009-10-11" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { "created_at_details.day": [11] } },
        { terms: { "created_at_details.month": [10] } },
        { terms: { "created_at_details.year": [2009] } }] );
    } );

    it( "filters by project_id", ( ) => {
      Q( { project_id: 3 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { project_ids: [3] } }] );
    } );

    it( "filters by project_id and ignores bad pcid values", ( ) => {
      Q( { project_id: 3, pcid: "bad" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { project_ids: [3] } }] );
    } );

    it( "filters by project_id and pcid=true", ( ) => {
      Q( { project_id: 3, pcid: "true" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { project_ids: [3] } },
        { terms: { project_ids_with_curator_id: [3] } }] );
    } );

    it( "filters by project_id and pcid=false", ( ) => {
      Q( { project_id: 3, pcid: "false" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [
        { terms: { project_ids: [3] } },
        { terms: { project_ids_without_curator_id: [3] } }] );
    } );

    it( "ignores bad pcid values", ( ) => {
      Q( { pcid: "bad" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.be.empty;
    } );

    it( "filters by pcid=true", ( ) => {
      Q( { pcid: "true" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ exists: { field: "project_ids_with_curator_id" } }] );
    } );

    it( "filters by pcid=false", ( ) => {
      Q( { pcid: "false" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ exists: { field: "project_ids_without_curator_id" } }] );
    } );

    it( "filters by project_ids", ( ) => {
      Q( { project_ids: [4, 5] }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { project_ids: [4, 5] } }] );
    } );

    it( "filters by lrank", ( ) => {
      Q( { lrank: "family" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        range: { "taxon.rank_level": { gte: 30, lte: 100 } }
      }] );
    } );

    it( "filters by hrank", ( ) => {
      Q( { hrank: "class" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        range: { "taxon.rank_level": { gte: 0, lte: 50 } }
      }] );
    } );

    it( "filters by quality grade except 'any'", ( ) => {
      Q( { quality_grade: "research" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { quality_grade: ["research"] } }] );
      Q( { quality_grade: "any" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.be.empty;
    } );

    it( "filters by identifications most_agree", ( ) => {
      Q( { identifications: "most_agree" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { identifications_most_agree: [true] } }] );
    } );

    it( "filters by identifications some_agree", ( ) => {
      Q( { identifications: "some_agree" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { identifications_some_agree: [true] } }] );
    } );

    it( "filters by identifications most_disagree", ( ) => {
      Q( { identifications: "most_disagree" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { identifications_most_disagree: [true] } }] );
    } );

    it( "filters by bounding box", ( ) => {
      Q( {
        nelat: 1,
        nelng: 2,
        swlat: 3,
        swlng: 4
      }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
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

    it( "filters by point and radius", ( ) => {
      Q( { lat: 10, lng: 20, radius: 30 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        geo_distance: { distance: "30km", location: { lat: 10, lon: 20 } }
      }] );
    } );

    it( "defaults to a radius of 10k", ( ) => {
      Q( { lat: 10, lng: 20 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        geo_distance: { distance: "10km", location: { lat: 10, lon: 20 } }
      }] );
    } );

    it( "filters by iconic_taxa", ( ) => {
      Q( { iconic_taxa: ["Animalia", "Plantae"] }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { "taxon.iconic_taxon_id": [103, 111] } }] );
    } );

    it( "filters by unknown iconic_taxa", ( ) => {
      Q( { iconic_taxa: ["Animalia", "Plantae", "unknown"] }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        bool: {
          should: [
            { terms: { "taxon.iconic_taxon_id": [103, 111] } },
            { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" } } } }
          ]
        }
      }] );
    } );

    it( "filters observed_on by date", ( ) => {
      Q( { d1: "2015-01-01T00:00:00+00:00", d2: "2015-02-02T23:59:59+00:00" },
        ( e, q ) => { eq = q; } );
      const shoulds = eq.filters[0].bool.should;
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

    it( "does nothing without an invalid date", ( ) => {
      Q( { d1: "nonsense" }, ( e, q ) => { eq = q; } );
      expect( eq.where ).to.be.undefined;
      expect( eq.filters ).to.be.empty;
      Q( { d2: "nonsense" }, ( e, q ) => { eq = q; } );
      expect( eq.where ).to.be.undefined;
      expect( eq.filters ).to.be.empty;
    } );

    it( "defaults d2 to tomorrow", ( ) => {
      Q( { d1: "2015-01-01" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].range["observed_on_details.date"] ).to.eql( {
        gte: "2015-01-01",
        lte: moment.utc( ).add( 2, "day" ).format( "YYYY-MM-DD" )
      } );
    } );

    it( "defaults d1 to 1800-01-01", ( ) => {
      Q( { d2: "2015-02-02" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].range["observed_on_details.date"] ).to.eql( {
        gte: "1800-01-01",
        lte: "2015-02-02"
      } );
    } );

    it( "filters created_at time", ( ) => {
      Q( { created_d1: "2015-01-01T00:00:00+00:00", created_d2: "2015-02-02T23:59:59+00:00" },
        ( e, q ) => { eq = q; } );
      expect( eq.filters[0].range.created_at ).to.eql( {
        gte: "2015-01-01T00:00:00+00:00",
        lte: "2015-02-02T23:59:59+00:00"
      } );
    } );

    it( "filters by not_in_project", ( ) => {
      Q( { not_in_project: [6, 7] }, ( e, q ) => { eq = q; } );
      expect( eq.inverse_filters ).to.eql( [{ terms: { project_ids: [6, 7] } }] );
    } );

    it( "filters by featured observation", ( ) => {
      Q( { featured_observation_id: 8 }, ( e, q ) => { eq = q; } );
      expect( eq.inverse_filters ).to.eql( [{ term: { id: 8 } }] );
    } );

    it( "filters by updated_since", ( ) => {
      Q( { updated_since: "2015-01-02T00:00:00+00:00" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        range: { updated_at: { gte: "2015-01-02T00:00:00+00:00" } }
      }] );
    } );

    it( "ignores bad updated_since values", ( ) => {
      Q( { updated_since: "nonsense" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.be.empty;
    } );

    it( "filters by observed_after", ( ) => {
      Q( { observed_after: "2015-01-02T00:00:00+00:00" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{
        range: { observed_on: { gte: "2015-01-02T00:00:00+00:00" } }
      }] );
    } );

    it( "filters by observation fields", ( ) => {
      Q( { "field:habitat": null }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter.length ).to.eql( 1 );
      expect( eq.filters[0].nested.query.bool.filter[0].match["ofvs.name_ci"] ).to.eql( "habitat" );
    } );

    it( "filters by observation field values", ( ) => {
      Q( { "field:habitat": "marine" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].nested.query.bool.filter.length ).to.eql( 2 );
      expect( eq.filters[0].nested.query.bool.filter[0].match["ofvs.name_ci"] ).to.eql( "habitat" );
      expect( eq.filters[0].nested.query.bool.filter[1].match["ofvs.value_ci"] ).to.eql( "marine" );
    } );

    it( "filters by conservation status", ( ) => {
      Q( { cs: "endangered" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.status"][0] ).to.eql( "endangered" );
    } );

    it( "filters by conservation status with a place", ( ) => {
      Q( { cs: "endangered", place_id: 1 }, ( e, q ) => { eq = q; } );
      expect( eq.filters[1].nested.query.bool.filter[1].bool.should[0]
        .terms["taxon.statuses.place_id"] ).to.eql( [1] );
      expect( eq.filters[1].nested.query.bool.filter[1].bool.should[1]
        .bool.must_not.exists.field ).to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[1].nested.query.bool.filter[0]
        .terms["taxon.statuses.status"][0] ).to.eql( "endangered" );
    } );

    it( "filters by iucn conservation status", ( ) => {
      Q( { csi: "en" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.iucn"][0] ).to.eql( 40 );
    } );

    it( "ignores bad values for csi", ( ) => {
      Q( { csi: "bad" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.be.empty;
    } );

    it( "filters by conservation status authority", ( ) => {
      Q( { csa: "natureserve" }, ( e, q ) => { eq = q; } );
      expect( eq.filters[0].nested.query.bool.must_not[0].exists.field )
        .to.eql( "taxon.statuses.place_id" );
      expect( eq.filters[0].nested.query.bool.filter[0]
        .terms["taxon.statuses.authority"][0] ).to.eql( "natureserve" );
    } );

    it( "filters by popular", ( ) => {
      Q( { popular: "true" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ range: { cached_votes_total: { gte: 1 } } }] );
      Q( { popular: "false" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ term: { cached_votes_total: 0 } }] );
    } );

    it( "filters by id_above", ( ) => {
      Q( { id_above: 51 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ range: { id: { gt: 51 } } }] );
    } );

    it( "filters by reviewed true", ( ) => {
      Q( { reviewed: "true", viewer_id: 21 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { reviewed_by: [21] } }] );
    } );

    it( "filters by reviewed false", ( ) => {
      Q( { reviewed: "false", viewer_id: 21 }, ( e, q ) => { eq = q; } );
      expect( eq.inverse_filters ).to.eql( [{ term: { reviewed_by: 21 } }] );
    } );

    it( "ignored bad values for reviewed", ( ) => {
      Q( { reviewed: "bad", viewer_id: 21 }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.be.empty;
    } );

    it( "filters by geoprivacy", ( ) => {
      Q( { geoprivacy: "whatever" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { geoprivacy: ["whatever"] } }] );
    } );

    it( "filters by geoprivacy open", ( ) => {
      Q( { geoprivacy: "open" }, ( e, q ) => { eq = q; } );
      expect( eq.inverse_filters ).to.eql( [{ exists: { field: "geoprivacy" } }] );
    } );

    it( "filters by geoprivacy obscured_private", ( ) => {
      Q( { geoprivacy: "obscured_private" }, ( e, q ) => { eq = q; } );
      expect( eq.filters ).to.eql( [{ terms: { geoprivacy: ["obscured", "private"] } }] );
    } );

    //
    // Sorting
    //
    it( "sorts by created_at desc by default", ( ) => {
      Q( { }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( { created_at: "desc" } );
    } );

    it( "allows sorting asc", ( ) => {
      Q( { order: "asc" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( { created_at: "asc" } );
    } );

    it( "sorts by observed_on desc", ( ) => {
      Q( { order_by: "observed_on" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( {
        created_at: "desc",
        "observed_on_details.date": "desc",
        time_observed_at: {
          missing: "_last",
          order: "desc"
        }
      } );
    } );

    it( "sorts by observed_on asc", ( ) => {
      Q( { order_by: "observed_on", order: "asc" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( {
        created_at: "asc",
        "observed_on_details.date": "asc",
        time_observed_at: {
          missing: "_first",
          order: "asc"
        }
      } );
    } );

    it( "sorts by species_guess", ( ) => {
      Q( { order_by: "species_guess" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( { species_guess: "desc" } );
    } );

    it( "sorts by votes", ( ) => {
      Q( { order_by: "votes" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( { cached_votes_total: "desc" } );
    } );

    it( "sorts by id", ( ) => {
      Q( { order_by: "id" }, ( e, q ) => { eq = q; } );
      expect( eq.sort ).to.eql( { id: "desc" } );
    } );
  } );

  describe( "index", ( ) => {
    it( "fetches results", done => {
      ObservationsController.search( { query: { } }, ( ) => {
        // this needs some work - fixtures, etc
        done( );
      } );
    } );
  } );

  describe( "projectsQueryFilters", ( ) => {
    it( "fetches results", done => {
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
        query: {
          taxon_id: 1,
          project_id: "test-project,12"
        },
        inat: {
          project: projects
        }
      };
      ObservationsController.applyCollectionProjectRules( req, { }, ( err, components ) => {
        expect( components.search_filters[0] ).to.deep.eq( {
          terms: {
            "taxon.ancestor_ids": [1]
          }
        } );
        expect( components.search_filters[1].bool.should ).to.not.be.undefined;
        const shoulds = components.search_filters[1].bool.should;
        expect( shoulds[0] ).to.deep.eq( {
          bool: {
            must: [
              {
                terms: {
                  "taxon.ancestor_ids": ["1"]
                }
              },
              {
                terms: {
                  quality_grade: [
                    "needs_id",
                    "research"
                  ]
                }
              }
            ],
            must_not: []
          }
        } );
        // the "collection" project slug will be removed from project_id param
        expect( shoulds[1] ).to.deep.eq( {
          bool: {
            must: [{
              terms: {
                project_ids: ["12"]
              }
            }]
          }
        } );
        done( );
      } );
    } );
  } );
} );
