const _ = require( "lodash" );
const squel = require( "squel" );
const moment = require( "moment" );
const pgClient = require( "../pg_client" );
const ESModel = require( "./es_model" );
const ControlledTerm = require( "./controlled_term" );
const List = require( "./list" );
const ProjectUser = require( "./project_user" );
const Place = require( "./place" );
const Taxon = require( "./taxon" );
const User = require( "./user" );
const util = require( "../util" );
const Model = require( "./model" );

const Project = class Project extends Model {
  constructor( attrs ) {
    super( attrs );
    this.is_umbrella = ( this.project_type === "umbrella" );
    util.locationToLatLng( this );
  }

  searchParams( callback ) {
    const params = { };
    // we need to load 3 things asynchronously to prepare:
    // date preference, the project list, and observation rules
    this.prefersRangeByDate( ( err, prefersDate ) => {
      if ( err ) { return void callback( err ); }
      this.projectList( ( err2, list ) => {
        if ( err2 ) { return void callback( err2 ); }
        this.observationRules( ( err3, rules ) => {
          if ( err3 ) { return void callback( err3 ); }
          if ( this.start_time && this.end_time ) {
            if ( prefersDate === true ) {
              params.d1 = moment.utc( this.start_time ).format( "YYYY-MM-DD" );
              params.d2 = moment.utc( this.end_time ).format( "YYYY-MM-DD" );
            } else {
              params.d1 = moment.utc( this.start_time ).format( "YYYY-MM-DDTHH:mm:ssZ" );
              params.d2 = moment.utc( this.end_time ).format( "YYYY-MM-DDTHH:mm:ssZ" );
            }
          }
          let taxonIDs = [];
          let placeIDs = [this.place_id];
          _.each( rules, rule => {
            switch ( rule.operator ) {
              case "in_taxon?":
                taxonIDs.push( rule.operand_id );
                break;
              case "observed_in_place?":
                placeIDs.push( rule.operand_id );
                break;
              case "on_list?":
                if ( list ) {
                  params.list = list;
                }
                break;
              case "identified?":
                params.identified = "true";
                break;
              case "georeferenced?":
                params.has = params.has || [];
                params.has.push( "geo" );
                break;
              case "has_a_photo?":
                params.has = params.has || [];
                params.has.push( "photos" );
                break;
              case "has_a_sound?":
                params.has = params.has || [];
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
              default:
                // do nothing
            }
          } );
          taxonIDs = _.compact( _.uniq( taxonIDs ) );
          placeIDs = _.compact( _.uniq( placeIDs ) );
          if ( taxonIDs.length > 0 ) {
            params.taxon_ids = taxonIDs;
          }
          if ( placeIDs.length > 0 ) {
            params.place_id = placeIDs;
          }
          if ( params.list ) {
            list.taxonIDs( ( err4, ids ) => {
              if ( err4 ) { return void callback( err4 ); }
              delete params.list;
              params.taxon_ids = params.taxon_ids || [];
              params.taxon_ids = params.taxon_ids.concat( ids );
              return void callback( null, params );
            } );
          } else {
            callback( null, params );
          }
        } );
      } );
    } );
  }

  prefersRangeByDate( callback ) {
    if ( !_.isUndefined( this.date_range_preference ) ) {
      return void callback( null, this.date_range_preference );
    }
    const query = squel.select( ).field( "id" ).from( "preferences" )
      .where( "owner_id = ? AND owner_type = 'Project'", this.id )
      .where( "name = 'range_by_date' AND value = 't'" )
      .limit( 1 );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      this.date_range_preference = ( result.rows.length > 0 );
      callback( null, this.date_range_preference );
    } );
  }

  projectList( callback ) {
    if ( !_.isUndefined( this.list ) ) {
      return void callback( null, this.list );
    }
    const query = squel.select( ).field( "*" ).from( "lists" )
      .where( "type = 'ProjectList' AND project_id = ?", this.id )
      .limit( 1 );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      this.list = result.rows[0] ? new List( result.rows[0] ) : false;
      callback( null, this.list );
    } );
  }

  observationRules( callback ) {
    if ( !_.isUndefined( this.rules ) ) {
      return void callback( null, this.rules );
    }
    const query = squel.select( ).field( "*" ).from( "rules" )
      .where( "ruler_type = 'Project' AND ruler_id = ?", this.id )
      .where( "type = 'ProjectObservationRule'" );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      this.rules = result.rows;
      callback( null, this.rules );
    } );
  }

  members( options, callback ) {
    options = options || { };
    options.page = options.page || 1;
    options.per_page = options.per_page || 30;
    let query = squel.select( )
      .field( "project_users.*, COUNT(project_users.id) OVER() as total_count" )
      .from( "project_users" )
      .join( "users u", null, "project_users.user_id=u.id" )
      .where( "project_users.project_id = ?", this.id );
    if ( options.role === "manager" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" )
        .where( "project_users.role = 'manager' OR projects.user_id = project_users.user_id" );
    } else if ( options.role === "curator" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" )
        .where( "project_users.role IN ? OR projects.user_id = project_users.user_id",
          ["manager", "curator"] );
    }
    if ( options.order_by === "login" ) {
      query = query.order( "u.login" );
    } else {
      query = query.order( "observations_count", false );
    }
    query = query.limit( options.per_page )
      .offset( ( options.page - 1 ) * options.per_page );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const projectUsers = _.map( result.rows, r => new ProjectUser( r ) );
      ESModel.fetchBelongsTo( projectUsers,
        User, { source: { includes: ["id", "login", "icon", "name"] } }, ( ) => {
          callback( null, projectUsers );
        } );
    } );
  }

  static findAllByIDElastic( id, callback ) {
    const ids = util.paramArray( id );
    const options = { searchSlug: true, source: Project.returnFields };
    ESModel.fetchResultsHashByIDs( ids, Project, options, ( err, resultsHash ) => {
      if ( err ) { return void callback( err ); }
      const projects = _.map( _.values( resultsHash ), r => new Project( r ) );
      Project.preloadForRules( projects, { umbrellaOnly: true }, errr => {
        if ( errr ) { return void callback( errr ); }
        callback( null, projects );
      } );
    } );
  }

  static findByID( id, callback ) {
    let query = squel.select( ).field( "*" )
      .field( "start_time AT TIME ZONE 'UTC' start_time" )
      .field( "end_time AT TIME ZONE 'UTC' end_time" )
      .from( "projects" );
    const asInt = Number( id );
    if ( asInt ) {
      query = query.where( "id = ? OR slug = '?'", asInt, asInt );
    } else {
      query = query.where( "slug = ?", id );
    }
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const project = result.rows[0] ? new Project( result.rows[0] ) : false;
      callback( null, project );
    } );
  }

  static preloadInto( arr, localeOpts, callback ) {
    ESModel.fetchBelongsTo( arr, Project, { source: Project.returnFields }, err => {
      if ( err ) { return void callback( err ); }
      callback( );
    } );
  }

  static preloadForRules( projects, options, callback ) {
    // add umbrella subprojects to the array if projects to preload
    if ( options.skipSubprojects !== false ) {
      const umbrellaProjects = _.filter( projects, p => p.is_umbrella );
      if ( !_.isEmpty( umbrellaProjects ) ) {
        const projectRules = _.compact( _.flatten( _.map( umbrellaProjects, p => (
          _.filter( p.project_observation_rules, rule => rule.operand_type === "Project" )
        ) ) ) );
        ESModel.fetchBelongsTo( projectRules, Project, { foreignKey: "operand_id" }, err => {
          if ( err ) { return void callback( err ); }
          const subprojects = _.compact( _.map( projectRules, "project" ) );
          const nextOptions = Object.assign( { }, options, { skipSubprojects: false } );
          if ( options.umbrellaOnly === true ) {
            return void callback( );
          }
          Project.preloadForRules( projects.concat( subprojects ), nextOptions, callback );
        } );
        return;
      }
    }
    const taxonOpts = {
      modifier: t => t.prepareForResponse( options.localeOpts ),
      source: { excludes: ["taxon_photos"] },
      foreignKey: "operand_id"
    };
    const placeOpts = {
      source: { excludes: ["geometry_geojson", "point_geojson"] },
      foreignKey: "operand_id"
    };
    const taxonRules = [];
    const userRules = [];
    const placeRules = [];
    const projectRules = [];
    const controlledTermRules = [];
    _.each( projects, project => {
      if ( project.project_type !== "umbrella" ) {
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
        } );
        _.each( project.rule_preferences, rule => {
          if ( rule.field === "term_id" || rule.field === "term_value_id" ) {
            controlledTermRules.push( rule );
          }
        } );
      }
    } );
    ESModel.fetchBelongsTo( projects, Place, { source: { excludes: ["geometry_geojson"] } }, err => {
      if ( err ) { return void callback( err ); }
      ESModel.fetchBelongsTo( taxonRules, Taxon, taxonOpts, err2 => {
        if ( err2 ) { return void callback( err2 ); }
        ESModel.fetchBelongsTo( userRules, User, { foreignKey: "operand_id" }, err3 => {
          if ( err3 ) { return void callback( err3 ); }
          ESModel.fetchBelongsTo( placeRules, Place, placeOpts, err4 => {
            if ( err4 ) { return void callback( err4 ); }
            ESModel.fetchBelongsTo( projectRules, Project, { foreignKey: "operand_id" }, err5 => {
              if ( err5 ) { return void callback( err5 ); }
              ESModel.fetchBelongsTo( controlledTermRules, ControlledTerm, { foreignKey: "value" },
                err6 => {
                  if ( err6 ) { return void callback( err6 ); }
                  callback( null, projects );
                } );
            } );
          } );
        } );
      } );
    } );
  }
};

Project.modelName = "project";
Project.indexName = "projects";
Project.tableName = "projects";
Project.returnFields = [
  "admins",
  "banner_color",
  "created_at",
  "description",
  "featured_at",
  "flags",
  "header_image_contain",
  "header_image_file_name",
  "header_image_url",
  "hide_title",
  "hide_umbrella_map_flags",
  "icon",
  "icon_file_name",
  "id",
  "location",
  "place_id",
  "project_observation_fields",
  "project_observation_rules",
  "project_type",
  "rule_preferences",
  "search_parameters",
  "site_features",
  "slug",
  "terms",
  "title",
  "updated_at",
  "user_id",
  "user_ids"
];

module.exports = Project;
