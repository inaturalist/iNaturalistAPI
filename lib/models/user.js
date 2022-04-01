const _ = require( "lodash" );
const squel = require( "safe-squel" ).useFlavour( "postgres" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
const Model = require( "./model" );
const Site = require( "./site" );

// This is a not-great duplication of logic in the Rails app where this model
// really lives, but this saves us an additional HTTP request
const PREFS = [
  { name: "automatic_taxonomic_changes", default: true },
  { name: "comment_email_notification", default: true },
  { name: "common_names", default: true },
  { name: "community_taxa", default: true },
  { name: "identification_email_notification", default: true },
  { name: "mention_email_notification", default: true },
  { name: "message_email_notification", default: true },
  { name: "monthly_supporter_badge", default: false },
  { name: "no_email", default: false },
  { name: "no_tracking", default: false },
  { name: "observation_fields_by", default: "anyone" },
  { name: "observation_license", default: null },
  { name: "photo_license", default: null },
  { name: "project_added_your_observation_email_notification", default: true },
  { name: "project_addition_by", default: "any" },
  { name: "project_curator_change_email_notification", default: true },
  { name: "project_journal_post_email_notification", default: true },
  { name: "receive_mentions", default: true },
  { name: "redundant_identification_notifications", default: true },
  { name: "scientific_name_first", default: false },
  { name: "sound_license", default: null },
  { name: "taxon_change_email_notification", default: true },
  { name: "taxon_or_place_observation_email_notification", default: true },
  { name: "user_observation_email_notification", default: true }
];

// prefs that should be present as prefers_name
const PREFERS_PREFS = [
  "automatic_taxonomic_changes",
  "comment_email_notification",
  "common_names",
  "community_taxa",
  "identification_email_notification",
  "mention_email_notification",
  "message_email_notification",
  "monthly_supporter_badge",
  "no_email",
  "no_tracking",
  "project_added_your_observation_email_notification",
  "project_curator_change_email_notification",
  "project_journal_post_email_notification",
  "receive_mentions",
  "redundant_identification_notifications",
  "scientific_name_first",
  "taxon_change_email_notification",
  "taxon_or_place_observation_email_notification",
  "user_observation_email_notification"
];
// prefs that should be present as preferred_name
const PREFERRED_PREFS = [
  "observation_fields_by",
  "observation_license",
  "photo_license",
  "project_addition_by",
  "sound_license"
];

const ES_ONLY_FIELDS = [
  "icon",
  "orcid",
  "roles",
  "spam",
  "suspended"
];

const User = class User extends Model {
  constructor( attrs ) {
    super( attrs );
    this.icon_url = User.iconUrl( this );
    this.orcid = this.orcid ? `https://orcid.org/${this.orcid}` : null;
  }

  static async find( id, options = {} ) {
    if ( _.isEmpty( id ) ) { return null; }
    const fields = options.fields || User.returnFields;
    const dbFields = _.difference( fields, ES_ONLY_FIELDS );
    const query = squel.select( )
      .from( User.tableName )
      .where( "id = ?", id );
    if ( dbFields.indexOf( "monthly_supporter" ) >= 0 ) {
      _.pull( dbFields, "monthly_supporter" );
      query.field(
        "donorbox_plan_type = 'monthly' AND donorbox_plan_status = 'active'",
        "monthly_supporter"
      );
    }
    if ( fields.indexOf( "site" ) ) {
      _.pull( dbFields, "site" );
      dbFields.push( "site_id" );
    }
    if ( fields.indexOf( "last_active" ) ) {
      _.pull( dbFields, "last_active" );
      query.field( "last_active::text", "last_active" );
    }
    query.fields( dbFields );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const dbResponse = rows[0];
    if ( _.isEmpty( dbResponse ) ) { return null; }
    const esResponse = await User.findInES( id );
    if ( _.isEmpty( esResponse ) ) { return null; }
    const user = new User( { ...dbResponse, ...esResponse } );
    if ( fields.indexOf( "site" ) && dbResponse.site_id ) {
      const siteAttrs = await Site.dbAttributes( [dbResponse.site_id] );
      if ( siteAttrs && siteAttrs.length > 0 ) {
        user.site = siteAttrs[0];
      }
      delete user.site_id;
    }
    return user;
  }

  static async privateDbAttributesFromLogin( login ) {
    if ( _.isEmpty( login ) ) { return null; }
    const query = squel.select( )
      .field( "users.created_at" )
      .field( "users.updated_at" )
      .field( "users.description" )
      .field( "donorbox_plan_status" )
      .field( "donorbox_plan_type" )
      .field( "users.id" )
      .field( "users.search_place_id" )
      .field( "users.time_zone" )
      .field( "email" )
      .field( "locale" )
      .field( "place_id" )
      .field( "site_id" )
      .field( "pi_consent_at IS NOT NULL", "pi_consent" )
      .field( "data_transfer_consent_at IS NOT NULL", "data_transfer_consent" )
      .field( "up.privilege" )
      .field( "user_mutes.muted_user_id" )
      .field( "user_blocks.blocked_user_id" )
      .from( "users" )
      .left_join( "user_mutes", null, "users.id = user_mutes.user_id" )
      .left_join( "user_blocks", null, "users.id = user_blocks.user_id" )
      .left_join( "user_privileges", "up", "users.id = up.user_id" )
      .where( "login = ?", login );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const userObject = _.mapValues( rows[0], v => v || null );
    const prefsQuery = squel.select( )
      .field( "name" )
      .field( "value" )
      .from( "preferences" )
      .where( "owner_id = ? AND owner_type = 'User'", userObject.id );
    const { rows: prefRows } = await pgClient.connection.query( prefsQuery.toString( ) );
    _.each( PREFS, pref => {
      const prefRow = _.find( prefRows, r => r.name === pref.name );
      let prefRowValue;
      if ( prefRow ) {
        if ( prefRow.value === "t" ) {
          prefRowValue = true;
        } else if ( prefRow.value === "f" ) {
          prefRowValue = false;
        } else {
          prefRowValue = prefRow.value;
        }
      }
      const value = !_.isNil( prefRowValue ) && prefRowValue !== pref.default
        ? prefRowValue
        : pref.default;
      if ( PREFERS_PREFS.includes( pref.name ) ) {
        userObject[`prefers_${pref.name}`] = value;
      } else if ( PREFERRED_PREFS.includes( pref.name ) ) {
        userObject[`preferred_${pref.name}`] = value;
      }
    } );
    userObject.muted_user_ids = _.compact( _.uniq( _.map( rows, r => r.muted_user_id ) ) );
    delete userObject.muted_user_id;
    userObject.blocked_user_ids = _.compact( _.uniq( _.map( rows, r => r.blocked_user_id ) ) );
    delete userObject.blocked_user_id;
    userObject.privileges = _.compact( _.uniq( _.map( rows, r => r.privilege ) ) );
    delete userObject.privilege;
    userObject.monthly_supporter = (
      userObject.donorbox_plan_type === "monthly"
      && userObject.donorbox_plan_status === "active"
    );
    delete userObject.donorbox_plan_status;
    delete userObject.donorbox_plan_type;
    return userObject;
  }

  static async findByLogin( login ) {
    if ( _.isEmpty( login ) ) { return null; }
    const query = squel.select( )
      .field( "id, login, name" )
      .from( "users" )
      .where( "lower(login) = ?", login.toLowerCase( ) );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return rows[0] ? rows[0] : null;
  }

  static async findByLoginOrID( login ) {
    let query = squel.select( ).field( "id, login, name" ).from( "users" );
    const asInt = Number( login );
    if ( asInt ) {
      query = query.where( "id = ? OR login = '?'", asInt, asInt );
    } else if ( util.isUUID( login ) ) {
      query = query.where( "uuid = ?", login );
    } else {
      query = query.where( "lower(login) = ?", login.toLowerCase( ) );
    }
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return rows[0] ? rows[0] : null;
  }

  static async findAllByLoginOrID( param ) {
    const logins = util.paramArray( param );
    if ( _.isEmpty( logins ) ) {
      return null;
    }
    let query = squel.select( ).field( "id, login, name" ).from( "users" );
    const ints = _.compact( _.map( logins, l => Number( l ) ) );
    if ( !_.isEmpty( ints ) ) {
      query = query.where( "id IN ? OR login IN ?", ints, logins );
    } else {
      query = query.where( "login IN ?", logins );
    }
    const { rows } = await pgClient.connection.query( query.toString( ) );
    if ( _.isEmpty( rows ) ) {
      return null;
    }
    return rows;
  }

  static async findInES( idOrLogin ) {
    const lookedUpUser = await User.findByLoginOrID( idOrLogin );
    if ( !lookedUpUser ) { return null; }
    const query = { body: { query: { term: { id: lookedUpUser.id } } } };
    const results = await esClient.search( "users", query );
    return results.hits.hits[0] ? results.hits.hits[0]._source : null;
  }

  static iconUrl( user ) {
    if ( user.icon ) {
      return user.icon.replace( "thumb", "medium" );
    }
    if ( !user.icon_content_type ) { return null; }
    let extension;
    if ( user.icon_content_type && user.icon_content_type.match( /jpeg$/ ) ) {
      extension = "jpg";
    } else if ( user.icon_content_type && user.icon_content_type.match( /png$/ ) ) {
      extension = "png";
    } else if ( user.icon_content_type && user.icon_content_type.match( /gif$/ ) ) {
      extension = "gif";
    } else if ( user.icon_content_type && user.icon_content_type.match( /bmp$/ ) ) {
      extension = "bmp";
    } else if ( user.icon_content_type && user.icon_content_type.match( /tiff$/ ) ) {
      extension = "tiff";
    } else return null;
    // catch a few file_names that paperclip knows are JPEGs
    if ( extension === "jpg" && user.icon_file_name
      && user.icon_file_name.match( /(stringio\.txt|open-uri|\.jpeg|^data$)/ ) ) {
      extension = "jpeg";
    }
    const prefix = global.config.userImagePrefix
      || "https://static.inaturalist.org/attachments/users/icons/";
    return `${prefix}${user.id}/medium.${extension}`;
  }

  static async projectsCurated( userID ) {
    const query = squel.select( ).field( "project_id" ).from( "project_users" )
      .where( "user_id = ?", userID )
      .where( "role IN ?", ["manager", "curator"] );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return _.map( rows, "project_id" );
  }

  static async trustingUsers( userID ) {
    const query = squel.select( ).field( "user_id" ).from( "friendships" )
      .where( "friend_id = ?", userID )
      .where( "trust" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return _.map( rows, "user_id" );
  }

  static async blocks( userID ) {
    const query = squel.select( )
      .field( "user_id, blocked_user_id, users.login AS user_login, blocked_users.login AS blocked_user_login" )
      .from( "user_blocks" )
      .left_join( "users", "users", "user_blocks.user_id = users.id" )
      .left_join( "users", "blocked_users", "user_blocks.blocked_user_id = blocked_users.id" )
      .where( "user_id = ? OR blocked_user_id = ?", userID, userID );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const blocks = {
      blockedUsers: [],
      blockedByUsers: []
    };
    _.map( rows, r => {
      if ( r.user_id === userID ) {
        blocks.blockedUsers.push( {
          id: r.blocked_user_id,
          login: r.blocked_user_login
        } );
      } else {
        blocks.blockedByUsers.push( {
          id: r.user_id,
          login: r.user_login
        } );
      }
    } );
    if ( blocks.blockedUsers.length === 0 && blocks.blockedByUsers.length === 0 ) {
      return null;
    }
    return blocks;
  }

  static async siteID( userID ) {
    const query = squel.select( ).field( "site_id" ).from( "users" ).where( "id = ?", userID );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    if ( rows.length === 0 ) {
      return null;
    }
    return rows[0].site_id;
  }

  static async localeDefaults( userID ) {
    const query = squel.select( )
      .field( "users.login" )
      .field( "users.locale" )
      .field( "users.place_id" )
      .field( "users.suspended_at" )
      .field( "places.name", "place_name" )
      .field( "places.ancestry", "place_ancestry" )
      .field( "preferences.value", "prefers_common_names" )
      .field( "ru_admins_roles.name", "is_admin" )
      .field( "ru_curators_roles.name", "is_curator" )
      .from( "users" )
      .left_join( "places", null, "users.place_id = places.id" )
      .left_join( "preferences", null,
        "users.id = preferences.owner_id AND preferences.owner_type = 'User' AND "
        + "preferences.name = 'common_names'" )
      .left_join( "(roles_users ru_admins join roles ru_admins_roles ON "
        + "(ru_admins.role_id = ru_admins_roles.id AND ru_admins_roles.name = 'admin'))",
        null, "users.id = ru_admins.user_id" ) // eslint-disable-line indent
      .left_join( "(roles_users ru_curators join roles ru_curators_roles ON "
        + "(ru_curators.role_id = ru_curators_roles.id AND ru_curators_roles.name = 'curator'))",
        null, "users.id = ru_curators.user_id" ) // eslint-disable-line indent
      .where( "users.id = ?", userID );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    if ( _.isEmpty( rows ) ) { return null; }
    const row = rows[0];
    const defaults = {
      defaultsLoaded: true,
      prefersCommonNames: row.prefers_common_names !== "f"
    };
    if ( row.locale ) { defaults.locale = row.locale; }
    if ( row.is_admin ) { defaults.isAdmin = true; }
    if ( row.is_curator ) { defaults.isCurator = true; }
    if ( row.suspended_at ) { defaults.isSuspended = true; }
    if ( row.place_id ) {
      defaults.preferredPlace = {
        id: row.place_id,
        name: row.place_name,
        ancestor_place_ids: row.place_ancestry
          ? row.place_ancestry.split( "/" ).map( Number ) : []
      };
    }
    return defaults;
  }
};

User.modelName = "user";
User.tableName = "users";
User.returnFields = [
  "id", "login", "name"
];

module.exports = User;
