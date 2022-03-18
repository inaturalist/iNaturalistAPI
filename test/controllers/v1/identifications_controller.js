const _ = require( "lodash" );
const { expect } = require( "chai" );
const fs = require( "fs" );
const { identifications } = require( "inaturalistjs" );
const testHelper = require( "../../../lib/test_helper" );
const Identification = require( "../../../lib/models/identification" );
const IdentificationsController = require( "../../../lib/controllers/v1/identifications_controller" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

const Q = async params => {
  const queryString = _.reduce( params, ( components, value, key ) => {
    components.push( `${key}=${( value ? encodeURIComponent( value ) : "" )}` );
    return components;
  }, [] ).join( "&" );
  return IdentificationsController.reqToElasticQuery( {
    query: params,
    _parsedUrl: { query: queryString }
  } );
};

describe( "IdentificationsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "create", Identification, done
    );
  } );

  it( "updates", done => {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "update", Identification, done
    );
  } );

  it( "deletes", done => {
    testHelper.testInatJSNoPreload(
      IdentificationsController, identifications, "delete", done
    );
  } );

  describe( "reqToElasticQuery", ( ) => {
    it( "defaults to current=true", async ( ) => {
      const q = await Q( { } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms.current && f.terms.current[0] === "true"
      ) ) ).to.not.be.undefined;
    } );

    it( "can set current to false", async ( ) => {
      const q = await Q( { current: "false" } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms.current && f.terms.current[0] === "false"
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by taxon_id", async ( ) => {
      const q = await Q( { taxon_id: 88 } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms["taxon.ancestor_ids.keyword"]
          && f.terms["taxon.ancestor_ids.keyword"][0] === 88
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by user login", async ( ) => {
      const q = await Q( { user_id: "a-user" } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms["user.login"]
          && f.terms["user.login"][0] === "a-user"
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by boolean true params", async ( ) => {
      const q = await Q( { current_taxon: "true" } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms.current_taxon && f.terms.current_taxon[0] === true
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by boolean false params", async ( ) => {
      const q = await Q( { current_taxon: "false" } );
      expect( _.find( q.filters, f => (
        f.term && f.term.current_taxon === false
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by without_taxon_id", async ( ) => {
      const q = await Q( { without_taxon_id: 89 } );
      expect( _.find( q.inverse_filters, f => (
        f.terms && f.terms["taxon.ancestor_ids.keyword"]
          && f.terms["taxon.ancestor_ids.keyword"][0] === 89
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by without_observation_taxon_id", async ( ) => {
      const q = await Q( { without_observation_taxon_id: 90 } );
      expect( _.find( q.inverse_filters, f => (
        f.terms && f.terms["observation.taxon.ancestor_ids.keyword"]
          && f.terms["observation.taxon.ancestor_ids.keyword"][0] === 90
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by exact_taxon_id", async ( ) => {
      const q = await Q( { exact_taxon_id: 89 } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms["taxon.id.keyword"]
          && f.terms["taxon.id.keyword"][0] === 89
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by exact_observation_taxon_id", async ( ) => {
      const q = await Q( { exact_observation_taxon_id: 89 } );
      expect( _.find( q.filters, f => (
        f.terms && f.terms["observation.taxon.id.keyword"]
          && f.terms["observation.taxon.id.keyword"][0] === 89
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by not_in_place", async ( ) => {
      const q = await Q( { not_in_place: 89 } );
      expect( _.find( q.inverse_filters, f => (
        f.terms && f.terms["observation.place_ids.keyword"]
          && f.terms["observation.place_ids.keyword"][0] === 89
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by booleans true", async ( ) => {
      const q = await Q( { is_change: "true" } );
      expect( _.find( q.filters, f => (
        f.exists && f.exists.field === "taxon_change.id"
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by booleans false", async ( ) => {
      const q = await Q( { is_change: "false" } );
      expect( _.find( q.inverse_filters, f => (
        f.exists && f.exists.field === "taxon_change.id"
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by lrank", async ( ) => {
      const q = await Q( { lrank: "species" } );
      expect( _.find( q.filters, f => (
        f.range && f.range["taxon.rank_level"]
          && f.range["taxon.rank_level"].gte === 10
          && f.range["taxon.rank_level"].lte === 100
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by hrank", async ( ) => {
      const q = await Q( { hrank: "family" } );
      expect( _.find( q.filters, f => (
        f.range && f.range["taxon.rank_level"]
          && f.range["taxon.rank_level"].gte === 0
          && f.range["taxon.rank_level"].lte === 30
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by observation_lrank", async ( ) => {
      const q = await Q( { observation_lrank: "species" } );
      expect( _.find( q.filters, f => (
        f.range && f.range["observation.taxon.rank_level"]
          && f.range["observation.taxon.rank_level"].gte === 10
          && f.range["observation.taxon.rank_level"].lte === 100
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by observation_hrank", async ( ) => {
      const q = await Q( { observation_hrank: "family" } );
      expect( _.find( q.filters, f => (
        f.range && f.range["observation.taxon.rank_level"]
          && f.range["observation.taxon.rank_level"].gte === 0
          && f.range["observation.taxon.rank_level"].lte === 30
      ) ) ).to.not.be.undefined;
    } );

    // This is not going to work since we made created_at_details.date
    // un-indexed in
    // https://github.com/inaturalist/inaturalist/commit/a255f8bfeadea3c9d1e84476ab46b390a0436b3d#diff-160cb782bfe2c6e20fac5367817660c5R17
    // it( "filters by d1/d2", ( ) => {
    //   Q( { d1: "2016-01-01T01:00:00", d2: "2017-01-01T01:00:00" }, ( e, q ) => { eq = q; } );
    //   expect( _.find( eq.filters, f => (
    //     f.bool && f.bool.should && f.bool.should[0].bool && f.bool.should[0].bool.filter && f.bool.should[0].bool.filter[0].range
    //       && f.bool.should[0].bool.filter[0].range.created_at.gte === "2016-01-01T01:00:00+00:00"
    //       && f.bool.should[0].bool.filter[0].range.created_at.lte === "2017-01-01T01:00:00+00:00"
    //   ) ) ).to.not.be.undefined;
    // } );

    it( "filters by observed_d1/d2", async ( ) => {
      const q = await Q( { observed_d1: "2016-01-01T01:00:00", observed_d2: "2017-01-01T01:00:00" } );
      expect( _.find( q.filters, f => (
        f.range && f.range["observation.observed_on"]
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by observation_created_d1/d2", async ( ) => {
      const q = await Q( {
        observation_created_d1: "2016-01-01T01:00:00",
        observation_created_d2: "2017-01-01T01:00:00"
      } );
      expect( _.find( q.filters, f => (
        f.range && f.range["observation.created_at"]
          && f.range["observation.created_at"].gte === "2016-01-01T01:00:00+00:00"
          && f.range["observation.created_at"].lte === "2017-01-01T01:00:00+00:00"
      ) ) ).to.not.be.undefined;
    } );

    it( "filters by id_above", async ( ) => {
      const q = await Q( { id_above: 51 } );
      expect( q.filters ).to.deep.include( { range: { id: { gt: 51 } } } );
    } );

    it( "filters by id_below", async ( ) => {
      const q = await Q( { id_below: 51 } );
      expect( q.filters ).to.deep.include( { range: { id: { lt: 51 } } } );
    } );

    it( "sorts by created_at desc by default", async ( ) => {
      const q = await Q( { } );
      expect( q.sort ).to.deep.eq( { created_at: "desc" } );
    } );

    it( "can sort ascending", async ( ) => {
      const q = await Q( { order: "asc" } );
      expect( q.sort ).to.deep.eq( { created_at: "asc" } );
    } );

    it( "can sort by id", async ( ) => {
      const q = await Q( { order_by: "id" } );
      expect( q.sort ).to.deep.eq( { id: "desc" } );
    } );
  } );

  describe( "search", ( ) => {
    it( "returns identifications", done => {
      IdentificationsController.search( { query: { } } ).then( r => {
        expect( r.total_results ).to
          .eq( fixtures.elasticsearch.identifications.identification.length );
        done( );
      } );
    } );
  } );

  describe( "show", ( ) => {
    it( "returns identifications", done => {
      IdentificationsController.show( { params: { id: "102" }, query: { } } ).then( r => {
        expect( r.total_results ).to.eq( 1 );
        done( );
      } );
    } );
  } );

  describe( "categories", ( ) => {
    it( "returns identification counts grouped by category", done => {
      IdentificationsController.categories( { query: { } } ).then( r => {
        expect( r.total_results ).to.eq(
          _.uniqBy( _.filter( fixtures.elasticsearch.identifications.identification,
            i => i.category ), i => i.category ).length
        );
        expect( r.results[0].category ).to.eq( "leading" );
        expect( r.results[0].count ).to.eq(
          _.filter( fixtures.elasticsearch.identifications.identification,
            i => i.category === "leading" ).length
        );
        done( );
      } );
    } );
  } );


  describe( "speciesCounts", ( ) => {
    it( "returns taxa", done => {
      IdentificationsController.speciesCounts( { query: { } } ).then( r => {
        expect( r.total_results ).to.eq(
          _.uniqBy( _.filter( fixtures.elasticsearch.identifications.identification,
            i => i.taxon ), i => i.taxon.id ).length
        );
        expect( r.results[0].count ).to.above( 0 );
        expect( r.results[0].taxon.id ).to.eq( 5 );
        done( );
      } );
    } );
  } );

  describe( "identifiers", ( ) => {
    it( "returns identification counts grouped by identifier", done => {
      IdentificationsController.identifiers( { query: { } } ).then( r => {
        expect( r.total_results ).to.eq(
          _.uniqBy( _.filter( fixtures.elasticsearch.identifications.identification,
            i => i.user ), i => i.user.id ).length
        );
        expect( r.results[0].count ).to.eq(
          _.filter(
            fixtures.elasticsearch.identifications.identification,
            i => i.user && i.user.id === r.results[0].user.id
          ).length
        );
        expect( r.results[0].user.id ).to.not.be.undefined;
        done( );
      } );
    } );
  } );

  describe( "observers", ( ) => {
    it( "returns identification counts grouped by observer", done => {
      IdentificationsController.observers( { query: { } } ).then( r => {
        expect( r.total_results ).to.eq(
          _.uniqBy( _.filter( fixtures.elasticsearch.identifications.identification,
            i => i.observation ), i => i.observation.user_id ).length
        );
        expect( r.results[0].count ).to.eq(
          _.filter(
            fixtures.elasticsearch.identifications.identification,
            i => i.observation && i.observation.user_id === r.results[0].user.id
          ).length
        );
        expect( r.results[0].user.id ).to.not.be.undefined;
        done( );
      } );
    } );
  } );
} );
