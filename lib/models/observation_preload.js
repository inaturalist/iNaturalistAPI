const _ = require( "lodash" );
const squel = require( "safe-squel" );
const URL = require( "url" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
const Model = require( "./model" );
const ESModel = require( "./es_model" );
const Identification = require( "./identification" );
const config = require( "../../config" );

const ObservationPreload = class ObservationPreload {
  static viewerProjectMembershipPromise( obs, options, resolve, reject ) {
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

  static observerProjectMembershipPromise( observations, options, resolve, reject ) {
    const projobs = _.compact(
      _.flattenDeep(
        _.map( observations, o => o.project_observations )
      )
    );
    const nonTradProjects = _.compact( _.flattenDeep( _.map( observations,
      o => ( o.non_traditional_projects ) ) ) );
    const projobsProjectIDs = _.map( projobs, po => po.project.id );
    const nonTradProjectIDs = _.map( nonTradProjects, p => p.project_id );
    const projectIDs = _.compact( projobsProjectIDs.concat( nonTradProjectIDs ) );
    if ( projectIDs.length === 0 ) { return void resolve( ); }
    const query = squel
      .select( )
      .field( "pu.project_id" )
      .field( "pu.user_id" )
      .field( "pu.role" )
      .field( "COALESCE(ccaf.value, 'none')", "prefers_curator_coordinate_access_for" )
      .from( "project_users pu" )
      .left_join(
        "preferences ccaf",
        null,
        "ccaf.owner_id = pu.id AND ccaf.owner_type = 'ProjectUser' AND ccaf.name = 'curator_coordinate_access_for'"
      )
      .where( "pu.project_id IN ?", projectIDs )
      .where( "pu.user_id IN ?", _.map( observations, o => o.user.id ) );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      _.each( observations, o => {
        _.each( _.compact( o.project_observations ), po => {
          po.project_user = _.find( result.rows, r => (
            r.project_id === po.project.id
            && r.user_id === o.user.id
          ) );
        } );
        const obsNonTradProjects = _.compact( o.non_traditional_projects );
        _.each( obsNonTradProjects, p => {
          p.project_user = _.find( result.rows, r => (
            r.project_id === p.project.id
            && r.user_id === o.user.id
          ) );
        } );
      } );
      resolve( );
    } );
  }

  static userPreferencesPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const userIDs = _.compact( _.map( obs, o => ( o.user ? o.user.id : null ) ) );
    if ( userIDs.length === 0 ) { return void resolve( ); }
    const query = squel.select( ).fields( ["u.id, p.name, p.value"] )
      .from( "users u" )
      .left_join( "preferences p", null,
        "u.id = p.owner_id AND p.owner_type= 'User' AND ( p.name IN ('community_taxa', 'observation_fields_by', 'project_addition_by') )" )
      .where( "u.id IN ?", userIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const userPrefs = { };
      _.each( result.rows, r => {
        userPrefs[r.id] = userPrefs[r.id] || { };
        if ( r.value === "t" ) {
          userPrefs[r.id][r.name] = true;
        } else if ( r.value === "f" ) {
          userPrefs[r.id][r.name] = false;
        } else {
          userPrefs[r.id][r.name] = r.value;
        }
      } );
      _.each( obs, o => {
        if ( o.user && userPrefs[o.user.id] ) {
          o.user.preferences = {
            prefers_community_taxa: userPrefs[o.user.id].community_taxa,
            prefers_observation_fields_by: userPrefs[o.user.id].observation_fields_by,
            prefers_project_addition_by: userPrefs[o.user.id].project_addition_by
          };
        }
      } );
      resolve( );
    } );
  }

  static applicationsPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const applicationIDs = _.uniq( _.compact( _.map( obs, o => ( o.oauth_application_id ) ) ) );
    if ( _.isEmpty( applicationIDs ) ) { return void resolve( ); }
    const query = squel.select( ).fields( ["id, name, url, image_file_name"] )
      .from( "oauth_applications" )
      .where( "id IN ?", applicationIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const obsApplications = { };
      _.each( result.rows, r => {
        r.url = r.url || `${config.websiteURL}oauth/applications/${r.id}`;
        const parsedURL = URL.parse( r.url );
        r.icon = `https://www.google.com/s2/favicons?domain=${parsedURL.host}`;
        if ( r.image_file_name && r.image_file_name.length > 0 ) {
          const ext = _.last( r.image_file_name.split( "." ) );
          r.icon = `${config.staticImagePrefix}oauth_applications/${r.id}-thumb.${ext}`;
        }
        delete r.image_file_name;
        obsApplications[r.id] = r;
      } );
      _.each( obs, o => {
        o.application = obsApplications[o.oauth_application_id];
      } );
      resolve( );
    } );
  }

  static async observationPhotos( obs ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    _.each( obs, o => {
      o.photos = [];
      o.observation_photos = [];
    } );
    const query = squel.select( )
      .field( "observation_photos.id" )
      .field( "observation_photos.observation_id" )
      .field( "observation_photos.photo_id" )
      .field( "observation_photos.position" )
      .field( "observation_photos.uuid" )
      .field( "photos.license" )
      .field( "photos.native_realname" )
      .field( "photos.native_username" )
      .field( "photos.width" )
      .field( "photos.height" )
      .field( "file_prefixes.prefix" )
      .field( "file_extensions.extension" )
      .field( "users.login" )
      .field( "users.name" )
      .field( "flags.flag" )
      .from( "observation_photos" )
      .join( "photos", null, "photos.id = observation_photos.photo_id" )
      .left_join( "file_prefixes", null, "photos.file_prefix_id = file_prefixes.id" )
      .left_join( "file_extensions", null, "photos.file_extension_id = file_extensions.id" )
      .left_join( "users", null, "photos.user_id = users.id" )
      .left_join(
        "flags",
        null,
        "photos.id = flags.flaggable_id"
        + " AND flags.flaggable_type = 'Photo'"
        + " AND flags.flag = 'copyright infringement'"
        + " AND flags.resolved = false"
      )
      .where( "observation_id IN ?", obsIDs );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const obsPhotos = { };
    _.each( rows, r => {
      obsPhotos[r.observation_id] = obsPhotos[r.observation_id] || [];
      const photo = {
        id: r.photo_id,
        license_code: ( !r.license || r.license === 0 || !util.licenseInfo[r.license] )
          ? null : util.licenseInfo[r.license].code,
        original_dimensions: {
          width: r.width,
          height: r.height
        }
      };
      if ( r.prefix ) {
        photo.url = util.fixHttps( `${r.prefix}/${photo.id}/square.${r.extension}` );
      }
      if ( r.flag ) {
        photo.url = `${config.websiteURL}assets/copyright-infringement-square.png`;
      }
      photo.url = photo.url || `${config.websiteURL}attachment_defaults/local_photos/square.png`;
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
    if ( photos.length === 0 ) { return; }
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
    const { rows: flagRows } = await pgClient.connection.query( flagsQuery.toString( ) );
    const photoFlags = {};
    _.each( flagRows, r => {
      photoFlags[r.flaggable_id] = photoFlags[r.flaggable_id] || [];
      photoFlags[r.flaggable_id].push( r );
    } );
    _.each( photos, p => {
      p.flags = photoFlags[p.id] || [];
    } );
  }

  static observationSoundsPromise( obs, resolve, reject ) {
    if ( obs.length === 0 ) { return void resolve( ); }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return void resolve( ); }
    const sounds = _.compact( _.flatten( _.map( obs, "sounds" ) ) );
    if ( sounds.length === 0 ) {
      return void resolve( );
    }
    _.each( obs, o => {
      o.observation_sounds = [];
    } );
    const query = squel.select( ).fields( ["id, uuid, sound_id, observation_id"] )
      .from( "observation_sounds" )
      .where( "observation_id IN ?", obsIDs );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void reject( err ); }
      const obsSounds = { };
      _.each( result.rows, r => {
        obsSounds[r.observation_id] = obsSounds[r.observation_id] || [];
        const sound = _.find( sounds, s => s.id === r.sound_id );
        obsSounds[r.observation_id].push( {
          id: r.id,
          uuid: r.uuid,
          sound
        } );
      } );
      _.each( obs, o => {
        if ( _.isEmpty( obsSounds[o.id] ) ) {
          o.observation_sounds = [];
        } else {
          o.observation_sounds = _.sortBy( obsSounds[o.id], ["id"] );
        }
      } );
      const flagsQuery = squel.select( ).fields( [
        "flag, updated_at, user_id, resolver_id, created_at, comment, id, resolved, flaggable_id"] )
        .from( "flags" )
        .where( "flaggable_type='Sound' AND flaggable_id IN ?", _.map( sounds, "id" ) );
      pgClient.connection.query( flagsQuery.toString( ), ( err3, flagsResult ) => {
        if ( err3 ) { return void reject( err3 ); }
        const soundFlags = {};
        _.each( flagsResult.rows, r => {
          soundFlags[r.flaggable_id] = soundFlags[r.flaggable_id] || [];
          soundFlags[r.flaggable_id].push( r );
        } );
        _.each( sounds, s => {
          s.flags = soundFlags[s.id] || [];
        } );
        resolve( );
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

  static async identifications( obs ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    const query = squel.select( ).fields( ["id", "observation_id"] )
      .from( "identifications" )
      .where( "observation_id IN ?", obsIDs );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const obsIdentifications = { };
    _.each( rows, r => {
      obsIdentifications[r.observation_id] = obsIdentifications[r.observation_id] || [];
      obsIdentifications[r.observation_id].push( { id: r.id } );
    } );
    _.each( obs, o => {
      o.identifications = obsIdentifications[o.id] || [];
    } );
    const identifications = _.filter( _.flatten( _.map( obs, "identifications" ) ), _.identity );
    await ESModel.fetchBelongsTo( identifications, Identification, {
      foreignKey: "id", source: { excludes: ["observation", "taxon", "current_taxon"] }, forObs: true
    } );
    _.each( obs, o => {
      o.identifications = _.filter( _.map( o.identifications, "identification" ), _.identity );
    } );
  }

  static viewerProjectMembership( obs, options ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.viewerProjectMembershipPromise( obs, options, resolve, reject );
    } );
  }

  static observerProjectMembership( obs, options ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.observerProjectMembershipPromise( obs, options, resolve, reject );
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

  static observationSounds( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.observationSoundsPromise( obs, resolve, reject );
    } );
  }

  static projectObservations( obs ) {
    return new Promise( ( resolve, reject ) => {
      ObservationPreload.projectObservationsPromise( obs, resolve, reject );
    } );
  }
};

module.exports = ObservationPreload;
