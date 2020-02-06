const _ = require( "lodash" );
const squel = require( "squel" );
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
  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( users.update, req ).then( r => {
      let userID;
      if ( _.isObject( r ) && r.friendship ) {
        userID = r.friendship.user_id;
      }
      userID = userID || r.id || r["0"].id;
      const arr = [{ user_id: userID }];
      ESModel.fetchBelongsTo( arr, User, { }, ( ) => callback( null, arr[0].user ) );
    } ).catch( callback );
  }

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    User.findInES( req.params.id, ( err, user ) => {
      if ( err ) { return void callback( err ); }
      if ( user ) {
        InaturalistAPI.resultsHash( {
          total: 1,
          per_page: req.query.per_page,
          page: req.query.page,
          results: [new User( user )]
        }, callback );
      } else {
        return void callback( { error: "Unknown user", status: 422 } );
      }
    } );
  }

  static me( req, callback ) {
    if ( !req.userSession ) {
      return void callback( { error: "Unauthorized", status: 401 } );
    }
    User.findInES( req.userSession.user_id, ( err, results ) => {
      if ( err ) { return void callback( err ); }
      if ( results ) {
        const userObject = results;
        User.dbAttributesFromLogin( userObject.login ).then( userDBAttrs => {
          Object.assign( userObject, userDBAttrs );
          Site.dbAttributes( [userObject.site_id] ).then( siteDBAttrs => {
            userObject.site = _.isEmpty( siteDBAttrs ) ? null : siteDBAttrs[0];
            InaturalistAPI.resultsHash( {
              total: 1,
              per_page: 1,
              page: 1,
              results: [userObject]
            }, callback );
          } ).catch( callback );
        } ).catch( callback );
      } else {
        return void callback( { error: "Unknown user", status: 422 } );
      }
    } );
  }

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 5, max: 100 } );
    if ( !req.query.q ) {
      return void InaturalistAPI.basicResponse( null, req, null, callback );
    }

    esClient.connection.search( {
      preference: global.config.elasticsearch.preference,
      index: `${process.env.NODE_ENV || global.config.environment}_users`,
      body: {
        query: {
          term: {
            login_exact: req.query.q
          }
        },
        size: req.query.per_page
      }
    }, ( err, exactResponse ) => {
      if ( err ) { return void callback( err ); }
      const shoulds = [
        { match: { name_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { name: { query: req.query.q, operator: "and" } } },
        { match: { login_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { login: { query: req.query.q, operator: "and" } } }
      ];
      esClient.connection.search( {
        preference: global.config.elasticsearch.preference,
        index: `${process.env.NODE_ENV || global.config.environment}_users`,
        body: {
          query: {
            bool: {
              should: shoulds
            }
          },
          sort: { activity_count: "desc" },
          size: req.query.per_page
        }
      }, ( errr, response ) => {
        if ( errr ) { return void callback( errr ); }
        const exactHit = exactResponse.hits.hits[0];
        if ( exactHit ) {
          response.hits.hits = _.filter( response.hits.hits,
            h => h._source.id !== exactHit._source.id );
          response.hits.hits.splice( 0, 0, exactHit );
        }
        InaturalistAPI.resultsHash( {
          total: response.hits.total.value,
          per_page: req.query.per_page,
          page: Number( req.query.page ),
          results: _.map( response.hits.hits, h => new User( h._source ) )
        }, callback );
      } );
    } );
  }

  static updateSession( req, callback ) {
    InaturalistAPI.iNatJSWrap( users.update_session, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static projects( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    User.findInES( req.params.id, ( err, user ) => {
      if ( err ) { return void callback( err ); }
      if ( user ) {
        esClient.connection.search( {
          preference: global.config.elasticsearch.preference,
          index: `${process.env.NODE_ENV || global.config.environment}_projects`,
          body: {
            query: {
              bool: {
                filter: [{ term: { user_ids: user.id } }]
              }
            },
            _source: Project.returnFields,
            from: ( req.query.page - 1 ) * req.query.per_page || 0,
            size: req.query.per_page,
            sort: "title_exact"
          }
        }, ( errr, response ) => {
          if ( errr ) { return void callback( errr ); }
          ProjectsController.esResponseToAPIResponse( req, response, callback );
        } );
      } else {
        return void callback( { error: "Unknown user", status: 422 } );
      }
    } );
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
    return ESModel.elasticResultsAsync( { }, esQuery, "observations", { } );
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
      ESModel.fetchBelongsToAsync( results, Taxon, taxonOpts ),
      ESModel.fetchBelongsToAsync( taxonSubscriptions, Taxon,
        Object.assign( { }, taxonOpts, sharedPreloadOptions ) ),
      ESModel.fetchBelongsToAsync( placeSubscriptions, Place, placeOptions ),
      ESModel.fetchBelongsToAsync( userSubscriptions, User, sharedPreloadOptions )
    ] );
    return Object.assign( response, { results } );
  }
};

module.exports = UsersController;
