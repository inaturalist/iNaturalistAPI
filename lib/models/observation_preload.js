const _ = require( "lodash" );
const squel = require( "squel" );
const URL = require( "url" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
const Model = require( "./model" );

const ObservationPreload = class ObservationPreload {
  static projectMembershipPromise( obs, options, resolve, reject ) {
    if ( !options.userSession || !options.userSession.user_id ) { return void resolve( ); }
    const projobs = _.compact( _.flattenDeep( _.map( obs, o => ( o.project_observations ) ) ) );
    const nonTradProjects = _.compact( _.flattenDeep( _.map( obs,
      o => ( o.non_traditional_projects ) ) ) );
    const projobsProjectIDs = _.map( projobs, po => po.project.id );
    const nonTradProjectIDs = _.map( nonTradProjects, p => p.project_id );
    const projectIDs = _.compact( projobsProjectIDs.concat( nonTradProjectIDs ) );
    if ( projectIDs.length === 0 ) { return void resolve( ); }
    const query = squel.select( ).fields( ["pu.project_id"] )
      .from( "project_users pu" )
      .where( "pu.project_id IN ?", projectIDs )
      .where( "pu.user_id = ?", options.userSession.user_id );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const memberProjects = { };
      _.each( result.rows, r => {
        memberProjects[r.project_id] = true;
      } );
      _.each( projobs, po => {
        po.current_user_is_member = memberProjects[po.project.id] || false;
      } );
      _.each( nonTradProjects, p => {
        p.current_user_is_member = memberProjects[p.project_id] || false;
      } );
      resolve( );
    } );
  }

  static userPreferencesPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const userIDs = _.map( obs, o => ( o.user.id ) );
    const query = squel.select( ).fields( ["u.id, p.name, p.value"] )
      .from( "users u" )
      .left_join( "preferences p", null,
        "u.id = p.owner_id AND p.owner_type= 'User' AND p.name = 'community_taxa'" )
      .where( "u.id IN ?", userIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const userPrefs = { };
      _.each( result.rows, r => {
        if ( r.value === "t" ) {
          userPrefs[r.id] = true;
        } else if ( r.value === "f" ) {
          userPrefs[r.id] = false;
        }
      } );
      _.each( obs, o => {
        o.user.preferences = { prefers_community_taxa: userPrefs[o.user.id] };
      } );
      resolve( );
    } );
  }

  static applicationsPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const applicationIDs = _.uniq( _.compact( _.map( obs, o => ( o.oauth_application_id ) ) ) );
    if ( _.isEmpty( applicationIDs ) ) { return void resolve( ); }
    const query = squel.select( ).fields( ["id, name, url"] )
      .from( "oauth_applications" )
      .where( "id IN ?", applicationIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const obsApplications = { };
      _.each( result.rows, r => {
        r.url = r.url || `https://www.inaturalist.org/oauth/applications/${r.id}`;
        const parsedURL = URL.parse( r.url );
        r.icon = `https://www.google.com/s2/favicons?domain=${parsedURL.host}`;
        obsApplications[r.id] = r;
      } );
      _.each( obs, o => {
        o.application = obsApplications[o.oauth_application_id];
      } );
      resolve( );
    } );
  }

  static observationPhotosPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return void resolve( ); }
    _.each( obs, o => {
      o.photos = [];
      o.observation_photos = [];
    } );
    const query = squel.select( ).fields( [
      "observation_photos.id, position, uuid, photo_id, observation_id, "
        + "photos.native_realname, photos.native_username, photos.license, "
        + "photos.square_url, users.login, users.name"] )
      .from( "observation_photos" )
      .join( "photos", null, "photos.id = observation_photos.photo_id" )
      .left_join( "users", null, "photos.user_id = users.id" )
      .where( "observation_id IN ?", obsIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const obsPhotos = { };
      _.each( result.rows, r => {
        obsPhotos[r.observation_id] = obsPhotos[r.observation_id] || [];
        const photo = {
          id: r.photo_id,
          license_code: ( !r.license || r.license === 0 || !util.licenseInfo[r.license] )
            ? null : util.licenseInfo[r.license].code,
          url: util.fixHttps( r.square_url )
        };
        const photoAttributionName = r.native_realname || r.native_username || r.name || r.login;
        photo.attribution = util.photoAttribution( photo, photoAttributionName, r.license );
        obsPhotos[r.observation_id].push( {
          id: r.id,
          position: r.position,
          uuid: r.uuid,
          photo
        } );
      } );
      const photos = _.map( _.flatten( _.values( obsPhotos ) ), "photo" );
      if ( photos.length === 0 ) {
        return void resolve( );
      }
      Model.photoDimensionsByID( photos, err2 => {
        if ( err2 ) { return void reject( err2 ); }
        _.each( obs, o => {
          if ( _.isEmpty( obsPhotos[o.id] ) ) {
            o.observation_photos = [];
            o.photos = [];
          } else {
            o.observation_photos = _.sortBy( obsPhotos[o.id], ["position", "id"] );
            _.each( o.observation_photos, ( op, i ) => { op.position = i; } );
            o.photos = _.map( o.observation_photos, "photo" );
          }
        } );
        const flagsQuery = squel.select( ).fields( [
          "flag, updated_at, user_id, resolver_id, created_at, comment, id, resolved, flaggable_id"] )
          .from( "flags" )
          .where( "flaggable_type='Photo' AND flaggable_id IN ?", _.map( photos, "id" ) );
        pgClient.connection.query( flagsQuery.toString( ), ( err3, flagsResult ) => {
          if ( err3 ) { return void reject( err3 ); }
          const photoFlags = {};
          _.each( flagsResult.rows, r => {
            photoFlags[r.flaggable_id] = photoFlags[r.flaggable_id] || [];
            photoFlags[r.flaggable_id].push( r );
          } );
          _.each( photos, p => {
            p.flags = photoFlags[p.id] || [];
          } );
          resolve( );
        } );
      } );
    } );
  }

  static projectObservationsPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return void resolve( ); }
    const query = squel.select( ).fields(
      ["project_observations.id, project_observations,observation_id, uuid, project_id, user_id, preferences.value"]
    )
      .from( "project_observations" )
      .left_join( "preferences", null, "project_observations.id = preferences.owner_id "
        + "AND preferences.owner_type='ProjectObservation' AND preferences.name='curator_coordinate_access'" )
      .where( "observation_id IN ?", obsIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const projectObs = { };
      _.each( result.rows, r => {
        projectObs[r.observation_id] = projectObs[r.observation_id] || [];
        projectObs[r.observation_id].push( {
          id: r.id,
          uuid: r.uuid,
          project: {
            id: r.project_id
          },
          user_id: r.user_id,
          preferences: r.value ? {
            allows_curator_coordinate_access: r.value === "t"
          } : {}
        } );
      } );
      _.each( obs, o => {
        o.project_observations = projectObs[o.id] || [];
      } );
      resolve( );
    } );
  }

  static projectMembership( obs, options ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.projectMembershipPromise( obs, options, resolve, reject );
    } );
  }

  static userPreferences( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.userPreferencesPromise( obs, resolve, reject );
    } );
  }

  static applications( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.applicationsPromise( obs, resolve, reject );
    } );
  }

  static observationPhotos( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.observationPhotosPromise( obs, resolve, reject );
    } );
  }

  static projectObservations( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.projectObservationsPromise( obs, resolve, reject );
    } );
  }
};

module.exports = ObservationPreload;
