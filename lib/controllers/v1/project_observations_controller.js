// eslint-disable-next-line camelcase
const { project_observations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ProjectObservationsController = class ProjectObservationsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( project_observations.create, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( project_observations.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( project_observations.delete, req );
  }
};

module.exports = ProjectObservationsController;
