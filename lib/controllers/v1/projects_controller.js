const _ = require( "lodash" );
const squel = require( "squel" );
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
      }
    }
    return {
      filters,
      inverseFilters,
      sort
    };
  }

  static search( req, callback ) {
    const { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 300 } );
    req.query.page = page;
    req.query.per_page = perPage;
    const searchCriteria = ProjectsController.searchCriteria( req );
    if ( !searchCriteria ) {
      return void InaturalistAPI.basicResponse( null, req, null, callback );
    }
    searchCriteria._source = Project.returnFields;
    searchCriteria.page = page;
    searchCriteria.size = req.query.per_page;
    ESModel.elasticResults( req, searchCriteria, "projects", { }, ( err, response ) => {
      if ( err ) { return void callback( err ); }
      ProjectsController.esResponseToAPIResponse( req, response, callback );
    } );
  }

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 300 } );
    const searchCriteria = ProjectsController.searchCriteria( req, { autocomplete: true } );
    if ( !searchCriteria ) {
      return void InaturalistAPI.basicResponse( null, req, null, callback );
    }
    esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_projects`,
      body: {
        query: {
          bool: {
            filter: searchCriteria.filters,
            must_not: searchCriteria.inverseFilters
          }
        },
        _source: Project.returnFields,
        size: req.query.per_page,
        sort: searchCriteria.sort
      }
    }, ( err, response ) => {
      if ( err ) { return void callback( err ); }
      ProjectsController.esResponseToAPIResponse( req, response, callback );
    } );
  }

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const ids = _.filter( req.params.id.split( "," ), _.identity );
    if ( ids.length > req.query.per_page ) {
      return void callback( { error: "Too many IDs", status: 422 } );
    }
    const numericIDs = _.filter( ids, id => Number( id ) );
    esClient.connection.search( {
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
    }, ( err, esResponse ) => {
      if ( err ) { return void callback( err ); }
      ProjectsController.esResponseToAPIResponse( req, esResponse, callback );
    } );
  }

  static members( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 30, max: 100 } );
    req.query.page = Number( req.query.page ) || 1;
    if ( req.query.page < 1 ) {
      req.query.page = 1;
    }
    Project.findByID( req.params.id ).then( obj => {
      if ( obj ) {
        obj.members( req.query, ( errr, members ) => {
          if ( errr ) { return void callback( errr ); }
          const total = ( members.length > 0 ) ? Number( members[0].total_count ) : 0;
          InaturalistAPI.resultsHash( {
            total,
            per_page: req.query.per_page,
            page: req.query.page,
            results: _.map( members, m => _.omit( m, "total_count" ) )
          }, callback );
        } );
      } else {
        return void callback( { error: "Unknown project_id", status: 422 } );
      }
    } ).catch( callback );
  }

  static join( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.join, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static leave( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.leave, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static add( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.add, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static remove( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.remove, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.create, req ).then( r => {
      const arr = [{ project: r }];
      Project.preloadInto( arr, null, ( ) => callback( null, arr[0].project ) );
    } ).catch( e => {
      callback( e );
    } );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.update, req ).then( r => {
      const arr = [{ project: r }];
      Project.preloadInto( arr, null, err => {
        if ( err ) { return void callback( err ); }
        return void callback( null, arr[0].project );
      } );
    } ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static subscribe( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.subscribe, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static posts( req, callback ) {
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
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const results = result.rows;
      const total = _.isEmpty( results ) ? 0 : Number( results[0].total_count );
      _.each( results, r => ( delete r.total_count ) );
      ESModel.fetchBelongsTo( results, User, { }, () => {
        callback( null, {
          total_results: total,
          page,
          per_page: perPage,
          results
        } );
      } );
    } );
  }

  static subscriptions( req, callback ) {
    if ( !req.userSession ) {
      return void callback( { error: "Unauthorized", status: 401 } );
    }
    const query = squel.select( ).field( "s.*" )
      .from( "projects p" )
      .join( "subscriptions s", null, "s.resource_type='Project' AND s.resource_id=p.id" )
      .where( "p.id = ?", req.params.id )
      .where( "s.user_id = ?", req.userSession.user_id );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const results = result.rows;
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results
      } );
    } );
  }

  static followers( req, callback ) {
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
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const results = result.rows;
      const total = _.isEmpty( results ) ? 0 : Number( results[0].total_count );
      _.each( results, r => ( delete r.total_count ) );
      ESModel.fetchBelongsTo( results, User, { source: { includes: ["id", "login", "icon"] } },
        ( ) => {
          callback( null, {
            total_results: total,
            page,
            per_page: perPage,
            results
          } );
        } );
    } );
  }

  static esResponseToAPIResponse( req, esResponse, callback ) {
    InaturalistAPI.responseLocationToLatLng( esResponse );
    InaturalistAPI.basicResponse( null, req, esResponse, ( err, response ) => {
      if ( err ) { return void callback( err ); }
      response.results = _.map( response.results, r => new Project( r ) );
      const withUsers = _.filter( _.flattenDeep( [
        response.results,
        _.map( response.results, "admins" ),
        _.map( response.results, "flags" )] ), _.identity );
      ESModel.fetchBelongsTo( withUsers, User, { }, errr => {
        if ( errr ) { return void callback( errr ); }
        if ( req.query.rule_details && req.query.rule_details !== "false" ) {
          const localeOpts = util.localeOpts( req );
          Project.preloadForRules( response.results, { localeOpts } )
            .then( ( ) => callback( null, response ) )
            .catch( errrr => callback( errrr ) );
        } else {
          callback( null, response );
        }
      } );
    } );
  }

  static feature( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.feature, req )
      .then( ( ) => callback( null, true ) ).catch( callback );
  }

  static unfeature( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.unfeature, req )
      .then( ( ) => callback( null, true ) ).catch( callback );
  }
};

module.exports = ProjectsController;
