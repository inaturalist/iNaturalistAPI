const chai = require( "chai" );
const chaiAsPromised = require( "chai-as-promised" );
const sinon = require( "sinon" );
const ObservationQueryBuilder = require( "../../lib/models/observation_query_builder" );
const ProjectUser = require( "../../lib/models/project_user" );
const UserSession = require( "../../lib/user_session" );

const { expect } = chai;
chai.use( chaiAsPromised );

describe( "ObservationQueryBuilder", ( ) => {
  const sinonSandbox = sinon.createSandbox( );

  afterEach( ( ) => {
    sinonSandbox.restore( );
  } );

  describe( "contextTrustingUsers", ( ) => {
    it( "no trusting users if there is no logged-in user", async ( ) => {
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( { } );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users trust themselves if there is no collection or umbrella", async ( ) => {
      const loggedInReq = {
        userSession: {
          user_id: 12345
        }
      };
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReq );
      expect( usersTrustingForAny ).to.eql( [12345] );
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users does not trust themselves in an untrusted collection project context", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: {
          user_id: 12345
        },
        _collectionProject: {
          id: 9999
        }
      };
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in user does not trust themself in an untrusted umbrella project context", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: {
          user_id: 12345
        },
        _umbrellaProject: {
          id: 9999
        }
      };
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in collection project curators trusted by members trusting any", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.eql( [1111] );
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in collection project curators trusted by members trusting on taxon", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [] )
        .withArgs( 9999, "taxon" )
        .returns( [1111] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.eql( [1111] );
    } );

    it( "logged-in collection project curators not trusted by anyone if project does not enable trust", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: false
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in umbrella project curators trusted by members trusting any", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.eql( [1111] );
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in umbrella project curators trusted by members trusting on taxon", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [] )
        .withArgs( 9999, "taxon" )
        .returns( [1111] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.eql( [1111] );
    } );

    it( "logged-in umbrella project curators not trusted by anyone if project does not enable trust", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: false
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users trust themselves if they trust the collection project with any", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [12345, 1111] )
        .withArgs( 9999, "taxon" )
        .returns( [2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.eql( [12345] );
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users trust themselves if they trust the collection project with taxa", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [12345, 2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.eql( [12345] );
    } );

    it( "logged-in users get no trust if the collection project has not enabled trusting", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: false
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [12345, 2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithCollection );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users trust themselves if they trust the umbrella project with any", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [12345, 1111] )
        .withArgs( 9999, "taxon" )
        .returns( [2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.eql( [12345] );
      expect( usersTrustingForTaxon ).to.be.empty;
    } );

    it( "logged-in users trust themselves if they trust the umbrella project with taxa", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [12345, 2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.eql( [12345] );
    } );

    it( "logged-in users get no trust if the umbrella project has not enabled trusting", async ( ) => {
      const loggedInReqWithUmbrella = {
        userSession: new UserSession( {
          user_id: 12345
        } ),
        _umbrellaProject: {
          id: 9999,
          prefers_user_trust: false
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111] )
        .withArgs( 9999, "taxon" )
        .returns( [12345, 2222] );
      const {
        usersTrustingForAny,
        usersTrustingForTaxon
      } = await ObservationQueryBuilder.contextTrustingUsers( loggedInReqWithUmbrella );
      expect( usersTrustingForAny ).to.be.empty;
      expect( usersTrustingForTaxon ).to.be.empty;
    } );
  } );

  describe( "placeFilterForUser", ( ) => {
    const placeID = 9999;
    const expectedPublicFilter = {
      terms: {
        "place_ids.keyword": [placeID]
      }
    };
    const expectedPrivateFilter = userIDs => ( {
      bool: {
        must: [{
          terms: {
            "private_place_ids.keyword": [placeID]
          }
        }, {
          terms: {
            "user.id.keyword": userIDs
          }
        }]
      }
    } );
    const expectedPrivateFilterTaxa = userIDs => {
      const privateFilter = expectedPrivateFilter( userIDs );
      privateFilter.bool.must.splice( 1, 0, {
        terms: {
          taxon_geoprivacy: [
            "obscured",
            "private"
          ]
        }
      } );
      privateFilter.bool.must_not = [{
        exists: {
          field: "geoprivacy"
        }
      }];
      return privateFilter;
    };

    it( "no filter if there is no place_id param", async ( ) => {
      const placeFilter = await ObservationQueryBuilder.placeFilterForUser( { }, { } );
      expect( placeFilter ).to.be.null;
    } );

    it( "uses only public filters if there is no logged-in user", async ( ) => {
      const placeFilter = await ObservationQueryBuilder.placeFilterForUser(
        { }, { place_id: placeID }
      );
      expect( placeFilter ).to.eql( expectedPublicFilter );
    } );

    it( "uses a private filter component if there is a logged-in user", async ( ) => {
      const loggedInReq = {
        userSession: {
          user_id: 12345
        }
      };
      const placeFilter = await ObservationQueryBuilder.placeFilterForUser(
        loggedInReq, { place_id: placeID }
      );
      expect( placeFilter ).to.eql( {
        bool: {
          should: [
            expectedPrivateFilter( [12345] ),
            expectedPublicFilter
          ]
        }
      } );
    } );

    it( "uses a private filter component for curators of trusted collection projects", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111, 2222] )
        .withArgs( 9999, "taxon" )
        .returns( [3333, 4444] );
      const placeFilter = await ObservationQueryBuilder.placeFilterForUser(
        loggedInReqWithCollection, { place_id: placeID }
      );
      expect( placeFilter ).to.eql( {
        bool: {
          should: [
            expectedPrivateFilter( [1111, 2222] ),
            expectedPrivateFilterTaxa( [3333, 4444] ),
            expectedPublicFilter
          ]
        }
      } );
    } );
  } );

  describe( "boundsFilterForUser", ( ) => {
    const boundsParams = {
      swlat: 1, swlng: 2, nelat: 3, nelng: 4
    };
    const expectedPublicFilter = {
      geo_shape: {
        geojson: {
          shape: {
            type: "envelope",
            coordinates: [[2, 3], [4, 1]]
          }
        }
      }
    };
    const expectedPrivateFilter = userIDs => ( {
      bool: {
        must: [{
          geo_shape: {
            private_geojson: {
              shape: {
                type: "envelope",
                coordinates: [[2, 3], [4, 1]]
              }
            }
          }
        }, {
          terms: {
            "user.id.keyword": userIDs
          }
        }]
      }
    } );
    const expectedPrivateFilterTaxa = userIDs => {
      const privateFilter = expectedPrivateFilter( userIDs );
      privateFilter.bool.must.splice( 1, 0, {
        terms: {
          taxon_geoprivacy: [
            "obscured",
            "private"
          ]
        }
      } );
      privateFilter.bool.must_not = [{
        exists: {
          field: "geoprivacy"
        }
      }];
      return privateFilter;
    };

    it( "no filter if there are no bounds params", async ( ) => {
      const boundsFilter = await ObservationQueryBuilder.boundsFilterForUser( { }, { } );
      expect( boundsFilter ).to.be.null;
    } );

    it( "uses only public filters if there is no logged-in user", async ( ) => {
      const boundsFilter = await ObservationQueryBuilder.boundsFilterForUser( { }, boundsParams );
      expect( boundsFilter ).to.eql( expectedPublicFilter );
    } );

    it( "uses a private filter component if there is a logged-in user", async ( ) => {
      const loggedInReq = {
        userSession: {
          user_id: 12345
        }
      };
      const boundsFilter = await ObservationQueryBuilder.boundsFilterForUser(
        loggedInReq, boundsParams
      );
      expect( boundsFilter ).to.eql( {
        bool: {
          should: [
            expectedPrivateFilter( [12345] ),
            expectedPublicFilter
          ]
        }
      } );
    } );

    it( "uses a private filter component for curators of trusted collection projects", async ( ) => {
      const loggedInReqWithCollection = {
        userSession: new UserSession( {
          user_id: 12345,
          curatedProjectsIDs: [9999]
        } ),
        _collectionProject: {
          id: 9999,
          prefers_user_trust: true
        }
      };
      sinonSandbox.stub( ProjectUser, "usersTrustingProjectFor" )
        .withArgs( 9999, "any" )
        .returns( [1111, 2222] )
        .withArgs( 9999, "taxon" )
        .returns( [3333, 4444] );
      const boundsFilter = await ObservationQueryBuilder.boundsFilterForUser(
        loggedInReqWithCollection, boundsParams
      );
      expect( boundsFilter ).to.eql( {
        bool: {
          should: [
            expectedPrivateFilter( [1111, 2222] ),
            expectedPrivateFilterTaxa( [3333, 4444] ),
            expectedPublicFilter
          ]
        }
      } );
    } );
  } );
} );
