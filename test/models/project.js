const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const Project = require( "../../lib/models/project" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "Project", ( ) => {
  describe( "findByID", ( ) => {
    it( "returns a project given an ID", async ( ) => {
      const p = await Project.findByID( 543 );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns a project from the cache", async ( ) => {
      const p = await Project.findByID( 543 );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns a project given a slug", async ( ) => {
      const p = await Project.findByID( "a-project" );
      expect( p.id ).to.eq( 543 );
      expect( p.title ).to.eq( "A Project" );
    } );

    it( "returns false if the slug cannot be queried for", async ( ) => {
      expect( await Project.findByID( "'" ) ).to.be.false;
    } );

    it( "returns null given an unknown ID", async ( ) => {
      const p = await Project.findByID( 5 );
      expect( p ).to.eq( false );
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns false if none exists", async ( ) => {
      const p = new Project( { id: "3333" } );
      const l = await p.projectList( );
      expect( l ).to.be.false;
    } );
  } );

  describe( "searchParams", ( ) => {
    it( "returns params for project rules", async ( ) => {
      const p = await Project.findByID( 543 );
      const params = await p.searchParams( );
      expect( params.d1 ).to.eq( "2016-02-02T02:22:22+00:00" );
      expect( params.d2 ).to.eq( "2016-05-05T05:55:55+00:00" );
      expect( params.identified ).to.eq( "true" );
      expect( params.captive ).to.eq( "false" );
      expect( params.has.sort( ) ).to.deep.eq( ["geo", "photos", "sounds"] );
      // some of these come from the project list
      expect( params.taxon_ids.sort( ) ).to.deep.eq( [444, 555, 876, 987] );
      expect( params.place_id.sort( ) ).to.deep.eq( [222, 333] );
      expect( params.verifiable ).to.eq( "true" );
    } );

    it( "can use dates instead of times", async ( ) => {
      const p = await Project.findByID( 543 );
      p.date_range_preference = true;
      const params = await p.searchParams( );
      expect( params.d1 ).to.eq( "2016-02-02" );
      expect( params.d2 ).to.eq( "2016-05-05" );
    } );

    it( "doesn't params if the rules don't apply", async ( ) => {
      const p = await Project.findByID( 543 );
      p.rules = [];
      p.start_time = null;
      p.end_time = null;
      p.list = null;
      const params = await p.searchParams( );
      expect( params.d1 ).to.be.undefined;
      expect( params.d2 ).to.be.undefined;
      expect( params.list_id ).to.be.undefined;
      expect( params.taxon_ids ).to.be.undefined;
      expect( params.place_id ).to.be.undefined;
      expect( params.verifiable ).to.be.undefined;
    } );
  } );

  describe( "collectionProjectRulesAllowObservation", ( ) => {
    let observation;
    let project;

    const buildProject = ( parameters = {} ) => ( {
      search_parameter_fields: parameters
    } );

    it( "d1 allows observed date to be equal", ( ) => {
      project = buildProject( { d1: "2025-03-01" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d1 allows later observed dates", ( ) => {
      project = buildProject( { d1: "2025-02-01" } );
      observation = { observed_on: "2025-02-02" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d1 does not allow earlier observed dates", ( ) => {
      project = buildProject( { d1: "2025-03-02" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d1 with times allows same or later dates", ( ) => {
      project = buildProject( { d1: "2025-03-01T00:00:00Z" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d1: "2025-03-01T00:00:00-07:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d1: "2025-03-01T23:59:59+12:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: "2025-03-02" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d1: "2025-03-02T05:00:00-05:00" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-03-02T06:00:00-03:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-03-02T04:00:00-07:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d1 with times does not allow earlier dates", ( ) => {
      project = buildProject( { d1: "2025-03-02T00:00:00Z" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      project = buildProject( { d1: "2025-03-02T00:00:00-07:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      project = buildProject( { d1: "2025-03-02T23:59:59+12:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { observed_on: "2025-03-03" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d1 requires an observed date", ( ) => {
      project = buildProject( { d1: "2025-03-01" } );
      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { observed_on: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d1 blank values are ignored", ( ) => {
      project = buildProject( );
      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: "2025-02-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d1 does not allow earlier observed time", ( ) => {
      project = buildProject( { d1: "2025-02-01" } );
      observation = { time_observed_at: "2025-01-31T23:59:59+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-01-31T23:59:59+12:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-01-31T23:59:59-05:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d1 allows exact and later observed times", ( ) => {
      project = buildProject( { d1: "2025-02-01" } );
      observation = { time_observed_at: "2025-02-01T00:00:00+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-02-01T01:00:00+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-02-01T01:00:00+12:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-02-01T00:00:00-05:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d2 allows observed date to be equal", ( ) => {
      project = buildProject( { d2: "2025-03-01" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d2 allows ealier observed dates", ( ) => {
      project = buildProject( { d2: "2025-03-02" } );
      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d2 does not allow later observed dates", ( ) => {
      project = buildProject( { d2: "2025-02-01" } );
      observation = { observed_on: "2025-02-02" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d2 with times allows same or earlier dates", ( ) => {
      project = buildProject( { d2: "2025-03-02T00:00:00Z" } );
      observation = { observed_on: "2025-03-02" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d2: "2025-03-02T00:00:00-07:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d2: "2025-03-02T23:59:59+12:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      project = buildProject( { d2: "2025-03-02T05:00:00-05:00" } );
      observation = { observed_on: "2025-03-03" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-03-02T06:00:00-03:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-03-02T04:00:00-07:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d2 with times does not allow later dates", ( ) => {
      project = buildProject( { d2: "2025-03-02T00:00:00Z" } );
      observation = { observed_on: "2025-03-03" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      project = buildProject( { d2: "2025-03-02T00:00:00-07:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      project = buildProject( { d2: "2025-03-02T23:59:59+12:00" } );
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { observed_on: "2025-03-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d2 requires an observed date", ( ) => {
      project = buildProject( { d2: "2025-03-01" } );
      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { observed_on: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d2 blank values are ignored", ( ) => {
      project = buildProject( );
      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on: "2025-02-01" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "d2 does not allow later observed times", ( ) => {
      project = buildProject( { d2: "2025-02-01" } );
      observation = { time_observed_at: "2025-02-02T00:00:00+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-02-02T00:00:00+12:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { time_observed_at: "2025-02-02T00:00:00-05:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "d2 allows exact and earlier observed times", ( ) => {
      project = buildProject( { d2: "2025-02-01" } );
      observation = { time_observed_at: "2025-02-01T00:00:00+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-01-31T23:59:59+00:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-02-01T23:59:59+12:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { time_observed_at: "2025-02-01T00:00:00-05:00" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "observed_on must match if present", ( ) => {
      project = buildProject( { observed_on: "2025-02-01" } );
      observation = { observed_on_details: { date: "2025-02-01" } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { observed_on_details: { date: "2025-03-01" } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "month must match if present", ( ) => {
      project = buildProject( { month: [2, 3] } );
      observation = { observed_on_details: { month: 2 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { observed_on_details: { month: 3 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { observed_on_details: { month: 4 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "members_only requires membership", ( ) => {
      project = buildProject( { members_only: true } );
      project.user_ids = [99, 100];
      observation = { user: { id: 99 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { user: { id: 100 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { user: { id: 101 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      project.user_ids = [];
      observation = { user: { id: 99 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "place_id requires place overlap", ( ) => {
      project = buildProject( { place_id: [99, 100] } );
      observation = { place_ids: [99, 100] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { place_ids: [98, 99] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { place_ids: [100, 101] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { place_ids: [101, 102] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { place_ids: [99] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { place_ids: [98] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "not_in_place disallows place overlap", ( ) => {
      project = buildProject( { not_in_place: [99, 100] } );
      observation = { place_ids: [99, 100] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { place_ids: [98, 99] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { place_ids: [100, 101] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { place_ids: [101, 102] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { place_ids: [99] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { place_ids: [98] };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "taxon_id requires taxon overlap", ( ) => {
      project = buildProject( { taxon_id: [99, 100] } );
      observation = { taxon: { ancestor_ids: [99, 100] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { ancestor_ids: [98, 99] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { ancestor_ids: [100, 101] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { ancestor_ids: [101, 102] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { ancestor_ids: [99] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { ancestor_ids: [98] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "without_taxon_id disallows taxon overlap", ( ) => {
      project = buildProject( { without_taxon_id: [99, 100] } );
      observation = { taxon: { ancestor_ids: [99, 100] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { ancestor_ids: [98, 99] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { ancestor_ids: [100, 101] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { ancestor_ids: [101, 102] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { ancestor_ids: [99] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { ancestor_ids: [98] } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );

    it( "quality_grade must match if present", ( ) => {
      project = buildProject( { quality_grade: ["research", "verifiable"] } );
      observation = { quality_grade: "research" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { quality_grade: "verifiable" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { quality_grade: "casual" };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "photos requires photos to be present", ( ) => {
      project = buildProject( { photos: true } );
      observation = { photos_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { photos_count: 0 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { photos_count: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "sounds requires sounds to be present", ( ) => {
      project = buildProject( { sounds: true } );
      observation = { sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { sounds_count: 0 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { sounds_count: null };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { photos_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "photos and sounds can both be required", ( ) => {
      project = buildProject( { photos: true, sounds: true } );
      observation = { photos_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { photos_count: 1, sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { photos_count: 0, sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { photos_count: null, sounds_count: 1 };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "native requires taxon to be native", ( ) => {
      project = buildProject( { native: true } );
      observation = { taxon: { native: true } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { native: false } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "introduced requires taxon to be introduced", ( ) => {
      project = buildProject( { introduced: true } );
      observation = { taxon: { introduced: true } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { taxon: { introduced: false } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { taxon: { } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "captive requires observation to be captive", ( ) => {
      project = buildProject( { captive: true } );
      observation = { captive: true };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { captive: false };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "term_id requires annotation controlled_attribute_id overlap", ( ) => {
      project = buildProject( { term_id: 99 } );
      observation = {
        annotations: [{
          controlled_attribute_id: 99
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = {
        annotations: [{
          controlled_attribute_id: 100
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = {
        annotations: [{
          controlled_attribute_id: 99
        }, {
          controlled_attribute_id: 100
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = {
        annotations: [{
          controlled_attribute_id: 100
        }, {
          controlled_attribute_id: 101
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = {
        annotations: [{
          controlled_attribute_id: 101
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "term_value_id requires annotation controlled_value_id overlap", ( ) => {
      project = buildProject( { term_value_id: 99 } );
      observation = {
        annotations: [{
          controlled_value_id: 99
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = {
        annotations: [{
          controlled_value_id: 100
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = {
        annotations: [{
          controlled_value_id: 99
        }, {
          controlled_value_id: 100
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = {
        annotations: [{
          controlled_value_id: 100
        }, {
          controlled_value_id: 101
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = {
        annotations: [{
          controlled_value_id: 101
        }]
      };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "user_id must match if present", ( ) => {
      project = buildProject( { user_id: [2, 3] } );
      observation = { user: { id: 2 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { user: { id: 3 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
      observation = { user: { id: 4 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
    } );

    it( "not_user_id disallows matching user_ids", ( ) => {
      project = buildProject( { not_user_id: [2, 3] } );
      observation = { user: { id: 2 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { user: { id: 3 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.false;
      observation = { user: { id: 4 } };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;

      observation = { };
      expect( Project.collectionProjectRulesAllowObservation( project, observation ) ).to.be.true;
    } );
  } );
} );
