"use strict";
var _ = require( "lodash" ),
    jwt = require( "jsonwebtoken" ),
    fs = require( "fs" ),
    multer  = require( "multer" ),
    crypto  = require( "crypto" ),
    util = require( "./util" ),
    InaturalistMapStyles = require( "./inaturalist_map_styles" ),
    User = require( "./models/user" ),
    Taxon = require( "./models/taxon" ),
    Place = require( "./models/place" ),
    Project = require( "./models/project" ),
    List = require( "./models/list" ),
    config = require( "../config" ),
    routesV1 = require( "./routes_v1" ),
    InaturalistAPI = { };

InaturalistAPI.prepareApp = function( a, config ) {
  var express = require( "express" ),
      bodyParser = require( "body-parser" ),
      compression = require( "compression" );
  a.use( compression( ) );
  a.use( bodyParser.json( { type: req => {
    // Parser the request body for everything other than multipart requests,
    // which should specify body data as plain old form data which express can
    // parse on its own.
    if ( !req.headers["content-type"] ) {
      return true;
    }
    return req.headers["content-type"].match( /multipart/ ) === null;
  } } ) );
  a.use( util.accessControlHeaders );
  a.use( express.static( "public", {
    maxage: 86400000
  } ) );
  a.use( ( req, res, next ) => {
    util.timingMiddleware( req, res, next );
  } );
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
  a.use( InaturalistAPI.lookupNotInListMiddleware );
  a.use( InaturalistAPI.validateSession );
  a.use( InaturalistAPI.validateApplication );
};

InaturalistAPI.validateSession = function( req, res, next ) {
  if ( req.method === "OPTIONS" ) { return next( ); }
  if ( req.headers.authorization ) {
    const token = _.last( req.headers.authorization.split( /\s+/ ) );
    jwt.verify( token, config.jwtSecret || "secret",
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

InaturalistAPI.validateApplication = function( req, res, next ) {
  if ( req.method === "OPTIONS" ) { return next( ); }
  if ( req.userSession ) {
    next( );
    return;
  }
  if ( req.headers.authorization ) {
    jwt.verify( req.headers.authorization, config.jwtApplicationSecret || "secret",
                { algorithms: ["HS512"] }, ( err, payload ) => {
      if ( !err ) {
        req.applicationSession = payload;
      }
      next( );
    } );
  } else {
    next( );
  }
};

InaturalistAPI.preloadAndProcess = ( method, req, res, opts = { } ) => {
  const options = _.cloneDeep( opts );
  options.preload = options.preload || { };
  if ( req.userSession && req.userSession.user_id && !_.isEmpty( options.preload ) ) {
    if ( options.preload.userBlocks ) {
      User.blocks( req.userSession.user_id, ( err, blocks ) => {
        if ( blocks ) {
          req.userSession = Object.assign( { }, req.userSession, { blocks } );
        }
        delete options.preload.userBlocks;
        InaturalistAPI.preloadAndProcess( method, req, res, options );
      } );
      return;
    }
    if ( options.preload.curatedProjects ) {
      User.projectsCurated( req.userSession.user_id, ( err, projectIDs ) => {
        if ( projectIDs ) {
          req.userSession.curated_project_ids = projectIDs;
        }

        delete options.preload.curatedProjects;
        InaturalistAPI.preloadAndProcess( method, req, res, options );
      } );
      return;
    }
    if ( options.preload.localeDefaults ) {
      User.localeDefaults( req.userSession.user_id, ( err, defaults ) => {
        if ( defaults ) {
          req.userSession = Object.assign( { }, req.userSession, defaults );
        }
        delete options.preload.localeDefaults;
        InaturalistAPI.preloadAndProcess( method, req, res, options );
      } );
      return;
    }
  }
  routesV1.default( method, req, res );
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
  var AnnotationsController = require( "./controllers/v1/annotations_controller" ),
      CommentsController = require( "./controllers/v1/comments_controller" ),
      FlagsController = require( "./controllers/v1/flags_controller" ),
      IdentificationsController = require( "./controllers/v1/identifications_controller" ),
      ObservationFieldsController = require( "./controllers/v1/observation_fields_controller" ),
      ObservationFieldValuesController = require( "./controllers/v1/observation_field_values_controller" ),
      ObservationPhotosController = require( "./controllers/v1/observation_photos_controller" ),
      ObservationsController = require( "./controllers/v1/observations_controller" ),
      PhotosController = require( "./controllers/v1/photos_controller" ),
      PlacesController = require( "./controllers/v1/places_controller" ),
      PostsController = require( "./controllers/v1/posts_controller" ),
      ComputervisionController = require( "./controllers/v1/computervision_controller"),
      ProjectObservationsController = require( "./controllers/v1/project_observations_controller" ),
      ProjectsController = require( "./controllers/v1/projects_controller" ),
      TaxaController = require( "./controllers/v1/taxa_controller" ),
      UsersController = require( "./controllers/v1/users_controller" ),
      ControlledTermsController = require( "./controllers/v1/controlled_terms_controller" ),
      SoundsController = require( "./controllers/v1/sounds_controller" ),
      SearchController = require( "./controllers/v1/search_controller" );

  // set up multer to handle multipart form uploads
  // uploads will be stored at:
  //   e.g. {UPLOADS_DIR}/{TIME}_{RANDOM}/{ORIGINAL_FILENAME}
  var storage = multer.diskStorage({
    destination: ( req, file, callback ) => {
      crypto.pseudoRandomBytes( 16, ( err, raw ) => {
        const time = Date.now( );
        var hash = raw.toString( "hex" );
        // create a directory in which to store the upload
        const uploadDir = `${config.imageProcesing.uploadsDir}/tmp_${time}_${hash}`;
        if ( !fs.existsSync( uploadDir ) ) {
          fs.mkdirSync( uploadDir );
        }
        callback( null, uploadDir );
      });

    },
    filename: ( req, file, callback ) => callback( null, file.originalname )
  });
  var upload = multer({ storage: storage });

  // helper method to create customized routes
  var dfault = ( action, path, method, options = { } ) => {
    const routeOptions = [ path ];
    if ( options.routeHandler ) {
      routeOptions.push( options.routeHandler );
    }
    app[action]( ...routeOptions, ( req, res ) => {
      if ( options.defaultTTL ) {
        req.query.ttl = req.query.ttl || options.defaultTTL;
      }
      if ( options.setTTL ) {
        util.setTTL( req );
      }
      let err;
      if ( options.validateMultiIDParam ) {
        err = InaturalistAPI.validateMultiIDParam( req, options );
        if( err ) { return util.renderError( err, res ); }
      }
      InaturalistAPI.preloadAndProcess( method, req, res, options );
    });
  };

  // OPTIONS requests just need to respond with 200; headers are already set
  app.options( "/*", ( req, res ) => {
    res.setHeader( "Cache-Control", "public, max-age=3600" );
    res.sendStatus( 200 );
  });

  // map tile routes
  app.get( "/v1/:style/:zoom/:x/:y.:format([a-z.]+)", ElasticMapper.route )
  app.get( "/v1/places/:place_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.placesRoute );
  app.get( "/v1/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.taxonPlacesRoute );
  app.get( "/v1/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.taxonRangesRoute );

  app.get( "/v1/:style/:zoom/:x/:y.:format([a-z.]+)", ElasticMapper.route )

  app.get( "/v1/tiles.json", ( req, res ) => {
    let urlBase = `${config.currentVersionURL}/colored_heatmap/{z}/{x}/{y}.torque.json`;
    if( !_.isEmpty( req.query ) ) {
      var cloned = _.clone( req.query );
      delete cloned.zoom;
      delete cloned.lat;
      delete cloned.lng;
      urlBase = urlBase + `?${util.objectToQueryString( cloned )}`;
    }
    res.setHeader( "Cache-Control", "public, max-age=3600" );
    const interval = req.query.interval === "weekly" ? "week" : "month";
    res.json( {
      resolution: 1,
      data_steps: interval === "week" ? 52 : 12,
      tiles: [ urlBase ]
    });
  });

  if ( config.imageProcesing && config.imageProcesing.tensorappURL &&
       config.imageProcesing.uploadsDir ) {
    app.post( "/v1/computervision/score_image", upload.single( "image" ), ( req, res ) => {
      InaturalistAPI.preloadAndProcess(ComputervisionController.scoreImage, req, res, {
        preload: { localeDefaults: true }
      } );
    });
    dfault( "get", "/v1/computervision/score_observation/:id", ComputervisionController.scoreObservation, {
      preload: { localeDefaults: true }
    } );
  }

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

  const allPreloads = { userBlocks: true, curatedProjects: true, localeDefaults: true };
  // Observations
  dfault( "post", "/v1/observations", ObservationsController.create );
  dfault( "put", "/v1/observations/:id", ObservationsController.update );
  dfault( "delete", "/v1/observations/:id", ObservationsController.delete );
  dfault( "get", "/v1/observations", ObservationsController.search, {
    defaultTTL: 300, preload: allPreloads } );
  dfault( "get", "/v1/observations/identifiers", ObservationsController.identifiers, {
    setTTL: true, preload: allPreloads } );
  dfault( "get", "/v1/observations/observers", ObservationsController.observers, {
    setTTL: true, preload: allPreloads } );
  dfault( "get", "/v1/observations/species_counts", ObservationsController.speciesCounts, {
    setTTL: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/observations/popular_field_values", ObservationsController.popularFieldValues );
  dfault( "get", "/v1/observations/histogram", ObservationsController.histogram );
  dfault( "get", "/v1/observations/iconic_taxa_counts", ObservationsController.iconicTaxaCounts );
  dfault( "get", "/v1/observations/iconic_taxa_species_counts", ObservationsController.iconicTaxaSpeciesCounts );
  dfault( "get", "/v1/observations/tree_taxa", ObservationsController.treeTaxa );
  dfault( "get", "/v1/observations/updates", ObservationsController.updates );
  dfault( "get", "/v1/observations/deleted", ObservationsController.deleted );
  dfault( "get", "/v1/observations/umbrella_project_stats", ObservationsController.umbrellaProjectStats );
  dfault( "get", "/v1/observations/quality_grades", ObservationsController.qualityGrades );
  dfault( "get", "/v1/observations/identification_categories", ObservationsController.identificationCategories );
  dfault( "get", "/v1/observations/:id", ObservationsController.show, {
    validateMultiIDParam: true, defaultTTL: -1, preload: allPreloads } );
  dfault( "post", "/v1/observations/:id/fave", ObservationsController.fave );
  dfault( "delete", "/v1/observations/:id/unfave", ObservationsController.unfave );
  dfault( "post", "/v1/votes/vote/observation/:id", ObservationsController.fave );
  dfault( "delete", "/v1/votes/unvote/observation/:id", ObservationsController.unfave );
  dfault( "post", "/v1/observations/:id/review", ObservationsController.review );
  dfault( "delete", "/v1/observations/:id/review", ObservationsController.unreview );
  dfault( "post", "/v1/observations/:id/quality/:metric", ObservationsController.setQualityMetric );
  dfault( "delete", "/v1/observations/:id/quality/:metric", ObservationsController.deleteQualityMetric );
  dfault( "get", "/v1/observations/:id/quality_metrics", ObservationsController.qualityMetrics );
  dfault( "get", "/v1/observations/:id/subscriptions", ObservationsController.subscriptions );
  dfault( "get", "/v1/observations/:id/taxon_summary", ObservationsController.taxonSummary );
  dfault( "put", "/v1/observations/:id/viewed_updates", ObservationsController.viewedUpdates );

  // ObservationPhotos
  dfault( "post", "/v1/observation_photos", ObservationPhotosController.create, { routeHandler: upload.fields( [
    { name: "file", maxCount: 1 }
  ] ) } );

  // Taxa
  dfault( "get", "/v1/taxa", TaxaController.search, {
    defaultTTL: 300, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/autocomplete", TaxaController.autocomplete, {
    defaultTTL: 120, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/suggest", TaxaController.suggest, {
    preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/:id", TaxaController.show, {
    validateMultiIDParam: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/:id/wanted", TaxaController.wanted, {
    validateMultiIDParam: true, preload: { localeDefaults: true } } );

  // Places
  dfault( "get", "/v1/places/containing", PlacesController.containing );
  dfault( "get", "/v1/places/autocomplete", PlacesController.autocomplete, { defaultTTL: 300 } );
  dfault( "get", "/v1/places/nearby", PlacesController.nearby, { defaultTTL: 300 } );
  dfault( "get", "/v1/places/:id", PlacesController.show, {
    validateMultiIDParam: true, allowIDSlugs: true } );

  // Projects
  dfault( "get", "/v1/projects/autocomplete", ProjectsController.autocomplete, { defaultTTL: 300 } );
  dfault( "post", "/v1/projects", ProjectsController.create, { routeHandler: upload.fields( [
    { name: "project[icon]", maxCount: 1 },
    { name: "project[cover]", maxCount: 1 }
  ] ) } );
  dfault( "put", "/v1/projects/:id", ProjectsController.update, { routeHandler: upload.fields( [
    { name: "project[icon]", maxCount: 1 },
    { name: "project[cover]", maxCount: 1 }
  ] ) } );
  dfault( "delete", "/v1/projects/:id", ProjectsController.delete );
  dfault( "get", "/v1/projects/:id", ProjectsController.show, {
    validateMultiIDParam: true, allowIDSlugs: true } );
  dfault( "get", "/v1/projects/:id/members", ProjectsController.members, {
    validateMultiIDParam: true,  allowIDSlugs: true } );
  dfault( "get", "/v1/projects/:id/posts", ProjectsController.posts );
  dfault( "post", "/v1/projects/:id/join", ProjectsController.join, { validateMultiIDParam: true } );
  dfault( "delete", "/v1/projects/:id/leave", ProjectsController.leave, { validateMultiIDParam: true } );
  dfault( "post", "/v1/projects/:id/add", ProjectsController.add );
  dfault( "delete", "/v1/projects/:id/remove", ProjectsController.remove );
  dfault( "get", "/v1/projects/:id/subscriptions", ProjectsController.subscriptions );
  dfault( "get", "/v1/projects/:id/followers", ProjectsController.followers );

  // Comments
  dfault( "post", "/v1/comments", CommentsController.create );
  dfault( "put", "/v1/comments/:id", CommentsController.update );
  dfault( "delete", "/v1/comments/:id", CommentsController.delete );

  // Flags
  dfault( "post", "/v1/flags", FlagsController.create );
  dfault( "delete", "/v1/flags/:id", FlagsController.delete );

  // Identifications
  dfault( "get", "/v1/identifications", IdentificationsController.search, {
    preload: allPreloads } );
  dfault( "post", "/v1/identifications", IdentificationsController.create );
  dfault( "get", "/v1/identifications/categories", IdentificationsController.categories );
  dfault( "get", "/v1/identifications/species_counts", IdentificationsController.speciesCounts, {
    setTTL: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/identifiers", IdentificationsController.identifiers, {
    preload: allPreloads } );
  dfault( "get", "/v1/identifications/observers", IdentificationsController.observers, {
    preload: allPreloads } );
  dfault( "get", "/v1/identifications/recent_taxa", IdentificationsController.recentTaxa, {
    preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/similar_species", IdentificationsController.similarSpecies, {
    preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/:id", IdentificationsController.show, {
    preload: allPreloads } );
  dfault( "put", "/v1/identifications/:id", IdentificationsController.update );
  dfault( "delete", "/v1/identifications/:id", IdentificationsController.delete );

  // ObservationFields
  dfault( "get", "/v1/observation_fields/autocomplete", ObservationFieldsController.autocomplete );
  dfault( "post", "/v1/observation_field_values", ObservationFieldValuesController.create );
  dfault( "put", "/v1/observation_field_values/:id", ObservationFieldValuesController.update );
  dfault( "delete", "/v1/observation_field_values/:id", ObservationFieldValuesController.delete );

  // Photos
  dfault( "post", "/v1/photos", PhotosController.create );

  // Sounds
  dfault( "post", "/v1/sounds", SoundsController.create );

  // Users
  dfault( "get", "/v1/users/autocomplete", UsersController.autocomplete );
  dfault( "put", "/v1/users/update_session", UsersController.updateSession );
  dfault( "put", "/v1/users/:id", UsersController.update );
  dfault( "get", "/v1/users/me", UsersController.me );
  dfault( "get", "/v1/users/:id", UsersController.show );

  // Posts
  dfault( "get", "/v1/posts", PostsController.index );
  dfault( "get", "/v1/posts/for_user", PostsController.for_user );

  // Subscriptions
  dfault( "post", "/v1/subscriptions/Observation/:id/subscribe", ObservationsController.subscribe );
  dfault( "post", "/v1/subscriptions/Project/:id/subscribe", ProjectsController.subscribe );

  // ControlledTerms
  dfault( "get", "/v1/controlled_terms", ControlledTermsController.search );
  dfault( "get", "/v1/controlled_terms/for_taxon", ControlledTermsController.forTaxon );

  // Annotations
  dfault( "post", "/v1/annotations", AnnotationsController.create );
  dfault( "delete", "/v1/annotations/:id", AnnotationsController.delete );
  dfault( "post", "/v1/votes/vote/annotation/:id", AnnotationsController.vote );
  dfault( "delete", "/v1/votes/unvote/annotation/:id", AnnotationsController.unvote );

  // ProjectObservations
  dfault( "post", "/v1/project_observations", ProjectObservationsController.create );
  dfault( "put", "/v1/project_observations/:id", ProjectObservationsController.update );
  dfault( "delete", "/v1/project_observations/:id", ProjectObservationsController.delete );
  
  // Universal search
  dfault( "get", "/v1/search", SearchController.search, { defaultTTL: 120, preload: { localeDefaults: true } } );

  // GeoIP
  dfault( "get", "/v1/geoip_lookup", ( req, callback ) => {
      let results = { };
      const geoip = require( "geoip-lite" );
      if ( req.query.ip ) {
        results = geoip.lookup( req.query.ip );
      }
      callback( null, { results: results } );
  } );

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

InaturalistAPI.validateMultiIDParam = function( req, options = { } ) {
  if( !req.params.id ) {
    return { messsage: "ID missing", status: 422 };
  }
  const regex = options.allowIDSlugs ?
    /^[0-9a-zá_,-]*[0-9a-zá_-]$/ :
    /^[0-9,]*[0-9]$/
  if( !req.params.id.match( regex ) ) {
    return { messsage: "invalid ID", status: 422 };
  }
};

InaturalistAPI.setPerPage = function( req, options ) {
  req.query.per_page = InaturalistAPI.perPage( req, options );
};

InaturalistAPI.perPage = function( req, options ) {
  options = options || { };
  options.default = options.default || 30;
  options.max = options.max || 100;
  let perPage = Number( req.query.per_page );
  if ( perPage === 0 ) { return 0; }
  perPage = perPage || options.default;
  if( perPage < 1 || perPage > options.max ) {
    perPage = options.default;
  }
  return perPage
};

InaturalistAPI.paginationData = function( req, options ) {
  options = options || { };
  const page = Number( req.query.page ) || 1;
  const perPage = InaturalistAPI.perPage( req, options );
  const offset = page * perPage - perPage;
  // aggregations can't have size 0
  const aggSize = Math.min( offset + perPage, options.max || 500 ) || 1;
  return {
    page,
    perPage,
    offset,
    aggSize
  };
}

InaturalistAPI.setDefaultParamValue = function( param, dfault, options ) {
  options = options || { };
  if( !dfault ) { return param; }
  param = param || dfault;
  if( options.enum ) {
    if( !_.includes( options.enum, param) ) {
      param = dfault;
    }
  }
  return param;
};

InaturalistAPI.responseLocationToLatLng = function( response ) {
  if( response && response.hits && !_.isUndefined( response.hits.hits[0] ) ) {
    _.each( response.hits.hits, function( hit ) {
      util.locationToLatLng( hit._source );
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
  InaturalistAPI.lookupInstancesMiddleware(
    req, res, next, "project_id", Project.findAllByIDElastic, "project" );
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
  InaturalistAPI.lookupInstancesMiddleware(
    req, res, next, "not_in_project", Project.findAllByIDElastic, "not_in_project" );
};

InaturalistAPI.lookupListMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "list_id", List.findByID, "list" );
};

InaturalistAPI.lookupNotInListMiddleware = function( req, res, next ) {
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "not_in_list_id", List.findByID, "not_in_list" );
};

InaturalistAPI.lookupUserMiddleware = function( req, res, next ) {
  if ( req.method === "OPTIONS" ) { return next( ); }
  if( !req.query.user_id ) { return next( ); }
  var asInt = Number( req.query.user_id );
  // if user_id is an integer then skip the search by login
  if( asInt && asInt.toString( ).length === req.query.user_id.length ) { return next( ); }
  InaturalistAPI.lookupInstanceMiddleware(
    req, res, next, "user_id", User.findByLogin, "user" );
};

InaturalistAPI.lookupProjectsMiddleware = function( req, res, next ) {
  if ( req.method === "OPTIONS" ) { return next( ); }
  if( !req.query.projects ) { return next( ); }
  req.inat = req.inat || { };
  req.inat.projects = [ ];
  req.query.project_ids = [ ];
  var projectIDs = util.paramArray( req.query.projects );
  var resultCount = 0;
  _.each( projectIDs, function( p ) {
    Project.findByID( p, function( err, obj ) {
      if( err ) { return util.renderError( err, res ); }
      if( obj ) {
        req.inat.projects.push( obj );
        req.query.project_ids.push( obj.id );
      }
      resultCount += 1;
      if( resultCount == projectIDs.length ) { return next( ); }
    });
  });
};

// if the record does not exist, raise an error
InaturalistAPI.lookupInstanceMiddleware = function( req, res, callback, paramKey, method, objectKey ) {
  if ( req.method === "OPTIONS" ) { return callback( ); }
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
    // lookup the instance by ID
    method( ids[0], function( err, obj ) {
      if( err ) { return callback( err ); }
      if( !obj ) {
        return callback({ error: "Unknown "+ paramKey +" "+ req.query[ paramKey ], status: 422 });
      }
      callback( null, obj );
    });
  } else { callback( ); }
};

// if none of the records exist, raise an error
InaturalistAPI.lookupInstancesMiddleware = function( req, res, callback, paramKey, method, objectKey ) {
  if ( req.method === "OPTIONS" ) { return callback( ); }
  req.inat = req.inat || { };
  InaturalistAPI.lookupInstances( req, paramKey, method, function( err, objs ) {
    if( err ) { return util.renderError( err, res ); }
    if( objs && objectKey ) {
      req.inat[ objectKey ] = objs;
    }
    callback( );
  });
};

// if we have the param specified, try to look up the instance
InaturalistAPI.lookupInstances = function( req, paramKey, method, callback ) {
  if( req.query[ paramKey ] ) {
    // the value could be a comma-delimited list of IDs
    var ids = util.paramArray( req.query[ paramKey ] );
    if( ids.length === 0 ) { return callback( ); }
    if( ids[0] === "any" ) { return callback( ); }
    // lookup the instances by ID
    method( ids, function( err, objs ) {
      if( err ) { return callback( err ); }
      // throw an arrow if NONE of the instances exist
      // otherwise the param would not be included at all, and thus
      // the request could return many more results than expected
      if( _.isEmpty( objs ) ) {
        return callback({ error: "Unknown "+ paramKey +": ["+ req.query[ paramKey ] +"]", status: 422 });
      }
      req.query[ paramKey ] = _.map( objs, "id" )
      callback( null, objs );
    });
  } else { callback( ); }
};

InaturalistAPI.iNatJSWrap = function( method, req ) {
  var params = Object.assign( { }, req.body, req.query );
  for( var p in req.params ) {
    params[ p ] = req.params[ p ];
  }
  var options = {
    api_token: req.headers.authorization,
    user_agent: req.headers["user-agent"],
    remote_ip: req.headers["x-forwarded-for"]
  };
  // multipart files are handled by multer
  // pass a custom parameter that will handled with FormData
  // FormData seems to need the knownLength to proper offsets
  _.each( req.files, ( files, key ) => {
    const file = files[0];
    params[key] = {
      type: "custom",
      value: fs.createReadStream( file.path ),
      options: { knownLength: file.size }
    };
  });
  if( !options.remote_ip && req.connection && req.connection.remoteAddress ) {
    options.remote_ip = req.connection.remoteAddress;
  }
  return method( params, options );
};

module.exports = InaturalistAPI;
