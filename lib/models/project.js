const _ = require( "lodash" );
const squel = require( "safe-squel" );
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

  async searchParams( ) {
    const params = { };
    // we need to load 3 things asynchronously to prepare:
    // date preference, the project list, and observation rules
    const prefersDate = await this.prefersRangeByDate( );
    const list = await this.projectList( );
    const rules = await this.observationRules( );
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
      const ids = await list.taxonIDs( );
      delete params.list;
      params.taxon_ids = params.taxon_ids || [];
      params.taxon_ids = params.taxon_ids.concat( ids );
    }
    return params;
  }

  async prefersRangeByDate( ) {
    if ( !_.isUndefined( this.date_range_preference ) ) {
      return this.date_range_preference;
    }
    const query = squel.select( ).field( "id" ).from( "preferences" )
      .where( "owner_id = ? AND owner_type = 'Project'", this.id )
      .where( "name = 'range_by_date' AND value = 't'" )
      .limit( 1 );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    this.date_range_preference = ( rows.length > 0 );
    return this.date_range_preference;
  }

  async projectList( ) {
    if ( !_.isUndefined( this.list ) ) {
      return this.list;
    }
    const query = squel.select( ).field( "*" ).from( "lists" )
      .where( "type = 'ProjectList' AND project_id = ?", this.id )
      .limit( 1 );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    this.list = rows[0] ? new List( rows[0] ) : false;
    return this.list;
  }

  async observationRules( ) {
    if ( !_.isUndefined( this.rules ) ) {
      return this.rules;
    }
    const query = squel.select( ).field( "*" ).from( "rules" )
      .where( "ruler_type = 'Project' AND ruler_id = ?", this.id )
      .where( "type = 'ProjectObservationRule'" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    this.rules = rows;
    return this.rules;
  }

  membersBaseQuery( options = { } ) {
    let query = squel.select( )
      .from( "project_users" )
      .where( "project_users.project_id = ?", this.id );
    if ( options.role === "manager" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" )
        .where( "project_users.role = 'manager' OR projects.user_id = project_users.user_id" );
    } else if ( options.role === "curator" ) {
      query = query.join( "projects", null, "project_users.project_id = projects.id" )
        .where(
          "project_users.role IN ? OR projects.user_id = project_users.user_id",
          ["manager", "curator"]
        );
    }
    return query;
  }

  async members( options ) {
    options = options || { };
    options.page = options.page || 1;
    options.per_page = options.per_page || 30;
    let query = this.membersBaseQuery( options )
      .field( "project_users.*" )
      .join( "users u", null, "project_users.user_id=u.id" );
    if ( options.order_by === "login" ) {
      query = query.order( "u.login" );
    } else {
      query = query.order( "observations_count", false );
    }
    query = query.limit( options.per_page )
      .offset( ( options.page - 1 ) * options.per_page );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const projectUsers = _.map( rows, r => new ProjectUser( r ) );
    await ESModel.fetchBelongsTo( projectUsers, User, {
      source: {
        includes: ["id", "login", "icon", "name"]
      }
    } );
    return projectUsers;
  }

  async membersCount( options ) {
    options = options || { };
    const query = this.membersBaseQuery( options )
      .field( "count(*) as total_count" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return Number( rows[0].total_count );
  }

  static async findAllByIDElastic( id ) {
    const ids = util.paramArray( id );
    const options = { searchSlug: true, source: Project.returnFields };
    const resultsHash = await ESModel.fetchResultsHashByIDs( ids, Project, options );
    const projects = _.map( _.values( resultsHash ), r => new Project( r ) );
    await Project.preloadForRules( projects, { umbrellaOnly: true } );
    return projects;
  }

  static async findByID( id ) {
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
    const sql = query.toString( );
    const { rows } = await pgClient.connection.query( sql );
    return rows[0] ? new Project( rows[0] ) : false;
  }

  static async preloadInto( arr ) {
    await ESModel.fetchBelongsTo( arr, Project, { source: Project.returnFields } );
  }

  static async preloadForRules( projects, options ) {
    // add umbrella subprojects to the array if projects to preload
    if ( options.skipSubprojects !== false ) {
      const umbrellaProjects = _.filter( projects, p => p.is_umbrella );
      if ( !_.isEmpty( umbrellaProjects ) ) {
        const projectRules = _.compact( _.flatten( _.map( umbrellaProjects, p => (
          _.filter( p.project_observation_rules, rule => rule.operand_type === "Project" )
        ) ) ) );
        await ESModel.fetchBelongsTo( projectRules, Project, { foreignKey: "operand_id" } );
        const subprojects = _.compact( _.map( projectRules, "project" ) );
        const nextOptions = Object.assign( { }, options, { skipSubprojects: false } );
        if ( options.umbrellaOnly === true ) {
          return;
        }
        await Project.preloadForRules( projects.concat( subprojects ), nextOptions );
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
    await Promise.all( [
      ESModel.fetchBelongsTo( projects, Place, { source: { excludes: ["geometry_geojson"] } } ),
      ESModel.fetchBelongsTo( taxonRules, Taxon, taxonOpts ),
      ESModel.fetchBelongsTo( userRules, User, { foreignKey: "operand_id" } ),
      ESModel.fetchBelongsTo( placeRules, Place, placeOpts ),
      ESModel.fetchBelongsTo( projectRules, Project, { foreignKey: "operand_id" } ),
      ESModel.fetchBelongsTo( controlledTermRules, ControlledTerm, { foreignKey: "value" } )
    ] );
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
  "observation_requirements_updated_at",
  "place_id",
  "prefers_user_trust",
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
