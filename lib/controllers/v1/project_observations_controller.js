"use strict";
var project_observations = require( "inaturalistjs" ).project_observations,
    InaturalistAPI = require( "../../inaturalist_api" ),
    ProjectObservationsController = { };

var ProjectObservationsController = class ProjectObservationsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.create, req ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.update, req ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( project_observations.delete, req  ).then( r => {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ProjectObservationsController;
