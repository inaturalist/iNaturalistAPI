const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const fs = require( "fs" );
const _ = require( "lodash" );
const Observation = require( "../../lib/models/observation" );
const ObservationPreload = require( "../../lib/models/observation_preload" );

const { expect } = chai;
chai.use( chaiAsPromised );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "ObservationPreload", ( ) => {
  describe( "observationPhotos", ( ) => {
    it( "replaces copyright flagged photo URLs", async ( ) => {
      const obsWithFlaggedPhoto = _.find( fixtures.elasticsearch.observations.observation,
        o => o.description && o.description.match( "copyright violation" ) );
      const obs = [new Observation( obsWithFlaggedPhoto )];
      await ObservationPreload.observationPhotos( obs );
      expect( obs[0].photos[0].url ).to.match( /copyright-infringement/ );
      expect( _.size( obs[0].photos[0].flags ) ).to.eq( 1 );
      expect( obs[0].photos[0].flags[0].flag ).to.eq( "copyright infringement" );
      expect( obs[0].photos[0].flags[0].resolved ).to.be.false;
    } );

    it( "properly assigns observationPhotos", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation,
        o => o.description && o.description.match( "Research-grade candidate without a taxon" ) );
      const obs = [new Observation( observation )];
      await ObservationPreload.observationPhotos( obs );
      expect( _.size( obs[0].observation_photos ) ).to.eq( 1 );
      expect( _.size( obs[0].photos ) ).to.eq( 1 );
      expect( obs[0].observation_photos[0].photo ).to.deep.eq( obs[0].photos[0] );
      expect( obs[0].observation_photos[0].photo.license_code ).to.eq( "cc-by" );
      expect( obs[0].observation_photos[0].photo.attribution ).to.match( /some rights reserved \(CC BY\)/ );
    } );

    it( "fills file_file_name when logged in as photo owner", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 29 );
      const obs = [new Observation( observation )];
      const options = { userSession: { user_id: 5 } };
      await ObservationPreload.observationPhotos( obs, options );
      expect( obs[0].photos[0].file_file_name ).to.not.be.undefined;
    } );

    it( "does not fill file_file_name when logged in as another user", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 29 );
      const obs = [new Observation( observation )];
      const options = { userSession: { user_id: 1 } };
      await ObservationPreload.observationPhotos( obs, options );
      expect( obs[0].photos[0].file_file_name ).to.be.undefined;
    } );

    it( "does not fill file_file_name when not logged in", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 29 );
      const obs = [new Observation( observation )];
      await ObservationPreload.observationPhotos( obs, { } );
      expect( obs[0].photos[0].file_file_name ).to.be.undefined;
    } );
  } );

  describe( "observationSounds", ( ) => {
    it( "fills file_file_name when logged in as sound owner", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 2025012201 );
      const obs = [new Observation( observation )];
      const options = { userSession: { user_id: 123 } };
      await ObservationPreload.observationSounds( obs, options );
      expect( obs[0].sounds[0].file_file_name ).to.not.be.undefined;
    } );

    it( "does not fill file_file_name when logged in as another user", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 2025012201 );
      const obs = [new Observation( observation )];
      const options = { userSession: { user_id: 1 } };
      await ObservationPreload.observationSounds( obs, options );
      expect( obs[0].sounds[0].file_file_name ).to.be.undefined;
    } );

    it( "does not fill file_file_name when not logged in", async ( ) => {
      const observation = _.find( fixtures.elasticsearch.observations.observation, o => o.id === 2025012201 );
      const obs = [new Observation( observation )];
      await ObservationPreload.observationSounds( obs, { } );
      expect( obs[0].sounds[0].file_file_name ).to.be.undefined;
    } );
  } );
} );