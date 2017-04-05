"use strict";
var observationFieldValues = require( "inaturalistjs" ).observation_field_values,
    InaturalistAPI = require( "../../inaturalist_api" );

var ObservationFieldValuesController = class ObservationFieldValuesController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.update, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( observationFieldValues.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ObservationFieldValuesController;
