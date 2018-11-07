const Model = require( "./model" );

const ProjectUser = class User extends Model { };

ProjectUser.modelName = "project_user";
ProjectUser.tableName = "project_users";

module.exports = ProjectUser;
