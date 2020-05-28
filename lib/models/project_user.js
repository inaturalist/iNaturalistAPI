const Model = require( "./model" );

const ProjectUser = class ProjectUser extends Model { };

ProjectUser.modelName = "project_user";
ProjectUser.tableName = "project_users";

module.exports = ProjectUser;
