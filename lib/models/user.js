const _ = require( "lodash" );
const squel = require( "squel" ).useFlavour( "postgres" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const util = require( "../util" );
const Model = require( "./model" );

const User = class User extends Model {
  constructor( attrs ) {
    super( attrs );
    this.icon_url = User.iconUrl( this );
    this.orcid = this.orcid ? `https://orcid.org/${this.orcid}` : null;
  }

  static async dbAttributesFromLogin( login ) {
    if ( _.isEmpty( login ) ) { return null; }
    const query = squel.select( )
      .field( "email" )
      .field( "locale" )
      .field( "place_id" )
      .field( "site_id" )
      .field( "snf.value as prefers_scientific_name_first" )
      .field( "nt.value as prefers_no_tracking" )
      .from( "users" )
      .left_join( "preferences snf", null,
        "users.id = snf.owner_id AND snf.owner_type = 'User' AND snf.name = 'scientific_name_first'" )
      .left_join( "preferences nt", null,
        "users.id = nt.owner_id AND nt.owner_type = 'User' AND nt.name = 'no_tracking'" )
      .where( "login = ?", login );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const userObject = _.mapValues( rows[0], v => v || null );
    userObject.prefers_scientific_name_first = (
      userObject.prefers_scientific_name_first === "t"
    );
    userObject.prefers_no_tracking = (
      userObject.prefers_no_tracking === "t"
    );
    return userObject;
  }

  static async findByLogin( login ) {
    if ( _.isEmpty( login ) ) { return null; }
    const query = squel.select( )
      .field( "id, login, name" )
      .from( "users" )
      .where( "login = ?", login );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return rows[0] ? rows[0] : null;
  }

  static async findByLoginOrID( login ) {
    let query = squel.select( ).field( "id, login, name" ).from( "users" );
    const asInt = Number( login );
    if ( asInt ) {
      query = query.where( "id = ? OR login = '?'", asInt, asInt );
    } else {
      query = query.where( "login = ?", login );
    }
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return rows[0] ? rows[0] : null;
  }

  static async findAllByLoginOrID( param ) {
    const logins = util.paramArray( param );
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
    const results = await esClient.searchAsync( "users", query );
    return results.hits.hits[0] ? results.hits.hits[0]._source : null;
  }

  static findByIDInES( ids, callback ) {
    const userIDs = _.compact( _.flattenDeep( [ids] ) );
    const query = { body: { query: { terms: { id: userIDs } } } };
    esClient.search( "users", query, ( err, results ) => {
      if ( err ) { return void callback( err ); }
      callback( null, results.hits.hits.map( h => h._source ) );
    } );
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

  static projectsCurated( userID, callback ) {
    const query = squel.select( ).field( "project_id" ).from( "project_users" )
      .where( "user_id = ?", userID )
      .where( "role IN ?", ["manager", "curator"] );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      callback( null, _.map( result.rows, "project_id" ) );
    } );
  }

  static trustingUsers( userID, callback ) {
    const query = squel.select( ).field( "user_id" ).from( "friendships" )
      .where( "friend_id = ?", userID )
      .where( "trust" );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      callback( null, _.map( result.rows, "user_id" ) );
    } );
  }

  static blocks( userID, callback ) {
    const query = squel.select( )
      .field( "user_id, blocked_user_id, users.login AS user_login, blocked_users.login AS blocked_user_login" )
      .from( "user_blocks" )
      .left_join( "users", "users", "user_blocks.user_id = users.id" )
      .left_join( "users", "blocked_users", "user_blocks.blocked_user_id = blocked_users.id" )
      .where( "user_id = ? OR blocked_user_id = ?", userID, userID );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const blocks = {
        blockedUsers: [],
        blockedByUsers: []
      };
      _.map( result.rows, r => {
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
        callback( null, null );
      } else {
        callback( null, blocks );
      }
    } );
  }

  static siteID( userID, callback ) {
    const query = squel.select( ).field( "site_id" ).from( "users" ).where( "id = ?", userID );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      if ( result.rows.length === 0 ) {
        return void callback( null, null );
      }
      callback( null, result.rows[0].site_id );
    } );
  }

  static localeDefaults( userID, callback ) {
    const query = squel.select( )
      .field( "users.locale" )
      .field( "users.place_id" )
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
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      if ( _.isEmpty( result.rows ) ) { return void callback( ); }
      const row = result.rows[0];
      const defaults = {
        prefersCommonNames: row.prefers_common_names !== "f"
      };
      if ( row.locale ) { defaults.locale = row.locale; }
      if ( row.is_admin ) { defaults.isAdmin = true; }
      if ( row.is_curator ) { defaults.isCurator = true; }
      if ( row.place_id ) {
        defaults.preferredPlace = {
          id: row.place_id,
          name: row.place_name,
          ancestor_place_ids: row.place_ancestry
            ? row.place_ancestry.split( "/" ).map( Number ) : []
        };
      }
      callback( null, defaults );
    } );
  }
};

User.modelName = "user";
User.tableName = "users";
User.returnFields = [
  "id", "login", "name"
];

module.exports = User;
