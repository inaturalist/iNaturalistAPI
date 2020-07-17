const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const ProjectUser = class ProjectUser extends Model {
  static async usersTrustingProjectFor( projectId, obscurationSource ) {
    const query = squel
      .select( )
      .field( "user_id" )
      .from( "project_users" )
      .join( "preferences", null, "project_users.id = preferences.owner_id" )
      .where( "project_users.project_id = ?", projectId )
      .where( "preferences.name = 'curator_coordinate_access_for'" )
      .where( "preferences.value = ?", obscurationSource );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return _.map( rows, r => r.user_id );
  }

  static async projectsTrustedByUserFor( userId, obscurationSource ) {
    const query = squel.select( )
      .field( "project_users.project_id" )
      .from( "project_users" )
      .join( "preferences", null, "project_users.id = preferences.owner_id" )
      .where( "project_users.user_id = ?", userId )
      .where( "preferences.name = 'curator_coordinate_access_for'" )
      .where( "preferences.value = ?", obscurationSource );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return _.map( rows, r => r.project_id );
  }
};

ProjectUser.modelName = "project_user";
ProjectUser.tableName = "project_users";

module.exports = ProjectUser;
