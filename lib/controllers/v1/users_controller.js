const _ = require( "lodash" );
const squel = require( "safe-squel" );
const { users } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Place = require( "../../models/place" );
const Project = require( "../../models/project" );
const Site = require( "../../models/site" );
const Taxon = require( "../../models/taxon" );
const User = require( "../../models/user" );
const ProjectsController = require( "./projects_controller" );
const esClient = require( "../../es_client" );
const pgClient = require( "../../pg_client" );
const ESModel = require( "../../models/es_model" );

const UsersController = class UsersController {
  static async update( req ) {
    const r = await InaturalistAPI.iNatJSWrap( users.update, req );
    let userID;
    if ( _.isObject( r ) && r.friendship ) {
      userID = r.friendship.user_id;
    }
    userID = userID || r.id || r["0"].id;
    const arr = [{ user_id: userID }];
    await ESModel.fetchBelongsTo( arr, User );
    return arr[0].user;
  }

  static async show( req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const user = await User.findInES( req.params.id );
    if ( !user ) {
      const e = new Error( );
      e.status = 404;
      e.custom_message = "User does not exist";
      throw e;
    }
    return InaturalistAPI.resultsHash( {
      total: 1,
      per_page: req.query.per_page,
      page: req.query.page,
      results: [new User( user )]
    } );
  }

  static async me( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const user = await User.findInES( req.userSession.user_id );
    if ( !user ) {
      // { error: "Unknown user", status: 422 };
      throw new Error( 422 );
    }
    const userDBAttrs = await User.privateDbAttributesFromLogin( user.login );
    Object.assign( user, userDBAttrs );
    const siteDBAttrs = await Site.dbAttributes( [user.site_id] );
    user.site = _.isEmpty( siteDBAttrs ) ? null : siteDBAttrs[0];
    return InaturalistAPI.resultsHash( {
      total: 1,
      per_page: 1,
      page: 1,
      results: [new User( user )]
    } );
  }

  static async autocomplete( req ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if ( !req.query.q ) {
      return InaturalistAPI.basicResponse( req );
    }
    const filters = [];
    if ( req.query.project_id ) {
      if ( !Number( req.query.project_id ) ) {
        // { error: "Invalid project_id", status: 422 }
        throw new Error( 422 );
      }
      const project = await Project.findByID( req.query.project_id );
      if ( !project ) {
        // { error: "Unknown project_id", status: 422 }
        throw new Error( 422 );
      }
      // Workaround for missing index of project memberships
      // https://github.com/inaturalist/iNaturalistAPI/pull/195#issuecomment-636255431
      req.query.per_page = 1000;
      const members = await project.members( req.query );
      filters.push( esClient.termFilter( "id", _.map( members, m => m.user_id ) ) );
    }
    const exactResponse = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_users`,
      body: {
        query: {
          bool: {
            filter: [{ term: { login_exact: req.query.q } }].concat( filters )
          }
        },
        size: req.query.per_page
      }
    } );
    const shoulds = [
      { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { name: { query: req.query.q, operator: "and" } } },
      { match: { login_autocomplete: { query: req.query.q, operator: "and" } } },
      { match: { login: { query: req.query.q, operator: "and" } } }
    ];
    filters.push( { bool: { should: shoulds } } );
    const response = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_users`,
      body: {
        query: {
          bool: {
            filter: filters
          }
        },
        sort: { activity_count: "desc" },
        size: req.query.per_page
      }
    } );
    const exactHit = exactResponse.hits.hits[0];
    if ( exactHit ) {
      response.hits.hits = _.filter( response.hits.hits,
        h => h._source.id !== exactHit._source.id );
      response.hits.hits.splice( 0, 0, exactHit );
    }
    return InaturalistAPI.resultsHash( {
      total: response.hits.total.value,
      per_page: req.query.per_page,
      page: Number( req.query.page ),
      results: _.map( response.hits.hits, h => new User( h._source ) )
    } );
  }

  static async updateSession( req ) {
    return InaturalistAPI.iNatJSWrap( users.update_session, req );
  }

  static async projects( req ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    const user = await User.findInES( req.params.id );
    if ( !user ) {
      // { error: "Unknown user", status: 422 };
      throw new Error( 422 );
    }
    const filters = [{ term: { user_ids: user.id } }];
    const inverseFilters = [];
    if (
      req.query.project_type
      && _.includes( ["traditional", "collection", "umbrella"], req.query.project_type )
    ) {
      if ( req.query.project_type === "traditional" ) {
        inverseFilters.push(
          esClient.termFilter( "project_type", ["collection", "umbrella"] )
        );
      } else {
        filters.push( esClient.termFilter( "project_type", req.query.project_type ) );
      }
    }

    const response = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_projects`,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: filters,
                must_not: inverseFilters
              }
            }
          }
        },
        _source: Project.returnFields,
        from: ( req.query.page - 1 ) * req.query.per_page || 0,
        size: req.query.per_page,
        sort: "title_exact"
      }
    } );
    return ProjectsController.esResponseToAPIResponse( req, response );
  }

  static async followees( req ) {
    if ( !req.userSession ) { throw new Error( 401 ); }
    const queryReq = _.pick( req, ["params", "query", "inat"] );
    queryReq.query.resource_type = "user";
    const response = await UsersController.rawSubscriptions( queryReq );
    const preloadedResponse = UsersController.preloadSubscriptionResources( req, response );
    _.each( preloadedResponse.results, r => delete r.taxon_id );
    return preloadedResponse;
  }

  static async mute( req ) {
    return InaturalistAPI.iNatJSWrap( users.mute, req );
  }

  static async unmute( req ) {
    return InaturalistAPI.iNatJSWrap( users.unmute, req );
  }

  static async block( req ) {
    return InaturalistAPI.iNatJSWrap( users.block, req );
  }

  static async unblock( req ) {
    return InaturalistAPI.iNatJSWrap( users.unblock, req );
  }

  static async placeAndTaxonSubscriptions( req ) {
    if ( !req.userSession ) { throw new Error( 401 ); }
    const response = await UsersController.rawSubscriptions( req );
    const preloadedResponse = await UsersController.preloadSubscriptionResources( req, response );
    return preloadedResponse;
  }

  static async placeAndTaxonSubscriptions2( req ) {
    if ( !req.userSession ) { throw new Error( 401 ); }
    const queryReq = _.pick( req, ["params", "query", "inat"] );
    queryReq.query.resource_type = "user";
    queryReq.inat.allResults = true;
    const response = await UsersController.rawSubscriptions( queryReq );
    const aggs = {
      subscriptions: {
        aggs: {
          recent: {
            max: { field: "created_at" }
          },
          top: {
            top_hits: {
              size: 5
            }
          }
        },
        filters: {
          filters: { }
        }
      }
    };
    _.each( response.results, r => {
      const subscriptionFilters = [];
      if ( r.resource_type === "Place" ) {
        subscriptionFilters.push( { term: { place_ids: r.resource_id } } );
        if ( r.taxon_id ) {
          subscriptionFilters.push( { term: { "taxon.ancestor_ids": r.taxon_id } } );
        }
      } else if ( r.resource_type === "Taxon" ) {
        subscriptionFilters.push( { term: { "taxon.ancestor_ids": r.resource_id } } );
      }
      aggs.subscriptions.filters.filters[`subscription_${r.id}`] = {
        bool: {
          must: subscriptionFilters
        }
      };
    } );
    const esQuery = { size: 0, aggs };
    return ESModel.elasticResults( { }, esQuery, "observations", { } );
  }

  static async rawSubscriptions( req ) {
    let { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 200 } );
    if ( req.inat.allResults ) {
      page = 1;
      perPage = 3000;
    }
    const sortOrder = ( req.query.order || "asc" ).toLowerCase( );
    let sort;
    switch ( req.query.order_by ) {
      case "created_at":
        sort = "s.created_at";
        break;
      case "updated_at":
        sort = "s.updated_at";
        break;
      default:
        sort = "s.updated_at";
    }
    const query = squel.select( ).field( "s.*, count(*) OVER() AS total_count" )
      .from( "subscriptions s" )
      .where( "lower(s.resource_type) IN ?", req.query.resource_type
        ? _.map( req.query.resource_type.split( "," ), r => _.toLower( r ) )
        : ["place", "taxon"] )
      .where( "s.user_id = ?", req.params.id )
      .order( sort, sortOrder !== "desc" )
      .limit( perPage )
      .offset( ( page - 1 ) * perPage );
    const result = await pgClient.connection.query( query.toString( ) );
    const results = result.rows;
    const total = _.isEmpty( results ) ? 0 : Number( results[0].total_count );
    _.each( results, r => {
      delete r.total_count;
    } );
    return {
      total_results: total,
      page,
      per_page: results.length,
      results
    };
  }

  static async preloadSubscriptionResources( req, response ) {
    const { results } = response;
    const taxonOpts = Taxon.esQueryOptions( req );
    const sharedPreloadOptions = {
      foreignKey: "resource_id",
      attrName: "resource"
    };
    const placeOptions = Object.assign( { }, sharedPreloadOptions, {
      source: {
        excludes: ["geometry_geojson", "bounding_box_geojson"]
      }
    } );
    const placeSubscriptions = _.filter( results, r => r.resource_type === "Place" );
    const taxonSubscriptions = _.filter( results, r => r.resource_type === "Taxon" );
    const userSubscriptions = _.filter( results, r => r.resource_type === "User" );

    // using Promise.all so these all run in parallel
    await Promise.all( [
      ESModel.fetchBelongsTo( results, Taxon, taxonOpts ),
      ESModel.fetchBelongsTo( taxonSubscriptions, Taxon,
        Object.assign( { }, taxonOpts, sharedPreloadOptions ) ),
      ESModel.fetchBelongsTo( placeSubscriptions, Place, placeOptions ),
      ESModel.fetchBelongsTo( userSubscriptions, User, sharedPreloadOptions )
    ] );
    return Object.assign( response, { results } );
  }

  static async notificationCounts( req ) {
    if ( !req.userSession ) { throw new Error( 401 ); }
    const inverseFilters = [
      esClient.termFilter( "viewed_subscriber_ids", req.userSession.user_id )
    ];
    if ( req.query.except_model_id && req.query.except_model_id.match( /^[a-z]+:[0-9]+$/i ) ) {
      const exceptModel = req.query.except_model_id.split( ":" );
      inverseFilters.push( {
        bool: {
          filter: [
            esClient.termFilter( "resource_type", exceptModel[0] ),
            esClient.termFilter( "resource_id", exceptModel[1] )
          ]
        }
      } );
    }
    const response = await esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_update_actions`,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  { term: { "subscriber_ids.keyword": req.userSession.user_id } },
                  { terms: { notification: ["activity", "mention"] } }
                ],
                must_not: inverseFilters
              }
            }
          }
        },
        size: 0
      }
    } );
    const updatesCount = response.hits.total.value;

    const query = squel.select( ).field( "count(*) as count" )
      .from( "messages" )
      .where( "user_id = ?", req.userSession.user_id )
      .where( "user_id = to_user_id" )
      .where( "read_at IS NULL" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    const messagesCount = Number( rows[0].count );
    return {
      updates_count: updatesCount,
      messages_count: messagesCount
    };
  }
};

module.exports = UsersController;
