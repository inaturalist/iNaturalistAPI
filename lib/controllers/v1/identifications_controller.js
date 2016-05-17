"use strict";
var identifications = require( "inaturalistjs" ).identifications,
    util = require( "../../util" ),
    Identification = require( "../../models/identification" ),
    InaturalistAPI = require( "../../inaturalist_api" );

var IdentificationsController = class IdentificationsController {

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.create, req ).then( function( r ) {
      var arr = [ { identification_id: r.id } ];
      var localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, function( ) {
        return callback( null, arr[0].identification );
      });
    }).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.update, req ).then( function( r ) {
      var arr = [ { identification_id: r.id } ];
      var localeOpts = util.localeOpts( req );
      Identification.preloadInto( arr, localeOpts, function( ) {
        return callback( null, arr[0].identification );
      });
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( identifications.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

};

module.exports = IdentificationsController;
