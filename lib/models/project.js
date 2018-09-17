"use strict";
var _ = require( "lodash" ),
    squel = require( "squel" ),
    moment = require( "moment" ),
    pgClient = require( "../pg_client" ),
    DBModel = require( "./db_model" ),
    ESModel = require( "./es_model" ),
    List = require( "./list" ),
    ProjectUser = require( "./project_user" ),
    Place = require( "./place" ),
    Taxon = require( "./taxon" ),
    User = require( "./user" ),
    util = require( "../util" ),
    Model = require( "./model" );

var Project = class Project extends Model {

  constructor( attrs ) {
    super( attrs );
    this.is_umbrella = ( this.project_type === "umbrella" );
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
      join( "users u", null, "project_users.user_id=u.id" ).
      where( "project_users.project_id = ?", this.id );
    if( options.role == "manager" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" ).
        where( "project_users.role = 'manager' OR projects.user_id = project_users.user_id" );
    } else if( options.role == "curator" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" ).
        where( "project_users.role IN ? OR projects.user_id = project_users.user_id",
          [ "manager", "curator" ]);
    }
    if ( options.order_by === "login" ) {
      query = query.order( "u.login" );
    } else {
      query = query.order( "observations_count", false );
    }
    query = query.limit( options.per_page ).
      offset( ( options.page - 1 ) * options.per_page );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var project_users = _.map( result.rows, function( r ) {
          return new ProjectUser( r );
        });
        ESModel.fetchBelongsTo( project_users, User, {
          source: { includes: ["id", "login", "icon", "name"] } }, () => {
          callback( null, project_users );
        });
      }
    );
  }

  static findAllByIDElastic( id, callback ) {
    var ids = util.paramArray( id );
    const options = { searchSlug: true, source: Project.returnFields };
    ESModel.fetchResultsHashByIDs( ids, Project, options, ( err, resultsHash ) => {
      if ( err ) { return callback( err ); }
      const projects = _.map( _.values( resultsHash ), r => new Project( r ) );
      Project.preloadForRules( projects, { }, err => {
        if ( err ) { return callback( err ); }
        callback( null, projects );
      });
    });
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

  static preloadInto( arr, localeOpts, callback ) {
    ESModel.fetchBelongsTo( arr, Project, { source: Project.returnFields }, err => {
      if ( err ) { return callback( err ); }
      callback( )
    });
  }

  static preloadForRules( projects, options, callback ) {
    // add umbrella subprojects to the array if projects to preload
    if ( options.skipSubprojects !== false ) {
      const umbrellaProjects = _.filter( projects, p => p.is_umbrella );
      if ( !_.isEmpty( umbrellaProjects ) ) {
        const projectRules = _.compact( _.flatten( _.map( umbrellaProjects, p => (
          _.filter( p.project_observation_rules, rule => rule.operand_type === "Project" )
        ))));
        ESModel.fetchBelongsTo( projectRules, Project, { foreignKey: "operand_id" }, err => {
          if( err ) { return callback( err ); }
          const subprojects = _.compact( _.map( projectRules, "project" ) );
          const nextOptions = Object.assign( { }, options, { skipSubprojects: false } );
          Project.preloadForRules( projects.concat( subprojects ), nextOptions, callback );
        });
        return;
      }
    }
    const taxonOpts = {
      modifier: t => t.prepareForResponse( options.localeOpts ),
      source: { excludes: [ "taxon_photos" ] },
      foreignKey: "operand_id"
    };
    const placeOpts = {
      source: { excludes: [ "geometry_geojson", "point_geojson" ] },
      foreignKey: "operand_id"
    };
    const taxonRules =[];
    const userRules =[];
    const placeRules =[];
    const projectRules =[];
    _.each( projects, project => {
      _.each( project.project_observation_rules, rule => {
        if ( rule.operand_type === "Taxon" ) {
          taxonRules.push( rule );
        } else if ( rule.operand_type === "User" ) {
          userRules.push( rule );
        } else if ( rule.operand_type === "Place" ) {
          placeRules.push( rule );
        } else if ( rule.operand_type === "Project" ) {
          projectRules.push( rule );
        }
      });
    });
    ESModel.fetchBelongsTo( projects, Place, { source: { excludes: [ "geometry_geojson" ] } }, err => {
      if( err ) { return callback( err ); }
      ESModel.fetchBelongsTo( taxonRules, Taxon, taxonOpts, err => {
        if( err ) { return callback( err ); }
        ESModel.fetchBelongsTo( userRules, User, { foreignKey: "operand_id" }, err => {
          if( err ) { return callback( err ); }
          ESModel.fetchBelongsTo( placeRules, Place, placeOpts, err => {
            if( err ) { return callback( err ); }
            callback( null, projects );
          });
        });
      });
    });
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
  "project_type",
  "location",
  "icon",
  "icon_file_name",
  "project_observation_fields",
  "header_image_url",
  "header_image_file_name",
  "header_image_contain",
  "search_parameters",
  "place_id",
  "project_observation_rules",
  "rule_preferences",
  "banner_color",
  "hide_title",
  "featured_at",
  "created_at",
  "updated_at",
  "user_id",
  "user_ids",
  "admins",
  "flags",
  "terms"
];

module.exports = Project;
