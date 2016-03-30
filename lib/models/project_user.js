"use strict";
var Model = require( "./model" );

var ProjectUser = class User extends Model {

};

ProjectUser.modelName = "project_user";
ProjectUser.tableName = "project_users";

module.exports = ProjectUser;
