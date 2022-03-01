const _ = require( "lodash" );
const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const ProjectUser = class ProjectUser extends Model {
  static CURATOR_COORDINATE_ACCESS_WAIT_DAYS = 7;

  static async usersTrustingProjectFor( projectIdsArg, obscurationSourceArg ) {
    let obscurationSource = obscurationSourceArg;
    if ( !_.isArray( obscurationSourceArg ) ) {
      obscurationSource = [obscurationSourceArg];
    }
    let projectIds = projectIdsArg;
    if ( !_.isArray( projectIdsArg ) ) {
      projectIds = [projectIdsArg];
    }
    const query = squel
      .select( )
      .field( "project_users.user_id" )
      .from( "project_users" )
      .join( "preferences pup", null, "project_users.id = pup.owner_id AND pup.owner_type = 'ProjectUser'" )
      .join( "preferences pp", null, "project_users.project_id = pp.owner_id AND pp.owner_type = 'Project'" )
      .where( "pp.name = 'user_trust'" )
      .where( "pp.value = 't'" )
      .where( "project_users.project_id IN ?", projectIds )
      .where( "pup.name = 'curator_coordinate_access_for'" )
      .where( "pup.value IN ?", obscurationSource );
    const { rows } = await pgClient.connection.query( query.toString( ) ).catch( e => {
      console.log( `[DEBUG] Error retrieving usersTrustingProjectFor with query ${query.toString( )}: `, e );
      throw e;
    } );
    return _.map( rows, r => r.user_id );
  }

  static async projectsTrustedByUserFor( userId, obscurationSourceArg ) {
    let obscurationSource = obscurationSourceArg;
    if ( !_.isArray( obscurationSourceArg ) ) {
      obscurationSource = [obscurationSourceArg];
    }
    const query = squel.select( )
      .field( "project_users.project_id" )
      .from( "project_users" )
      .join( "preferences pup", null, "project_users.id = pup.owner_id AND pup.owner_type = 'ProjectUser'" )
      .join( "preferences pp", null, "project_users.project_id = pp.owner_id AND pp.owner_type = 'Project'" )
      .where( "pp.name = 'user_trust'" )
      .where( "pp.value = 't'" )
      .where( "project_users.user_id = ?", userId )
      .where( "pup.name = 'curator_coordinate_access_for'" )
      .where( "pup.value IN ?", obscurationSource );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return _.map( rows, r => r.project_id );
  }
};

ProjectUser.modelName = "project_user";
ProjectUser.tableName = "project_users";

module.exports = ProjectUser;
