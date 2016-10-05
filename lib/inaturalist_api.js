"use strict";
var _ = require( "underscore" ),
    jwt = require( "jsonwebtoken" ),
    util = require( "./util" ),
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
      PostsController = require( "./controllers/v1/posts_controller" ),
      UsersController = require( "./controllers/v1/users_controller" );

  // log request times. Doing this outside prepareApp since
  // elasticmaps will log its own requests, if config.debug = true
  app.use( util.timingMiddleware );

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
  app.get( "/", routesV1.docs );
  app.get( "/docs", routesV1.docs );
  app.get( "/swagger.json", routesV1.swaggerRedirect );
  app.get( "/robots.txt", routesV1.robots );

  app.get( "/v1", routesV1.docs );
  app.get( "/v1/swagger.json", routesV1.swaggerJSON );
  app.post( "/v1/observations", ( req, res ) => {
    routesV1.default( ObservationsController.create, req, res );
  });
  app.put( "/v1/observations/:id", ( req, res ) => {
    routesV1.default( ObservationsController.update, req, res );
  });
  app.delete( "/v1/observations/:id", ( req, res ) => {
    routesV1.default( ObservationsController.delete, req, res );
  });
  app.get( "/v1/observations", routesV1.observations_index );
  app.get( "/v1/observations/identifiers", routesV1.observations_identifiers );
  app.get( "/v1/observations/observers", routesV1.observations_observers );
  app.get( "/v1/observations/species_counts", routesV1.species_counts );
  app.get( "/v1/observations/histogram", ( req, res ) => {
    routesV1.default( ObservationsController.histogram, req, res );
  });
  app.get( "/v1/observations/iconic_taxa_counts", ( req, res ) => {
    routesV1.default( ObservationsController.iconicTaxaCounts, req, res );
  });
  app.get( "/v1/observations/iconic_taxa_species_counts", ( req, res ) => {
    routesV1.default( ObservationsController.iconicTaxaSpeciesCounts, req, res );
  });
  app.get( "/v1/observations/updates", ( req, res ) => {
    routesV1.default( ObservationsController.updates, req, res );
  });
  app.get( "/v1/observations/deleted", ( req, res ) => {
    routesV1.default( ObservationsController.deleted, req, res );
  });
  app.get( "/v1/observations/:id", routesV1.observations_show );
  app.post( "/v1/observations/:id/fave", ( req, res ) => {
    routesV1.default( ObservationsController.fave, req, res );
  });
  app.delete( "/v1/observations/:id/unfave", ( req, res ) => {
    routesV1.default( ObservationsController.unfave, req, res );
  });
  app.post( "/v1/observations/:id/review", ( req, res ) => {
    routesV1.default( ObservationsController.review, req, res );
  });
  app.delete( "/v1/observations/:id/review", ( req, res ) => {
    routesV1.default( ObservationsController.unreview, req, res );
  });
  app.post( "/v1/observations/:id/quality/:metric", ( req, res ) => {
    routesV1.default( ObservationsController.setQualityMetric, req, res );
  });
  app.delete( "/v1/observations/:id/quality/:metric", ( req, res ) => {
    routesV1.default( ObservationsController.deleteQualityMetric, req, res );
  });
  app.get( "/v1/taxa/autocomplete", routesV1.taxa_autocomplete );
  app.get( "/v1/taxa/:id", routesV1.taxa_show );
  app.get( "/v1/places/autocomplete", routesV1.places_autocomplete );
  app.get( "/v1/places/nearby", routesV1.places_nearby );
  app.get( "/v1/places/:id", routesV1.places_show );
  app.get( "/v1/projects/autocomplete", routesV1.projects_autocomplete );
  app.get( "/v1/projects/:id", routesV1.projects_show );
  app.get( "/v1/projects/:id/members", routesV1.projects_members );
  app.post( "/v1/projects/:id/join", routesV1.projects_join );
  app.delete( "/v1/projects/:id/leave", routesV1.projects_leave );
  app.post( "/v1/comments", ( req, res ) => {
    routesV1.default( CommentsController.create, req, res );
  });
  app.put( "/v1/comments/:id", ( req, res ) => {
    routesV1.default( CommentsController.update, req, res );
  });
  app.delete( "/v1/comments/:id", ( req, res ) => {
    routesV1.default( CommentsController.delete, req, res );
  });
  // app.get( "/v1/identifications", ( req, res ) => {
  //   routesV1.default( IdentificationsController.search, req, res );
  // });
  app.post( "/v1/identifications", ( req, res ) => {
    routesV1.default( IdentificationsController.create, req, res );
  });
  // app.get( "/v1/identifications/categories", ( req, res ) => {
  //   routesV1.default( IdentificationsController.categories, req, res );
  // });
  // app.get( "/v1/identifications/species_counts", ( req, res ) => {
  //   routesV1.default( IdentificationsController.speciesCounts, req, res );
  // });
  // app.get( "/v1/identifications/identifiers", ( req, res ) => {
  //   routesV1.default( IdentificationsController.identifiers, req, res );
  // });
  // app.get( "/v1/identifications/:id", ( req, res ) => {
  //   routesV1.default( IdentificationsController.show, req, res );
  // });
  app.put( "/v1/identifications/:id", ( req, res ) => {
    routesV1.default( IdentificationsController.update, req, res );
  });
  app.delete( "/v1/identifications/:id", ( req, res ) => {
    routesV1.default( IdentificationsController.delete, req, res );
  });
  app.get( "/v1/observation_fields/autocomplete", ( req, res ) => {
    routesV1.default( ObservationFieldsController.autocomplete, req, res );
  });
  app.post( "/v1/observation_field_values", ( req, res ) => {
    routesV1.default( ObservationFieldValuesController.create, req, res );
  });
  app.put( "/v1/observation_field_values/:id", ( req, res ) => {
    routesV1.default( ObservationFieldValuesController.update, req, res );
  });
  app.delete( "/v1/observation_field_values/:id", ( req, res ) => {
    routesV1.default( ObservationFieldValuesController.delete, req, res );
  });
  app.post( "/v1/photos", ( req, res ) => {
    routesV1.default( PhotosController.create, req, res );
  });
  app.get( "/v1/users/autocomplete", ( req, res ) => {
    routesV1.default( UsersController.autocomplete, req, res );
  });
  app.get( "/v1/users/:id", ( req, res ) => {
    routesV1.default( UsersController.show, req, res );
  });
  app.get( "/v1/posts/for_user", ( req, res ) => {
    routesV1.default( PostsController.for_user, req, res );
  });

  setTimeout( Taxon.loadIconicTaxa, 1000 );

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
  req.query.per_page = Number( req.query.per_page ) || options.default;
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
  if( response && !_.isUndefined( response.hits.hits[0] ) ) {
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
    method( req.query[ paramKey ], function( err, obj ) {
      if( err ) { return callback( err ); }
      if( !obj ) {
        return callback({ error: "Unknown "+ paramKey +" "+ req.query[ paramKey ], status: 422 });
      }
      callback( null, obj );
    });
  } else { callback( ); }
};

InaturalistAPI.iNatJSWrap = function( method, req ) {
  var params = Object.assign( { }, req.body );
  for( var p in req.params ) {
    params[ p ] = req.params[ p ];
  }
  var options = { api_token: req.headers.authorization };
  return method( params, options );
};

module.exports = InaturalistAPI;
