// eslint-disable-next-line camelcase
const { project_observations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ProjectObservationsController = class ProjectObservationsController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.update, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = ProjectObservationsController;
