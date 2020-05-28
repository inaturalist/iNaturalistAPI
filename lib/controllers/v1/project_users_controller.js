const { project_users } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ProjectUsersController = class ProjectUsersController {
  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( project_users.update, req );
  }
};

module.exports = ProjectUsersController;
