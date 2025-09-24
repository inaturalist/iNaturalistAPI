const _ = require( "lodash" );
const squel = require( "safe-squel" );
const URL = require( "url" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
const ESModel = require( "./es_model" );
const Identification = require( "./identification" );
const config = require( "../../config" );

const ObservationPreload = class ObservationPreload {
  static async viewerProjectMembership( obs, options ) {
    if ( !options.userSession || !options.userSession.user_id ) { return; }
    const projobs = _.compact( _.flattenDeep( _.map( obs, o => ( o.project_observations ) ) ) );
    const nonTradProjects = _.compact( _.flattenDeep( _.map( obs,
      o => ( o.non_traditional_projects ) ) ) );
    const projobsProjectIDs = _.map( projobs, po => po.project.id );
    const nonTradProjectIDs = _.map( nonTradProjects, p => p.project_id );
    const projectIDs = _.compact( projobsProjectIDs.concat( nonTradProjectIDs ) );
    if ( projectIDs.length === 0 ) { return; }
    const query = squel.select( ).fields( ["pu.project_id"] )
      .from( "project_users pu" )
      .where( "pu.project_id IN ?", projectIDs )
      .where( "pu.user_id = ?", options.userSession.user_id );
    const result = await pgClient.replica.query( query.toString( ) );
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
  }

  static async observerProjectMembership( observations ) {
    const projobs = _.compact(
      _.flattenDeep(
        _.map( observations, o => o.project_observations )
      )
    );
    const nonTradProjects = _.compact( _.flattenDeep( _.map( observations,
      o => ( o.non_traditional_projects ) ) ) );
    const projobsProjectIDs = _.map( projobs, po => po.project.id );
    const nonTradProjectIDs = _.map( nonTradProjects, p => p.project_id );
    const projectIDs = _.uniq( _.compact( projobsProjectIDs.concat( nonTradProjectIDs ) ) );
    if ( projectIDs.length === 0 ) { return; }
    const query = squel
      .select( )
      .field( "pu.id" )
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
    const result = await pgClient.replica.query( query.toString( ) );
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
  }

  static async userPreferences( obs ) {
    if ( obs.length === 0 ) { return; }
    const userIDs = _.compact( _.map( obs, o => ( o.user ? o.user.id : null ) ) );
    if ( userIDs.length === 0 ) { return; }
    const query = squel.select( ).fields( ["p.owner_id, p.name, p.value"] )
      .from( "preferences p" )
      .where( "p.name IN ('community_taxa', 'observation_fields_by', 'project_addition_by')" )
      .where( "p.owner_type= 'User'" )
      .where( "p.owner_id IN ?", userIDs );
    const result = await pgClient.replica.query( query.toString( ) );
    const userPrefs = { };
    _.each( result.rows, r => {
      userPrefs[r.owner_id] = userPrefs[r.owner_id] || { };
      if ( r.value === "t" ) {
        userPrefs[r.owner_id][r.name] = true;
      } else if ( r.value === "f" ) {
        userPrefs[r.owner_id][r.name] = false;
      } else {
        userPrefs[r.owner_id][r.name] = r.value;
      }
    } );
    _.each( obs, o => {
      if ( o.user ) {
        o.user.preferences = {
          prefers_community_taxa: userPrefs[o.user.id]
            ? userPrefs[o.user.id].community_taxa : undefined,
          prefers_observation_fields_by: userPrefs[o.user.id]
            ? userPrefs[o.user.id].observation_fields_by : undefined,
          prefers_project_addition_by: userPrefs[o.user.id]
            ? userPrefs[o.user.id].project_addition_by : undefined
        };
      }
    } );
  }

  static async applications( obs ) {
    if ( obs.length === 0 ) { return; }
    // return if any observations already have an application property
    if ( _.find( obs, "application" ) ) { return; }
    const applicationIDs = _.uniq( _.compact( _.map( obs, o => ( o.oauth_application_id ) ) ) );
    if ( _.isEmpty( applicationIDs ) ) { return; }
    const query = squel.select( ).fields( ["id, name, url, image_file_name"] )
      .from( "oauth_applications" )
      .where( "id IN ?", applicationIDs );
    const result = await pgClient.replica.query( query.toString( ) );
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
  }

  static async observationPhotos( obs, options = { } ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    const query = squel.select( )
      .field( "observation_photos.id" )
      .field( "observation_photos.observation_id" )
      .field( "observation_photos.photo_id" )
      .field( "observation_photos.position" )
      .field( "observation_photos.uuid" )
      .from( "observation_photos" )
      .where( "observation_id IN ?", obsIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    const observationPhotos = { };
    _.each( rows, r => {
      observationPhotos[r.id] = {
        id: r.id,
        observation_id: r.observation_id,
        position: r.position,
        uuid: r.uuid,
        photo_id: r.photo_id
      };
    } );
    // lookup and assign photo objects to each observationPhoto
    const loggedInUserID = options?.userSession?.user_id;
    await ObservationPreload.assignObservationPhotoPhotos( observationPhotos, loggedInUserID );
    _.each( obs, o => {
      const unsortedObsObsPhotos = _.filter( observationPhotos, op => op.observation_id === o.id );
      o.observation_photos = _.sortBy( unsortedObsObsPhotos, ["position", "id"] );
      _.each( o.observation_photos, ( op, i ) => {
        op.position = i;
      } );
      o.photos = _.map( o.observation_photos, "photo" );
    } );
    _.each( _.flatten( _.map( obs, "observation_photos" ) ), op => {
      // observation_id attribute of observationPhoto is no longer needed
      delete op.observation_id;
    } );
  }

  static async assignObservationPhotoPhotos( observationPhotos, loggedInUserID = null ) {
    const photoIDs = _.flatten( _.uniq( _.map( _.flatten( _.values( observationPhotos ) ), "photo_id" ) ) );
    if ( photoIDs.length === 0 ) { return; }
    const photos = { };
    const query = squel.select( )
      .field( "photos.id" )
      .field( "photos.user_id" )
      .field( "photos.license" )
      .field( "photos.native_realname" )
      .field( "photos.native_username" )
      .field( "photos.width" )
      .field( "photos.height" )
      .field( "photos.file_file_name" )
      .field( "file_prefixes.prefix" )
      .field( "file_extensions.extension" )
      .from( "photos" )
      .left_join( "file_prefixes", null, "photos.file_prefix_id = file_prefixes.id" )
      .left_join( "file_extensions", null, "photos.file_extension_id = file_extensions.id" )
      .where( "photos.id IN ?", photoIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    _.each( rows, r => {
      const photo = {
        id: r.id,
        user_id: r.user_id,
        native_realname: r.native_realname,
        native_username: r.native_username,
        license: r.license,
        license_code: ( !r.license || r.license === 0 || !util.licenseInfo[r.license] )
          ? null : util.licenseInfo[r.license].code,
        original_dimensions: {
          width: r.width,
          height: r.height
        }
      };
      if ( loggedInUserID && r.user_id === loggedInUserID ) {
        photo.original_filename = r.file_file_name;
      }
      if ( r.prefix ) {
        photo.url = util.fixHttps( `${r.prefix}/${photo.id}/square.${r.extension}` );
      }
      photo.url = photo.url || `${config.websiteURL}attachment_defaults/local_photos/square.png`;
      photos[photo.id] = photo;
    } );
    // lookup user info and assign an attribution string to each photo
    await ObservationPreload.assignPhotoAttribution( photos );
    // lookup and assign flags to each photo, overriding the URL if necessary
    await ObservationPreload.assignPhotoFlags( photos );
    await ObservationPreload.assignPhotoModeratorActions( photos );
    // assign photo objects to each observationPhoto
    _.each( observationPhotos, op => {
      op.photo = photos[op.photo_id];
    } );
  }

  static async assignPhotoAttribution( photos ) {
    const photoUserIDs = _.compact( _.uniq( _.map( photos, "user_id" ) ) );
    const photoUsers = { };
    if ( photoUserIDs.length > 0 ) {
      const photoUsersQuery = squel.select( ).fields( ["id", "name", "login"] )
        .from( "users" )
        .where( "users.id IN ?", photoUserIDs );
      const { rows: photoUserRows } = await pgClient.replica.query( photoUsersQuery.toString( ) );
      _.each( photoUserRows, r => {
        photoUsers[r.id] = {
          name: r.name,
          login: r.login
        };
      } );
    }
    _.each( photos, p => {
      let photoAttributionName = p.native_realname || p.native_username;
      if ( !photoAttributionName && p.user_id && photoUsers[p.user_id] ) {
        photoAttributionName = photoUsers[p.user_id].name || photoUsers[p.user_id].login;
      }
      // build the photo attribution string
      p.attribution = util.photoAttribution( p, photoAttributionName, p.license );
      // delete attributes used to generate the attribution string that are no longer needed
      delete p.native_realname;
      delete p.native_username;
      delete p.user_id;
      delete p.license;
    } );
  }

  static async assignPhotoFlags( photos ) {
    const photoIDs = _.keys( photos );
    const photoFlags = {};
    const flagsQuery = squel.select( ).fields( [
      "flag, updated_at, user_id, resolver_id, created_at, comment, id, resolved, flaggable_id"] )
      .from( "flags" )
      .where( "flaggable_type='Photo' AND flaggable_id IN ?", photoIDs );
    const { rows: flagRows } = await pgClient.replica.query( flagsQuery.toString( ) );
    _.each( flagRows, r => {
      photoFlags[r.flaggable_id] = photoFlags[r.flaggable_id] || [];
      photoFlags[r.flaggable_id].push( r );
    } );
    // assign flags to photos, overriding the URL for unresolved copyright infringement flags
    _.each( photos, p => {
      p.flags = photoFlags[p.id] || [];
      if ( _.some( p.flags, f => !f.resolved && f.flag === "copyright infringement" ) ) {
        p.url = `${config.websiteURL}assets/copyright-infringement-square.png`;
      }
    } );
  }

  static async assignPhotoModeratorActions( photos ) {
    const photoIDs = _.keys( photos );
    const photoModeratorActions = { };
    const query = squel.select( ).fields( [
      "ma.id, ma.resource_id, ma.action, ma.reason, ma.created_at, ma.updated_at, ma.private, "
      + "u.id user_id, u.login, u.spammer, u.suspended_at, u.created_at user_created_at"] )
      .from( "moderator_actions ma" )
      .left_join( "users u", null, "ma.user_id = u.id" )
      .where( "ma.resource_type='Photo' AND ma.resource_id IN ?", photoIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    _.each( rows, r => {
      photoModeratorActions[r.resource_id] = photoModeratorActions[r.resource_id] || [];
      photoModeratorActions[r.resource_id].push( {
        id: r.id,
        created_at: r.created_at,
        user: r.user_id ? {
          id: r.user_id,
          login: r.login,
          spam: !!r.spammer,
          suspended: !!r.suspended_at,
          created_at: r.user_created_at
        } : null,
        action: r.action,
        reason: r.reason,
        private: r.private
      } );
    } );
    // assign moderator actions to photos, overriding the URL for hidden photos
    _.each( photos, p => {
      p.moderator_actions = photoModeratorActions[p.id] || [];
      p.hidden = false;
      const mostRecentModeratorAction = _.first( _.reverse( _.sortBy( p.moderator_actions, ["created_at"] ) ) );
      if ( mostRecentModeratorAction && mostRecentModeratorAction.action === "hide" ) {
        p.hidden = true;
        p.url = `${config.websiteURL}assets/media-hidden-square.png`;
      }
    } );
  }

  static async observationSounds( obs, options = { } ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    const sounds = _.compact( _.flatten( _.map( obs, "sounds" ) ) );
    if ( sounds.length === 0 ) { return; }
    _.each( obs, o => {
      o.observation_sounds = [];
    } );
    const query = squel.select( ).fields( ["id, uuid, sound_id, observation_id"] )
      .from( "observation_sounds" )
      .where( "observation_id IN ?", obsIDs );
    const result = await pgClient.replica.query( query.toString( ) );
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
    const loggedInUserID = options?.userSession?.user_id;
    await ObservationPreload.assignSoundFilenames( sounds, loggedInUserID );
    await ObservationPreload.assignSoundFlags( sounds );
    await ObservationPreload.assignSoundModeratorActions( sounds );
  }

  static async assignSoundFilenames( sounds, loggedInUserID = null ) {
    if ( !loggedInUserID ) { return; }
    const soundIDs = _.map( sounds, "id" );
    if ( soundIDs.length === 0 ) { return; }
    const query = squel.select( ).fields( ["id", "file_file_name", "user_id"] )
      .from( "sounds" )
      .where( "id IN ?", soundIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    const soundInfo = { };
    _.each( rows, r => {
      soundInfo[r.id] = {
        file_file_name: r.file_file_name,
        user_id: r.user_id
      };
    } );
    _.each( sounds, s => {
      delete s.original_filename;
      if ( soundInfo[s.id] && loggedInUserID && loggedInUserID === soundInfo[s.id].user_id ) {
        s.original_filename = soundInfo[s.id].file_file_name;
      }
    } );
  }

  static async assignSoundModeratorActions( sounds ) {
    const soundIDs = _.map( sounds, "id" );
    const photoModeratorActions = { };
    const query = squel.select( ).fields( [
      "ma.id, ma.resource_id, ma.action, ma.reason, ma.created_at, ma.updated_at, ma.private, "
      + "u.id user_id, u.login, u.spammer, u.suspended_at, u.created_at user_created_at"] )
      .from( "moderator_actions ma" )
      .left_join( "users u", null, "ma.user_id = u.id" )
      .where( "ma.resource_type='Sound' AND ma.resource_id IN ?", soundIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    _.each( rows, r => {
      photoModeratorActions[r.resource_id] = photoModeratorActions[r.resource_id] || [];
      photoModeratorActions[r.resource_id].push( {
        id: r.id,
        created_at: r.created_at,
        user: r.user_id ? {
          id: r.user_id,
          login: r.login,
          spam: !!r.spammer,
          suspended: !!r.suspended_at,
          created_at: r.user_created_at
        } : null,
        action: r.action,
        reason: r.reason,
        private: r.private
      } );
    } );
    _.each( sounds, s => {
      s.moderator_actions = photoModeratorActions[s.id] || [];
      s.hidden = false;
      const mostRecentModeratorAction = _.first( _.reverse( _.sortBy( s.moderator_actions, ["created_at"] ) ) );
      if ( mostRecentModeratorAction && mostRecentModeratorAction.action === "hide" ) {
        s.hidden = true;
      }
    } );
  }

  static async assignSoundFlags( sounds ) {
    const flagsQuery = squel.select( ).fields( [
      "flag, updated_at, user_id, resolver_id, created_at, comment, id, resolved, flaggable_id"] )
      .from( "flags" )
      .where( "flaggable_type='Sound' AND flaggable_id IN ?", _.map( sounds, "id" ) );
    const flagsResult = await pgClient.replica.query( flagsQuery.toString( ) );
    const soundFlags = {};
    _.each( flagsResult.rows, r => {
      soundFlags[r.flaggable_id] = soundFlags[r.flaggable_id] || [];
      soundFlags[r.flaggable_id].push( r );
    } );
    _.each( sounds, s => {
      s.flags = soundFlags[s.id] || [];
    } );
  }

  static async projectObservations( obs ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    const query = squel.select( ).fields(
      ["project_observations.id, project_observations,observation_id, uuid, project_id, user_id, preferences.value"]
    )
      .from( "project_observations" )
      .left_join( "preferences", null, "project_observations.id = preferences.owner_id "
        + "AND preferences.owner_type='ProjectObservation' AND preferences.name='curator_coordinate_access'" )
      .where( "observation_id IN ?", obsIDs );
    const result = await pgClient.replica.query( query.toString( ) );
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
  }

  static async identifications( obs ) {
    if ( obs.length === 0 ) { return; }
    const obsIDs = _.map( obs, "id" );
    if ( _.isEmpty( obsIDs ) ) { return; }
    const query = squel.select( ).fields( ["id", "observation_id"] )
      .from( "identifications" )
      .where( "observation_id IN ?", obsIDs );
    const { rows } = await pgClient.replica.query( query.toString( ) );
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
};

module.exports = ObservationPreload;
