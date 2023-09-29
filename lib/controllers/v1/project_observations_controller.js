const { project_observations: projectObservations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ProjectObservationsController = class ProjectObservationsController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( projectObservations.create, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( projectObservations.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( projectObservations.delete, req );
  }
};

module.exports = ProjectObservationsController;
