const { project_users: projectUsers } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ProjectUsersController = class ProjectUsersController {
  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( projectUsers.update, req );
  }
};

module.exports = ProjectUsersController;
