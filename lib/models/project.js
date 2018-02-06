"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ),
    moment = require( "moment" ),
    pgClient = require( "../pg_client" ),
    DBModel = require( "./db_model" ),
    List = require( "./list" ),
    ProjectUser = require( "./project_user" ),
    User = require( "./user" ),
    util = require( "../util" ),
    Model = require( "./model" );


var Project = class Project extends Model {

  constructor( attrs, options ) {
    super( attrs );
    options = options || { };
    util.locationToLatLng( this );
  }

  searchParams( callback ) {
    var params = { };
    var project = this;
    // we need to load 3 things asynchronously to prepare:
    // date preference, the project list, and observation rules
    project.prefersRangeByDate( function( err, prefersDate ) {
      project.projectList( function( err, list ) {
        project.observationRules( function( err, rules ) {
          if( project.start_time && project.end_time ) {
            if( prefersDate === true ) {
              params.d1 = moment.utc( project.start_time ).format( "YYYY-MM-DD" );
              params.d2 = moment.utc( project.end_time ).format( "YYYY-MM-DD" );
            } else {
              params.d1 = moment.utc( project.start_time ).format( "YYYY-MM-DDTHH:mm:ssZ" );
              params.d2 = moment.utc( project.end_time ).format( "YYYY-MM-DDTHH:mm:ssZ" );
            }
          }
          var taxonIDs = [ ];
          var placeIDs = [ project.place_id ];
          _.each( rules, function( rule ) {
            switch( rule.operator ) {
              case "in_taxon?":
                taxonIDs.push( rule.operand_id );
                break;
              case "observed_in_place?":
                placeIDs.push( rule.operand_id );
                break;
              case "on_list?":
                if( list ) {
                  params.list = list;
                }
                break;
              case "identified?":
                params.identified = "true";
                break;
              case "georeferenced?":
                params.has = params.has || [ ];
                params.has.push( "geo" );
                break;
              case "has_a_photo?":
                params.has = params.has || [ ];
                params.has.push( "photos" );
                break;
              case "has_a_sound?":
                params.has = params.has || [ ];
                params.has.push( "sounds" );
                break;
              case "captive?":
                params.captive = "true";
                break;
              case "wild?":
                params.captive = "false";
                break;
              case "verifiable?":
                params.verifiable = "true";
                break;
            }
          });
          taxonIDs = _.compact( _.uniq( taxonIDs ) );
          placeIDs = _.compact( _.uniq( placeIDs ) );
          if( taxonIDs.length > 0 ) {
            params.taxon_ids = taxonIDs;
          }
          if( placeIDs.length > 0 ) {
            params.place_id = placeIDs;
          }
          if( params.list ) {
            list.taxonIDs( function( err, ids ) {
              delete params.list;
              params.taxon_ids = params.taxon_ids || [ ];
              params.taxon_ids = params.taxon_ids.concat( ids );
              return callback( null, params );
            });
          } else {
            callback( null, params );
          }
        });
      });
    });
  }

  prefersRangeByDate( callback ) {
    if( !_.isUndefined( this.date_range_preference ) ) {
      return callback( null, this.date_range_preference );
    }
    var query = squel.select( ).field( "id ").from( "preferences" ).
      where( "owner_id = ? AND owner_type = 'Project'", this.id ).
      where( "name = 'range_by_date' AND value = 't'" ).
      limit( 1 );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        this.date_range_preference = ( result.rows.length > 0 );
        callback( null, this.date_range_preference );
      }
    );
  }

  projectList( callback ) {
    if( !_.isUndefined( this.list ) ) {
      return callback( null, this.list );
    }
    var query = squel.select( ).field( "*" ).from( "lists" ).
      where( "type = 'ProjectList' AND project_id = ?", this.id ).limit( 1 );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        this.list = result.rows[0] ? new List( result.rows[0] ) : false;
        callback( null, this.list );
      }
    );
  }

  observationRules( callback ) {
    if( !_.isUndefined( this.rules ) ) {
      return callback( null, this.rules );
    }
    var query = squel.select( ).field( "*" ).from( "rules" ).
      where( "ruler_type = 'Project' AND ruler_id = ?", this.id ).
      where( "type = 'ProjectObservationRule'" );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        this.rules = result.rows;
        callback( null, this.rules );
      }
    );
  }

  members( options, callback ) {
    options = options || { };
    options.page = options.page || 1;
    options.per_page = options.per_page || 30;
    var query = squel.select( ).
      field( "project_users.*, COUNT(project_users.id) OVER() as total_count" ).
      from( "project_users" ).
      where( "project_users.project_id = ?", this.id );
    if( options.role == "manager" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" ).
        where( "project_users.role = 'manager' OR projects.user_id = project_users.user_id" );
    } else if( options.role == "curator" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" ).
        where( "project_users.role IN ? OR projects.user_id = project_users.user_id",
          [ "manager", "curator" ]);
    }
    query = query.order( "observations_count", false ).
      limit( options.per_page ).
      offset( ( options.page - 1 ) * options.per_page );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var project_users = _.map( result.rows, function( r ) {
          return new ProjectUser( r );
        });
        DBModel.fetchBelongsTo( project_users, User, function( ) {
          callback( null, project_users );
        });
      }
    );
  }

  static findByID( id, callback ) {
    var query = squel.select( ).field( "*" ).
      field( "start_time AT TIME ZONE 'UTC' start_time" ).
      field( "end_time AT TIME ZONE 'UTC' end_time" ).from( "projects" );
    var asInt = Number( id );
    if( asInt ) {
      query = query.where( "id = ? OR slug = '?'", asInt, asInt );
    } else {
      query = query.where( "slug = ?", id );
    }
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var project = result.rows[0] ? new Project( result.rows[0] ) : false;
        callback( null, project );
      }
    );
  }

};

Project.modelName = "project";
Project.indexName = "projects";
Project.tableName = "projects";
Project.returnFields = [
  "id",
  "title",
  "description",
  "slug",
  "location",
  "icon",
  "project_observation_fields",
  "header_image_url"
];

module.exports = Project;
