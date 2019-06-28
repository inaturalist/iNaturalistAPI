const _ = require( "lodash" );
const { users } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Project = require( "../../models/project" );
const Site = require( "../../models/site" );
const User = require( "../../models/user" );
const ProjectsController = require( "./projects_controller" );
const esClient = require( "../../es_client" );
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
          total: response.hits.total,
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
};

module.exports = UsersController;
