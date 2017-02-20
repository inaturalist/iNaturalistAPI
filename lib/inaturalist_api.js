"use strict";
var _ = require( "underscore" ),
    jwt = require( "jsonwebtoken" ),
    util = require( "./util" ),
    InaturalistMapStyles = require( "./inaturalist_map_styles" ),
    User = require( "./models/user" ),
    Taxon = require( "./models/taxon" ),
    Place = require( "./models/place" ),
    Project = require( "./models/project" ),
    List = require( "./models/list" ),
    config = require( "../config" ),
    InaturalistAPI = { };

InaturalistAPI.prepareApp = function( a ) {
  var express = require( "express" ),
      bodyParser = require( "body-parser" ),
      compression = require( "compression" );
  a.use( compression( ) );
  a.use( bodyParser.json( ) );
  a.use( util.accessControlHeaders );
  a.use( express.static( "public" ) );
  // lookup, and temporarily cache, a few instances
  a.use( InaturalistAPI.lookupTaxonMiddleware );
  a.use( InaturalistAPI.lookupPlaceMiddleware );
  a.use( InaturalistAPI.lookupPreferredPlaceMiddleware );
  a.use( InaturalistAPI.lookupProjectMiddleware );
  a.use( InaturalistAPI.lookupProjectRulesMiddleware );
  a.use( InaturalistAPI.lookupUnobservedByUserMiddleware );
  a.use( InaturalistAPI.lookupProjectsMiddleware );
  a.use( InaturalistAPI.lookupNotMatchingProjectMiddleware );
  a.use( InaturalistAPI.lookupNotInProjectMiddleware );
  a.use( InaturalistAPI.lookupUserMiddleware );
  a.use( InaturalistAPI.lookupListMiddleware );
  a.use( InaturalistAPI.validateSession );
};

InaturalistAPI.validateSession = function( req, res, next ) {
  if ( req.headers.authorization ) {
    jwt.verify( req.headers.authorization, config.jwtSecret || "secret",
                { algorithms: ["HS512"] }, ( err, payload ) => {
      if ( !err ) {
        req.userSession = payload;
      }
      next( );
    } );
  } else {
    next( );
  }
};

InaturalistAPI.server = function( ) {
  var ElasticMapper = require( "elasticmaps" ),
      InaturalistMapserver = require( "./inaturalist_map_server" );
  var app = ElasticMapper.server( _.extend( { }, config, {
    prepareApp: InaturalistAPI.prepareApp,
    prepareQuery: InaturalistMapserver.prepareQuery,
    prepareStyle: InaturalistMapserver.prepareStyle,
    beforeSendResult: InaturalistMapserver.beforeSendResult
  }));
  var CommentsController = require( "./controllers/v1/comments_controller" ),
      IdentificationsController = require( "./controllers/v1/identifications_controller" ),
      ObservationFieldsController = require( "./controllers/v1/observation_fields_controller" ),
      ObservationFieldValuesController = require( "./controllers/v1/observation_field_values_controller" ),
      ObservationsController = require( "./controllers/v1/observations_controller" ),
      PhotosController = require( "./controllers/v1/photos_controller" ),
      PlacesController = require( "./controllers/v1/places_controller" ),
      PostsController = require( "./controllers/v1/posts_controller" ),
      UsersController = require( "./controllers/v1/users_controller" );

  // log request times. Doing this outside prepareApp since
  // elasticmaps will log its own requests, if config.debug = true
  app.use( util.timingMiddleware );

  // OPTIONS requests just need to respond with 200; headers are already set
  app.options( "/*", ( req, res ) => {
    res.setHeader( "Cache-Control", "public, max-age=3600" );
    res.send( 200 );
  });

  // map tile routes
  app.get( "/v1/:style/:zoom/:x/:y.:format([a-z\.]+)", ElasticMapper.route )
  app.get( "/v1/places/:place_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.placesRoute );
  app.get( "/v1/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.taxonPlacesRoute );
  app.get( "/v1/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.taxonRangesRoute );

  app.get( "/v1/:style/:zoom/:x/:y.:format([a-z\.]+)", ElasticMapper.route )

  // JSON API routes
  var routesV1 = require( "./routes_v1" );
  var dfault = ( action, path, method ) => {
    app[action]( path, ( req, res ) => {
      routesV1.default( method, req, res );
    });
  };

  app.get( "/", routesV1.docs );
  app.get( "/docs", routesV1.docs );
  app.get( "/swagger.json", routesV1.swaggerRedirect );
  app.get( "/robots.txt", routesV1.robots );

  app.get( "/v1", routesV1.docs );
  app.get( "/v1/swagger.json", routesV1.swaggerJSON );
  app.get( "/v1/ping", ( req, res ) => {
    res.setHeader( "Cache-Control",
      "private, no-cache, no-store, must-revalidate" );
    res.setHeader( "Expires", "-1" );
    res.setHeader( "Pragma", "no-cache" );
    res.jsonp( { status: "available" } );
  });
  dfault( "post", "/v1/observations", ObservationsController.create );
  dfault( "put", "/v1/observations/:id", ObservationsController.update );
  dfault( "delete", "/v1/observations/:id", ObservationsController.delete );
  app.get( "/v1/observations", routesV1.observations_index );
  app.get( "/v1/observations/identifiers", routesV1.observations_identifiers );
  app.get( "/v1/observations/observers", routesV1.observations_observers );
  app.get( "/v1/observations/species_counts", routesV1.species_counts );
  dfault( "get", "/v1/observations/popular_field_values", ObservationsController.popularFieldValues );
  dfault( "get", "/v1/observations/histogram", ObservationsController.histogram );
  dfault( "get", "/v1/observations/iconic_taxa_counts", ObservationsController.iconicTaxaCounts );
  dfault( "get", "/v1/observations/iconic_taxa_species_counts", ObservationsController.iconicTaxaSpeciesCounts );
  dfault( "get", "/v1/observations/updates", ObservationsController.updates );
  dfault( "get", "/v1/observations/deleted", ObservationsController.deleted );
  app.get( "/v1/observations/:id", routesV1.observations_show );
  dfault( "post", "/v1/observations/:id/fave", ObservationsController.fave );
  dfault( "delete", "/v1/observations/:id/unfave", ObservationsController.unfave );
  dfault( "post", "/v1/observations/:id/review", ObservationsController.review );
  dfault( "delete", "/v1/observations/:id/review", ObservationsController.unreview );
  dfault( "post", "/v1/observations/:id/quality/:metric", ObservationsController.setQualityMetric );
  dfault( "delete", "/v1/observations/:id/quality/:metric", ObservationsController.deleteQualityMetric );
  app.get( "/v1/taxa/autocomplete", routesV1.taxa_autocomplete );
  app.get( "/v1/taxa/:id", routesV1.taxa_show );
  dfault( "get", "/v1/places/containing", PlacesController.containing );
  app.get( "/v1/places/autocomplete", routesV1.places_autocomplete );
  app.get( "/v1/places/nearby", routesV1.places_nearby );
  app.get( "/v1/places/:id", routesV1.places_show );
  app.get( "/v1/projects/autocomplete", routesV1.projects_autocomplete );
  app.get( "/v1/projects/:id", routesV1.projects_show );
  app.get( "/v1/projects/:id/members", routesV1.projects_members );
  app.post( "/v1/projects/:id/join", routesV1.projects_join );
  app.delete( "/v1/projects/:id/leave", routesV1.projects_leave );
  dfault( "post", "/v1/comments", CommentsController.create );
  dfault( "put", "/v1/comments/:id", CommentsController.update );
  dfault( "delete", "/v1/comments/:id", CommentsController.delete );
  dfault( "get", "/v1/identifications", IdentificationsController.search );
  dfault( "post", "/v1/identifications", IdentificationsController.create );
  dfault( "get", "/v1/identifications/categories", IdentificationsController.categories );
  dfault( "get", "/v1/identifications/species_counts", IdentificationsController.speciesCounts );
  dfault( "get", "/v1/identifications/identifiers", IdentificationsController.identifiers );
  dfault( "get", "/v1/identifications/observers", IdentificationsController.observers );
  dfault( "get", "/v1/identifications/recent_taxa", IdentificationsController.recentTaxa );
  dfault( "get", "/v1/identifications/similar_species", IdentificationsController.similarSpecies );
  dfault( "get", "/v1/identifications/:id", IdentificationsController.show );
  dfault( "put", "/v1/identifications/:id", IdentificationsController.update );
  dfault( "delete", "/v1/identifications/:id", IdentificationsController.delete );
  dfault( "get", "/v1/observation_fields/autocomplete", ObservationFieldsController.autocomplete );
  dfault( "post", "/v1/observation_field_values", ObservationFieldValuesController.create );
  dfault( "put", "/v1/observation_field_values/:id", ObservationFieldValuesController.update );
  dfault( "delete", "/v1/observation_field_values/:id", ObservationFieldValuesController.delete );
  dfault( "post", "/v1/photos", PhotosController.create );
  dfault( "get", "/v1/users/autocomplete", UsersController.autocomplete );
  dfault( "get", "/v1/users/me", UsersController.me );
  dfault( "get", "/v1/users/:id", UsersController.show );
  dfault( "get", "/v1/posts/for_user", PostsController.for_user );

  setTimeout( ( ) => {
    Taxon.loadIconicTaxa( ( ) => {
      InaturalistMapStyles.markersAndCircles( null, { resetCache: true } );
    } );
  }, 1000 );

  return app;
};

InaturalistAPI.defaultMapFields = function( ) {
  return [ "id", "location", "taxon.iconic_taxon_id", "captive",
    "quality_grade", "geoprivacy", "private_location" ];
};

InaturalistAPI.validateIDParam = function( req ) {
  if( !req.params.id ) {
    return { messsage: "ID missing", status: 422 };
  }
};

InaturalistAPI.validateMultiIDParam = function( req ) {
  if( !req.params.id ) {
    return { messsage: "ID missing", status: 422 };
  }
  if( !req.params.id.match(/^[0-9,]*[0-9]$/) ) {
    return { messsage: "invalid ID", status: 422 };
  }
};

InaturalistAPI.setPerPage = function( req, options ) {
  options = options || { };
  options.default = options.default || 30;
  options.max = options.max || 100;
  req.query.per_page = Number( req.query.per_page );
  if ( req.query.per_page === 0 ) { return; }
  req.query.per_page = req.query.per_page || options.default;
  if( req.query.per_page < 1 || req.query.per_page > options.max ) {
    req.query.per_page = options.default;
  }
};

InaturalistAPI.setDefaultParamValue = function( param, dfault, options ) {
  options = options || { };
  if( !dfault ) { return param; }
  param = param || dfault;
  if( options.enum ) {
    if( !_.contains( options.enum, param) ) {
      param = dfault;
    }
  }
  return param;
};

InaturalistAPI.responseLocationToLatLng = function( response ) {
  if( response && response.hits && !_.isUndefined( response.hits.hits[0] ) ) {
    _.each( response.hits.hits, function( hit ) {
      var r = hit._source;
      if( r.location && r.location.match( /-?([0-9]*[.])?[0-9]+,-?([0-9]*[.])?[0-9]+/ ) &&
          !r.latitude && !r.longitude ) {
        var parts = r.location.split(",");
        r.latitude = parts[0];
        r.longitude = parts[1];
        delete r.location;
      }
    });
  }
};

InaturalistAPI.basicResponse = function( err, req, response, callback ) {
  if( err ) { return callback( err ); }
  var empty = ( !response || _.isUndefined( response.hits.hits[0] ) );
  var results = empty ? [ ] :
    _.map( response.hits.hits, function( h ) { return h._source; });
  callback( null, {
    total_results: empty ? 0 : response.hits.total,
    page: req.query.page || 1,
    per_page: empty ? 0 : Math.min( response.hits.total, req.query.per_page ),
    results: results
  });
};

InaturalistAPI.resultsHash = function( options, callback ) {
  options = options || { };
  callback( null, {
    total_results: options.total || 0,
    page: options.page || 1,
    per_page: !options.total ? 0 : Math.min( options.total, options.per_page ),
    results: options.results
  });
};

InaturalistAPI.lookupTaxonMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "taxon_id", Taxon.findByID, "taxon" );
};

InaturalistAPI.lookupPlaceMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "place_id", Place.findByID, "place" );
};

InaturalistAPI.lookupPreferredPlaceMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "preferred_place_id", Place.findByID, "preferredPlace" );
};

InaturalistAPI.lookupUnobservedByUserMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "unobserved_by_user_id", User.findByLoginOrID, "unobservedByUser" );
};

InaturalistAPI.lookupProjectMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "project_id", Project.findByID, "project" );
};

InaturalistAPI.lookupProjectRulesMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "apply_project_rules_for", Project.findByID,
    "apply_project_rules_for" );
};

InaturalistAPI.lookupNotMatchingProjectMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "not_matching_project_rules_for", Project.findByID,
    "not_matching_project_rules_for" );
};

InaturalistAPI.lookupNotInProjectMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "not_in_project", Project.findByID );
};

InaturalistAPI.lookupListMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "list_id", List.findByID, "list" );
};

InaturalistAPI.lookupUserMiddleware = function( req, res, next ) {
  if( !req.query.user_id ) { return next( ); }
  var asInt = Number( req.query.user_id );
  // if user_id is an integer then skip the search by login
  if( asInt && asInt.toString( ).length === req.query.user_id.length ) { return next( ); }
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "user_id", User.findByLogin, "user" );
};

InaturalistAPI.lookupProjectsMiddleware = function( req, res, next ) {
  if( !req.query.projects ) { return next( ); }
  req.inat = req.inat || { };
  req.inat.projects = [ ];
  req.query.project_ids = [ ];
  var projects = _.flatten([ req.query.projects ]);
  var resultCount = 0;
  _.each( projects, function( p ) {
    Project.findByID( p, function( err, obj ) {
      if( err ) { return util.renderError( err, res ); }
      if( obj ) {
        req.inat.projects.push( obj );
        req.query.project_ids.push( obj.id );
      }
      resultCount += 1;
      if( resultCount == projects.length ) { return next( ); }
    });
  });
};

// if the record does not exist, raise an error
InaturalistAPI.lookupInstanceMiddleware = function( req, res, callback, paramKey, method, objectKey ) {
  req.inat = req.inat || { };
  InaturalistAPI.lookupInstance( req, paramKey, method, function( err, obj ) {
    if( err ) { return util.renderError( err, res ); }
    if( obj ) {
      if( objectKey ) { req.inat[ objectKey ] = obj; }
      req.query[ paramKey ] = obj.id;
    }
    callback( );
  });
};

// if we have the param specified, try to look up the instance
InaturalistAPI.lookupInstance = function( req, paramKey, method, callback ) {
  if( req.query[ paramKey ] ) {
    // the value could be a comma-delimited list of IDs
    var ids = util.paramArray( req.query[ paramKey ] );
    if( ids.length !== 1 ) { return callback( ); }
    if( ids[0] === "any" ) { return callback( ); }
    // lookup the instance in Elasticsearch by ID
    method( ids[0], function( err, obj ) {
      if( err ) { return callback( err ); }
      if( !obj ) {
        return callback({ error: "Unknown "+ paramKey +" "+ req.query[ paramKey ], status: 422 });
      }
      callback( null, obj );
    });
  } else { callback( ); }
};

InaturalistAPI.iNatJSWrap = function( method, req ) {
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  var params = Object.assign( { }, req.body );
  for( var p in req.params ) {
    params[ p ] = req.params[ p ];
  }
  var options = {
    api_token: req.headers.authorization,
    user_agent: req.headers["user-agent"],
    remote_ip: req.headers["x-forwarded-for"]
  };
  if( !options.remote_ip && req.connection && req.connection.remoteAddress ) {
    options.remote_ip = req.connection.remoteAddress;
  }
  return method( params, options );
};

module.exports = InaturalistAPI;
