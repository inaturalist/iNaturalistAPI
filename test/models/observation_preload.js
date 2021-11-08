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
    } );
  } );
} );
