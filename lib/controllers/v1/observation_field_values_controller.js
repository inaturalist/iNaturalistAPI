"use strict";
var observation_field_values = require( "inaturalistjs" ).observation_field_values,
    InaturalistAPI = require( "../../inaturalist_api" );

var ObservationFieldValuesController = class ObservationFieldValuesController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.create, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.update, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = ObservationFieldValuesController;
