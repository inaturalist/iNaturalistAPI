const _ = require( "lodash" );
const squel = require( "safe-squel" );
const { projects } = require( "inaturalistjs" );
const esClient = require( "../../es_client" );
const pgClient = require( "../../pg_client" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const Project = require( "../../models/project" );
const Site = require( "../../models/site" );
const User = require( "../../models/user" );

const ProjectsController = class ProjectsController {
  static searchCriteria( req, options = { } ) {
    const filters = [];
    const inverseFilters = [];
    let sort = [];
    if ( req.query.q ) {
      filters.push( {
        bool: {
          should: [
            { term: { slug: req.query.q } },
            { match: { title_autocomplete: { query: req.query.q, operator: "and" } } },
            { match: { title: { query: req.query.q, operator: "and" } } }
          ]
        }
      } );
    } else if ( options.autocomplete ) {
      if ( req.query.member_id ) {
        sort = { title_exact: "asc" };
      } else if ( req.query.title_exact ) {
        filters.push( { term: { title_exact: req.query.title_exact } } );
      } else {
        return null;
      }
    }
    if ( req.query.type ) {
      filters.push( esClient.termFilter( "project_type", req.query.type ) );
    }
    if ( req.query.member_id ) {
      filters.push( esClient.termFilter( "user_ids", req.query.member_id ) );
    }
    if ( req.query.id ) {
      filters.push( esClient.termFilter( "id", req.query.id ) );
    }
    if ( req.query.place_id ) {
      filters.push( esClient.termFilter( "associated_place_ids", req.query.place_id ) );
    }
    if ( req.query.spam === "true" ) {
      filters.push( {
        term: { spam: true }
      } );
    } else if ( req.query.spam === "false" ) {
      inverseFilters.push( {
        term: { spam: true }
      } );
    }
    if ( req.query.not_id ) {
      inverseFilters.push( {
        terms: { id: util.paramArray( req.query.not_id ) }
      } );
    }
    if ( req.query.not_type ) {
      inverseFilters.push( esClient.termFilter( "project_type", req.query.not_type ) );
    }
    if ( req.query.has_params === "true" ) {
      filters.push( { exists: { field: "search_parameter_fields" } } );
    } else if ( req.query.has_params === "false" ) {
      inverseFilters.push( { exists: { field: "search_parameter_fields" } } );
    }
    if ( req.query.has_posts === "true" ) {
      filters.push( { exists: { field: "last_post_at" } } );
    } else if ( req.query.has_posts === "false" ) {
      inverseFilters.push( { exists: { field: "last_post_at" } } );
    }
    if ( req.query.lat && req.query.lng ) {
      const distanceFilter = {
        geo_distance: {
          distance: `${req.query.radius || 500}km`,
          location: { lat: parseFloat( req.query.lat ), lon: parseFloat( req.query.lng ) }
        }
      };
      filters.push( distanceFilter );
      if ( req.query.featured === "false" ) {
        inverseFilters.push( { exists: { field: "featured_at" } } );
      }
    }
    let siteID;
    if ( req.query.featured === "true" || req.query.noteworthy === "true" ) {
      siteID = req.query.site_id;
      if ( !siteID && ( req.userSession && req.userSession.siteID ) ) {
        siteID = req.userSession.siteID; // eslint-disable-line prefer-destructuring
      }
      siteID = siteID || Site.defaultID;
      const featureFilters = [esClient.termFilter( "site_features.site_id", siteID )];
      if ( req.query.noteworthy === "true" ) {
        featureFilters.push( esClient.termFilter( "site_features.noteworthy", true ) );
      }
      filters.push( {
        nested: {
          path: "site_features",
          query: {
            bool: {
              filter: featureFilters
            }
          }
        }
      } );
    }

    if ( _.isEmpty( sort ) ) {
      if ( req.query.order_by === "recent_posts" ) {
        sort.push( {
          last_post_at: {
            order: "desc",
            missing: "_last"
          }
        } );
      } else if ( req.query.lat && req.query.lng && req.query.order_by === "distance" ) {
        sort.push( {
          _geo_distance: {
            location: [parseFloat( req.query.lng ), parseFloat( req.query.lat )],
            unit: "km",
            order: "asc"
          }
        } );
      } else if ( ( req.query.featured === "true" || req.query.noteworthy === "true" )
        && ( req.query.order_by === "featured" ) ) {
        sort.push( {
          "site_features.featured_at": {
            order: "desc",
            nested_path: "site_features",
            nested_filter: {
              term: {
                "site_features.site_id": siteID
              }
            }
          }
        } );
      } else if ( req.query.order_by === "created" ) {
        sort.push( { created_at: "desc" } );
      } else if ( req.query.order_by === "updated" ) {
        sort.push( { updated_at: "desc" } );
      } else if ( req.query.order_by === "id" ) {
        sort.push( { updated_at: "desc" } );
      }
    }
    return {
      filters,
      inverse_filters: inverseFilters,
      sort
    };
  }

  static async search( req ) {
    const { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 300 } );
    req.query.page = page;
    req.query.per_page = perPage;
    const searchCriteria = ProjectsController.searchCriteria( req );
    if ( !searchCriteria ) {
      return InaturalistAPI.basicResponse( req );
    }
    searchCriteria._source = Project.returnFields;
    searchCriteria.page = page;
    searchCriteria.per_page = req.query.per_page;
    const response = await ESModel.elasticResults( req, searchCriteria, "projects" );
    return ProjectsController.esResponseToAPIResponse( req, response );
  }

  static async autocomplete( req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 300 } );
    const searchCriteria = ProjectsController.searchCriteria( req, { autocomplete: true } );
    if ( !searchCriteria ) {
      return InaturalistAPI.basicResponse( req );
    }
    const response = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_projects`,
      body: {
        query: {
          function_score: {
            query: {
              bool: {
                filter: searchCriteria.filters,
                must_not: searchCriteria.inverse_filters,
                should: [
                  {
                    constant_score: {
                      filter: {
                        multi_match: {
                          query: ( req.query && req.query.q ) || "",
                          fields: ["*_autocomplete", "description"],
                          type: "phrase"
                        }
                      },
                      boost: 1
                    }
                  }
                ]
              }
            },
            field_value_factor: {
              field: "universal_search_rank",
              factor: 1,
              missing: 3,
              modifier: "log2p"
            },
            boost_mode: "sum"
          }
        },
        _source: Project.returnFields,
        size: req.query.per_page,
        sort: searchCriteria.sort
      }
    } );
    return ProjectsController.esResponseToAPIResponse( req, response );
  }

  static async show( req ) {
    InaturalistAPI.setPerPage( req, { max: 100 } );
    const ids = _.filter( req.params.id.split( "," ), _.identity );
    if ( ids.length > req.query.per_page ) {
      throw util.httpError( 422, "Too many IDs" );
    }
    const numericIDs = _.filter( ids, id => Number( id ) );
    const response = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_projects`,
      body: {
        sort: { id: "desc" },
        query: {
          bool: {
            should: [
              { terms: { id: numericIDs } },
              { terms: { slug: ids } }
            ]
          }
        },
        size: req.query.per_page,
        _source: Project.returnFields
      }
    } );
    return ProjectsController.esResponseToAPIResponse( req, response );
  }

  static async members( req ) {
    InaturalistAPI.setPerPage( req, { default: 30, max: 100 } );
    req.query.page = Number( req.query.page ) || 1;
    if ( req.query.page < 1 ) {
      req.query.page = 1;
    }
    const project = await Project.findByID( req.params.id );
    if ( !project ) {
      // { error: "Unknown project_id", status: 422 }
      throw new Error( 422 );
    }
    const members = await project.members( req.query );
    const total = ( members.length > 0 ) ? await project.membersCount( req.query ) : 0;
    return InaturalistAPI.resultsHash( {
      total,
      per_page: req.query.per_page,
      page: req.query.page,
      results: _.map( members, m => _.omit( m, "total_count" ) )
    } );
  }

  static async membership( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const ids = _.filter( req.params.id.toString( ).split( "," ), _.identity );
    const query = squel.select( )
      .field( "pu.id" )
      .field( "pu.project_id" )
      .field( "pu.role" )
      .field( "pu.created_at" )
      .field( "pu.updated_at" )
      .field( "COALESCE(ccaf.value, 'none')", "prefers_curator_coordinate_access_for" )
      .field( "COALESCE(prup.value, 't')", "prefers_updates" )
      .from( "projects p" )
      .join( "project_users pu", null, "pu.project_id = p.id" )
      .left_join(
        "preferences ccaf",
        null,
        "ccaf.owner_id = pu.id AND ccaf.owner_type = 'ProjectUser' AND ccaf.name = 'curator_coordinate_access_for'"
      )
      .left_join(
        "preferences prup",
        null,
        "prup.owner_id = pu.id AND prup.owner_type = 'ProjectUser' AND prup.name = 'updates'"
      )
      .where( "p.id IN (?)", ids )
      .where( "pu.user_id = ?", req.userSession.user_id );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    _.each( rows, row => {
      row.prefers_updates = ( row.prefers_updates === "f" ) ? false : true;
    } );
    return {
      total_results: rows.length,
      page: 1,
      per_page: rows.length,
      results: rows
    };
  }

  static async join( req ) {
    return InaturalistAPI.iNatJSWrap( projects.join, req );
  }

  static async leave( req ) {
    return InaturalistAPI.iNatJSWrap( projects.leave, req );
  }

  static async add( req ) {
    return InaturalistAPI.iNatJSWrap( projects.add, req );
  }

  static async remove( req ) {
    return InaturalistAPI.iNatJSWrap( projects.remove, req );
  }

  static async create( req ) {
    const r = await InaturalistAPI.iNatJSWrap( projects.create, req );
    const arr = [{ project: r }];
    await Project.preloadInto( arr );
    return arr[0].project;
  }

  static async update( req ) {
    const r = await InaturalistAPI.iNatJSWrap( projects.update, req );
    const arr = [{ project: r }];
    await Project.preloadInto( arr );
    return arr[0].project;
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( projects.delete, req );
  }

  static async subscribe( req ) {
    return InaturalistAPI.iNatJSWrap( projects.subscribe, req );
  }

  static async posts( req ) {
    const { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 30 } );
    const ids = _.filter( req.params.id.split( "," ), _.identity );
    let numericIDs = _.filter( ids, id => Number( id ) );
    if ( _.isEmpty( numericIDs ) ) { numericIDs = [-1]; }
    const query = squel.select( ).field( "posts.*, count(*) OVER() AS total_count" )
      .from( "posts" )
      .join( "projects", null, "posts.parent_id = projects.id AND parent_type='Project'" )
      .where( "projects.id IN (?) OR projects.slug IN (?)", numericIDs, ids )
      .where( "posts.published_at IS NOT NULL" )
      .order( "posts.published_at", false )
      .limit( perPage )
      .offset( perPage * ( page - 1 ) );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const total = _.isEmpty( rows ) ? 0 : Number( rows[0].total_count );
    _.each( rows, r => ( delete r.total_count ) );
    await ESModel.fetchBelongsTo( rows, User );
    return {
      total_results: total,
      page,
      per_page: perPage,
      results: rows
    };
  }

  static async subscriptions( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const query = squel.select( ).field( "s.*" )
      .from( "projects p" )
      .join( "subscriptions s", null, "s.resource_type='Project' AND s.resource_id=p.id" )
      .where( "p.id = ?", req.params.id )
      .where( "s.user_id = ?", req.userSession.user_id );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return {
      total_results: rows.length,
      page: 1,
      per_page: rows.length,
      results: rows
    };
  }

  static async followers( req ) {
    const { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 100 } );
    const ids = _.filter( req.params.id.split( "," ), _.identity );
    let numericIDs = _.filter( ids, id => Number( id ) );
    if ( _.isEmpty( numericIDs ) ) { numericIDs = [-1]; }
    const query = squel.select( ).field( "s.user_id, count(*) OVER() AS total_count" )
      .from( "projects p" )
      .join( "subscriptions s", null, "s.resource_type='Project' AND s.resource_id=p.id" )
      .join( "users u", null, "s.user_id=u.id" )
      .where( "s.resource_type='Project'" )
      .where( "p.id IN (?) OR p.slug IN (?)", numericIDs, ids )
      .order( "u.login" )
      .limit( perPage )
      .offset( perPage * ( page - 1 ) );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const total = _.isEmpty( rows ) ? 0 : Number( rows[0].total_count );
    _.each( rows, r => ( delete r.total_count ) );
    await ESModel.fetchBelongsTo( rows, User, { source: { includes: ["id", "login", "icon"] } } );
    return {
      total_results: total,
      page,
      per_page: perPage,
      results: rows
    };
  }

  static async esResponseToAPIResponse( req, esResponse ) {
    InaturalistAPI.responseLocationToLatLng( esResponse );
    const response = InaturalistAPI.basicResponse( req, esResponse );
    response.results = _.map( response.results, r => new Project( r ) );
    const withUsers = _.filter( _.flattenDeep( [
      response.results,
      _.map( response.results, "admins" ),
      _.map( response.results, "flags" )] ), _.identity );
    await ESModel.fetchBelongsTo( withUsers, User );
    if ( req.query.rule_details && req.query.rule_details !== "false" ) {
      const localeOpts = util.localeOpts( req );
      await Project.preloadForRules( response.results, { localeOpts } );
    }
    return response;
  }

  static async feature( req ) {
    return InaturalistAPI.iNatJSWrap( projects.feature, req );
  }

  static async unfeature( req ) {
    return InaturalistAPI.iNatJSWrap( projects.unfeature, req );
  }
};

module.exports = ProjectsController;
