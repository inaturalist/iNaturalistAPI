"use strict";
var _ = require( "underscore" ),
    moment = require( "moment-timezone" );

moment.tz.setDefault("UTC");

var Model = class Model {

  constructor( attrs ) {
    Object.assign( this, attrs );
    Model.formatDates( this );
  }

  static formatDates( obj ) {
    Object.keys( obj ).forEach( ( attr ) => {
      if( _.isString( obj[ attr ] ) &&
          obj[ attr ].match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) ) {
        obj[ attr ] = moment.parseZone( obj[ attr ] ).format( );
      } else if( _.isDate( obj[ attr ] ) ) {
        obj[ attr ] = moment.parseZone( obj[ attr ] ).format( );
      } else if( _.isObject( obj[ attr ] ) ) {
        Model.formatDates( obj[ attr ] );
      }
    });
  }
  // Given an array of objects (e.g. [ obs, obs, ... ]), and an associated model,
  // return a compact, unique array of the foreign_keys for that model
  // e.g. Model.belongsToIDs([ obs, ...], User) returns an array of unique values
  //      from all obs.user_id and obs.user.id
  static belongsToIDs( objects, model ) {
    var modelID = model.modelName + "_id";
    if( !_.isArray( objects ) || objects.length == 0 ) {
      return;
    }
    var ids = _.map( objects, function( o ) {
      if( o[ model.modelName ] && o[ model.modelName ].id ) {
        return o[ model.modelName ].id;
      }
      return o[ modelID ];
    });
    ids = _.filter( _.uniq( ids ), _.identity );
    if( ids.length == 0 ) { return; }
    return ids;
  }

  static injectHasMany( objects, model, resultsHash ) {
    var assoc = model.modelNamePlural || model.tableName;
    // Example: for each obs (where results are identifications)
    _.each( objects, function( o ) {
      // obs has an ID and we have identifications for that obs
      if( o.id && !_.isEmpty( resultsHash[ o.id ] ) ) {
        // add the identifications to obs as an array
        o[ assoc ] = _.map( _.values( resultsHash[ o.id ] ), function( v ) {
          return new model( v );
        });
      } else {
        // there were no identifications for the obs, set to empty array
        o[ assoc ] = [ ];
      }
    });
  }

  static injectBelongsTo( objects, model, resultsHash, modifier ) {
    var modelID = model.modelName + "_id";
    // Example: for each obs (where results are users)
    _.each( objects, function( o ) {
      var association = null;
      var assocObj = o[ model.modelName ];
      var assocID = o[ modelID ];
      // obs.user.id exists and we have that user in the results
      if( assocObj && assocObj.id &&
          !_.isEmpty( resultsHash[ assocObj.id ] ) ) {
        // extend obs.user with the properties in the result and turn it into User
        association = new model(
          _.extend( { }, assocObj, resultsHash[ assocObj.id ] ));
      }
      // obs.user_id exists and we have that user in the results
      else if( assocID && !_.isEmpty( resultsHash[ assocID ] ) ) {
        // create a new User instance
        association = new model( resultsHash[ assocID ] );
        // remove obs.user_id
        delete o[ modelID ];
      }
      if( association ) {
        if( modifier ) {
          // run any post-initialization requested for the instance.
          // This needs to run here in the objects loop, instead of the
          // `fetchBelongsTo` methods, since the results may be combined with
          // original objects properties, and that could affect the modifier
          modifier( association );
        }
        // assign the new instance to obs.user
        o[ model.modelName ] = association;
      }
    });
  }

};

module.exports = Model;
