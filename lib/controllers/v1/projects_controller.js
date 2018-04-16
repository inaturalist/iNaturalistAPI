"use strict";
var _ = require( "lodash" ),
    squel = require( "squel" ),
    projects = require( "inaturalistjs" ).projects,
    esClient = require( "../../es_client" ),
    pgClient = require( "../../pg_client" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    ESModel = require( "../../models/es_model" ),
    Project = require( "../../models/project" ),
    User = require( "../../models/user" );

var ProjectsController = class ProjectsController {

  static autocomplete( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 300 } );
    var filters = [ ];
    var inverseFilters = [ ];
    var sort;
    if( !req.query.q ) {
      if( req.query.member_id ) {
        sort = { title_exact: "asc" };
      } else if ( req.query.title_exact ) {
        filters.push( { term: { title_exact: req.query.title_exact } } );
      } else {
        return InaturalistAPI.basicResponse( null, req, null, callback );
      }
    } else {
      filters.push( { bool: { should: [
        { term: { slug: req.query.q } },
        { match: { title_autocomplete: { query: req.query.q, operator: "and" } } },
        { match: { title: { query: req.query.q, operator: "and" } } }
      ] } } );
    }
    if( req.query.type ) {
      filters.push( esClient.termFilter( "project_type", req.query.type ) );
    }
    if( req.query.member_id ) {
      filters.push( { term: { user_ids: req.query.member_id } } );
    }
    if( req.query.not_id ) {
      inverseFilters.push( {
        terms: { id: util.paramArray( req.query.not_id ) }
      });
    }
    if( req.query.not_type ) {
      inverseFilters.push( esClient.termFilter( "project_type", req.query.not_type ) );
    }
    if( req.query.has_params ) {
      filters.push( { exists: { field: "search_parameter_fields" } } );
    }
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
      body: {
        query: {
          bool: {
            filter: filters,
            must_not: inverseFilters
          }
        },
        _source: Project.returnFields,
        size: req.query.per_page,
        sort: sort
      }
    }, function( err, response ) {
      InaturalistAPI.responseLocationToLatLng( response );
      InaturalistAPI.basicResponse( err, req, response, callback );
    });
  }

  static show( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
    var ids = _.filter( req.params.id.split(","), _.identity );
    if( ids.length > req.query.per_page ) {
      return callback({ error: "Too many IDs", status: 422 });
    }
    var numericIDs = _.filter( ids, id => Number( id ) );
    esClient.connection.search({
      preference: global.config.elasticsearch.preference,
      index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
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
    }, function( err, esResponse ) {
      InaturalistAPI.responseLocationToLatLng( esResponse );
      InaturalistAPI.basicResponse( err, req, esResponse, ( err, response ) => {
        if( err ) { return callback( err ); }
        response.results = _.map( response.results, r => new Project( r ) );
        if ( req.query.rule_details ) {
          var localeOpts = util.localeOpts( req );
          Project.preloadForRules( response.results, { localeOpts }, err => {
            if( err ) { return callback( err ); }
            callback( null, response );
          });
        } else {
          callback( null, response );
        }
      });
    });
  }

  static members( req, callback ) {
    InaturalistAPI.setPerPage( req, { default: 30, max: 100 } );
    req.query.page = Number( req.query.page ) || 1;
    if( req.query.page < 1 ) {
      req.query.page = 1;
    }
    Project.findByID( req.params.id, function( err, obj ) {
      if( err ) { return callback( err ); }
      if( obj ) {
        obj.members( req.query, function( err, members ) {
          if( err ) { return callback( err ); }
          var total = ( members.length > 0 ) ? Number( members[ 0 ].total_count ) : 0;
          InaturalistAPI.resultsHash({
            total: total,
            per_page: req.query.per_page,
            page: req.query.page,
            results: _.map( members, function( m ) {
              return _.omit( m, "total_count" );
            })
          }, callback )
        })
      } else {
        return callback({ error: "Unknown project_id", status: 422 });
      }
    });
  }

  static join( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.join, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static leave( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.leave, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static add( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.add, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static remove( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.remove, req ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.create, req ).then( function( r ) {
      var arr = [ { project: r } ];
      Project.preloadInto( arr, null, function( ) {
        return callback( null, arr[0].project );
      });
    }).catch( e => {
      callback( e );
    } );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.update, req ).then( function( r ) {
      var arr = [ { project: r } ];
      Project.preloadInto( arr, null, err => {
        if ( err ) { return callback( err ); }
        return callback( null, arr[0].project );
      });
    }).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.delete, req  ).then( function( r ) {
      return callback( null, r );
    }).catch( callback );
  }

  static subscribe( req, callback ) {
    InaturalistAPI.iNatJSWrap( projects.subscribe, req  ).then( function( ) {
      callback( null, true );
    }).catch( callback );
  }

  static posts( req, callback ) {
    let { page, perPage } = InaturalistAPI.paginationData( req, { default: 10, max: 30 } );
    var ids = _.filter( req.params.id.split( "," ), _.identity );
    var numericIDs = _.filter( ids, id => Number( id ) );
    if ( _.isEmpty( numericIDs ) ) { numericIDs = [ -1 ] }
    var query = squel.select( ).field( "posts.*, count(*) OVER() AS total_count" ).
      from( "posts" ).
      join( "projects", null, "posts.parent_id = projects.id AND parent_type='Project'" ).
      where( "projects.id IN (?) OR projects.slug IN (?)", numericIDs, ids ).
      where( "posts.published_at IS NOT NULL ").
      order( "posts.published_at", false ).
      limit( perPage ).
      offset( perPage * ( page - 1 ) );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      var results = result.rows;
      const total = _.isEmpty( results ) ? 0 : Number( results[0].total_count );
      _.each( results, r => ( delete r.total_count ) );
      ESModel.fetchBelongsTo( results, User, { }, () => {
        callback( null, {
          total_results: total,
          page: page,
          per_page: perPage,
          results: results
        });
      });
    });
  }

  static subscriptions( req, callback ) {
    if( !req.userSession ) {
      return callback({ error: "Unauthorized", status: 401 });
    }
    var query = squel.select( ).field( "s.*" ).
      from( "projects p" ).
      join( "subscriptions s", null, "s.resource_type='Project' AND s.resource_id=p.id" ).
      where( "p.id = ?", req.params.id ).
      where( "s.user_id = ?", req.userSession.user_id);
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if( err ) { return callback( err ); }
      var results = result.rows;
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results: results
      });
    });
  }

};

module.exports = ProjectsController;
