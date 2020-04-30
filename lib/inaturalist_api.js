const _ = require( "lodash" );
const jwt = require( "jsonwebtoken" );
const fs = require( "fs" );
const multer = require( "multer" );
const crypto = require( "crypto" );
const express = require( "express" );
const bodyParser = require( "body-parser" );
const compression = require( "compression" );
const geoip = require( "geoip-lite" );
const util = require( "./util" );
const InaturalistMapStyles = require( "./inaturalist_map_styles" );
const User = require( "./models/user" );
const Taxon = require( "./models/taxon" );
const Place = require( "./models/place" );
const Project = require( "./models/project" );
const List = require( "./models/list" );
const Site = require( "./models/site" );
const config = require( "../config" );
const routesV1 = require( "./routes_v1" );

const InaturalistAPI = { };

InaturalistAPI.prepareApp = a => {
  a.use( compression( ) );
  a.use( bodyParser.json( {
    type: req => {
      // Parser the request body for everything other than multipart requests,
      // which should specify body data as plain old form data which express can
      // parse on its own.
      if ( !req.headers["content-type"] ) {
        return true;
      }
      return req.headers["content-type"].match( /multipart/ ) === null;
    }
  } ) );
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
  a.use( InaturalistAPI.lookupMembersOfProjectProjectMiddleware );
  a.use( InaturalistAPI.lookupUserMiddleware );
  a.use( InaturalistAPI.lookupIdentifierUsersMiddleware );
  a.use( InaturalistAPI.lookupWithoutIdentifierUsersMiddleware );
  a.use( InaturalistAPI.lookupListMiddleware );
  a.use( InaturalistAPI.lookupNotInListMiddleware );
  a.use( InaturalistAPI.validateSession );
  a.use( InaturalistAPI.validateApplication );
};

InaturalistAPI.validateSession = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
  if ( req.headers.authorization ) {
    const token = _.last( req.headers.authorization.split( /\s+/ ) );
    jwt.verify( token, config.jwtSecret || "secret", { algorithms: ["HS512"] },
      ( err, payload ) => {
        if ( !err ) {
          req.userSession = payload;
        }
        next( );
      } );
  } else {
    next( );
  }
};

InaturalistAPI.validateApplication = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
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

InaturalistAPI.preloadAndProcess = async ( method, req, res, opts = { } ) => {
  const options = _.cloneDeep( opts );
  options.preload = options.preload || { };
  if ( req.userSession && req.userSession.user_id && !_.isEmpty( options.preload ) ) {
    if ( options.preload.userBlocks ) {
      const blocks = await User.blocks( req.userSession.user_id );
      if ( blocks ) {
        req.userSession = Object.assign( { }, req.userSession, { blocks } );
      }
      delete options.preload.userBlocks;
    }
    if ( options.preload.curatedProjects ) {
      const projectIDs = await User.projectsCurated( req.userSession.user_id );
      if ( projectIDs ) {
        req.userSession.curated_project_ids = projectIDs;
      }
      delete options.preload.curatedProjects;
    }
    if ( options.preload.trustingUsers ) {
      const userIDs = await User.trustingUsers( req.userSession.user_id );
      if ( userIDs ) {
        req.userSession.trusting_user_ids = userIDs;
      }
      delete options.preload.trustingUsers;
    }
    if ( options.preload.localeDefaults ) {
      const defaults = await User.localeDefaults( req.userSession.user_id );
      if ( defaults ) {
        req.userSession = Object.assign( { }, req.userSession, defaults );
      }
      delete options.preload.localeDefaults;
    }
    if ( options.preload.siteID ) {
      const siteID = await User.siteID( req.userSession.user_id );
      if ( siteID ) {
        req.userSession = Object.assign( { }, req.userSession, { siteID } );
      }
      delete options.preload.siteID;
    }
  }
  routesV1.defaultAsync( method, req, res );
};

InaturalistAPI.server = ( ) => {
  /* eslint-disable global-require */
  const ElasticMapper = require( "elasticmaps" );
  const InaturalistMapserver = require( "./inaturalist_map_server" );
  const app = ElasticMapper.server( _.extend( { }, config, {
    prepareApp: InaturalistAPI.prepareApp,
    prepareQuery: InaturalistMapserver.prepareQuery,
    prepareStyle: InaturalistMapserver.prepareStyle,
    beforeSendResult: InaturalistMapserver.beforeSendResult
  } ) );
  const AnnotationsController = require( "./controllers/v1/annotations_controller" );
  const CommentsController = require( "./controllers/v1/comments_controller" );
  const ComputervisionController = require( "./controllers/v1/computervision_controller" );
  const ControlledTermsController = require( "./controllers/v1/controlled_terms_controller" );
  const FlagsController = require( "./controllers/v1/flags_controller" );
  const IdentificationsController = require( "./controllers/v1/identifications_controller" );
  const MessagesController = require( "./controllers/v1/messages_controller" );
  const ObservationFieldsController = require( "./controllers/v1/observation_fields_controller" );
  const ObservationFieldValuesController = require( "./controllers/v1/observation_field_values_controller" );
  const ObservationPhotosController = require( "./controllers/v1/observation_photos_controller" );
  const ObservationsController = require( "./controllers/v1/observations_controller" );
  const PhotosController = require( "./controllers/v1/photos_controller" );
  const PlacesController = require( "./controllers/v1/places_controller" );
  const PostsController = require( "./controllers/v1/posts_controller" );
  const ProjectObservationsController = require( "./controllers/v1/project_observations_controller" );
  const ProjectsController = require( "./controllers/v1/projects_controller" );
  const SearchController = require( "./controllers/v1/search_controller" );
  const SitesController = require( "./controllers/v1/sites_controller" );
  const SoundsController = require( "./controllers/v1/sounds_controller" );
  const TaxaController = require( "./controllers/v1/taxa_controller" );
  const UsersController = require( "./controllers/v1/users_controller" );
  /* eslint-enable global-require */

  // set up multer to handle multipart form uploads
  // uploads will be stored at:
  //   e.g. {UPLOADS_DIR}/{TIME}_{RANDOM}/{ORIGINAL_FILENAME}
  const storage = multer.diskStorage( {
    destination: ( req, file, callback ) => {
      crypto.pseudoRandomBytes( 16, ( err, raw ) => {
        const time = Date.now( );
        const hash = raw.toString( "hex" );
        // create a directory in which to store the upload
        const uploadDir = `${config.imageProcesing.uploadsDir}/tmp_${time}_${hash}`;
        if ( !fs.existsSync( uploadDir ) ) {
          fs.mkdirSync( uploadDir );
        }
        callback( null, uploadDir );
      } );
    },
    filename: ( req, file, callback ) => callback( null, file.originalname )
  } );
  const upload = multer( { storage } );

  // helper method to create customized routes
  const dfault = ( action, path, method, opts = { } ) => {
    const options = Object.assign( { }, opts, { async: true } );
    const routeOptions = [path];
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
        if ( err ) { return void util.renderError( err, res ); }
      }
      InaturalistAPI.preloadAndProcess( method, req, res, options );
    } );
  };

  // OPTIONS requests just need to respond with 200; headers are already set
  app.options( "/*", ( req, res ) => {
    res.setHeader( "Cache-Control", "public, max-age=3600" );
    res.sendStatus( 200 );
  } );

  // map tile routes
  app.get( "/v1/:style/:zoom/:x/:y.:format([a-z.]+)", ElasticMapper.route );
  app.get( "/v1/places/:place_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.placesRoute );
  app.get( "/v1/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.taxonPlacesRoute );
  app.get( "/v1/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z.]+)",
    InaturalistMapserver.taxonRangesRoute );

  app.get( "/v1/tiles.json", ( req, res ) => {
    let urlBase = `${config.currentVersionURL}/colored_heatmap/{z}/{x}/{y}.torque.json`;
    if ( !_.isEmpty( req.query ) ) {
      const cloned = _.clone( req.query );
      delete cloned.zoom;
      delete cloned.lat;
      delete cloned.lng;
      urlBase += `?${util.objectToQueryString( cloned )}`;
    }
    res.setHeader( "Cache-Control", "public, max-age=3600" );
    const interval = req.query.interval === "weekly" ? "week" : "month";
    res.json( {
      resolution: 1,
      data_steps: interval === "week" ? 52 : 12,
      tiles: [urlBase]
    } );
  } );

  if ( config.imageProcesing && config.imageProcesing.tensorappURL
    && config.imageProcesing.uploadsDir
  ) {
    app.post( "/v1/computervision/score_image", upload.single( "image" ), ( req, res ) => {
      InaturalistAPI.preloadAndProcess( ComputervisionController.scoreImage, req, res, {
        async: true, preload: { localeDefaults: true }
      } );
    } );
    dfault( "get", "/v1/computervision/score_observation/:id", ComputervisionController.scoreObservation, {
      async: true, preload: { localeDefaults: true }
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
  } );

  const allPreloads = { userBlocks: true, curatedProjects: true, localeDefaults: true };
  // Observations
  dfault( "post", "/v1/observations", ObservationsController.create );
  dfault( "put", "/v1/observations/:id", ObservationsController.update );
  dfault( "delete", "/v1/observations/:id", ObservationsController.delete );
  dfault( "get", "/v1/observations", ObservationsController.searchCacheWrapper,
    { defaultTTL: 300, preload: allPreloads } );
  dfault( "get", "/v1/observations/identifiers", ObservationsController.identifiersCacheWrapper,
    { setTTL: true, preload: allPreloads } );
  dfault( "get", "/v1/observations/observers", ObservationsController.observersCacheWrapper,
    { setTTL: true, preload: allPreloads } );
  dfault( "get", "/v1/observations/species_counts", ObservationsController.speciesCountsCacheWrapper,
    { setTTL: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/observations/taxa_counts_by_month", ObservationsController.taxaCountsByMonth,
    { setTTL: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/observations/popular_field_values", ObservationsController.popularFieldValues );
  dfault( "get", "/v1/observations/histogram", ObservationsController.histogram );
  dfault( "get", "/v1/observations/iconic_taxa_counts", ObservationsController.iconicTaxaCounts );
  dfault( "get", "/v1/observations/iconic_taxa_species_counts", ObservationsController.iconicTaxaSpeciesCounts );
  dfault( "get", "/v1/observations/tree_taxa", ObservationsController.treeTaxa );
  dfault( "get", "/v1/observations/taxonomy", ObservationsController.taxonomy );
  dfault( "get", "/v1/observations/lifelist_export", ObservationsController.lifelistExport );
  dfault( "get", "/v1/observations/updates", ObservationsController.updates );
  dfault( "get", "/v1/observations/deleted", ObservationsController.deleted );
  dfault( "get", "/v1/observations/umbrella_project_stats", ObservationsController.umbrellaProjectStats );
  dfault( "get", "/v1/observations/quality_grades", ObservationsController.qualityGrades );
  dfault( "get", "/v1/observations/identification_categories", ObservationsController.identificationCategories );
  dfault( "get", "/v1/observations/similar_species", ObservationsController.similarSpecies );
  dfault( "get", "/v1/observations/:id", ObservationsController.show, {
    validateMultiIDParam: true,
    defaultTTL: -1,
    preload: Object.assign( {}, allPreloads, { trustingUsers: true } )
  } );
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
  dfault( "post", "/v1/observation_photos", ObservationPhotosController.create, {
    routeHandler: upload.fields( [
      { name: "file", maxCount: 1 }
    ] )
  } );
  dfault( "put", "/v1/observation_photos/:id", ObservationPhotosController.update, {
    routeHandler: upload.fields( [
      { name: "file", maxCount: 1 }
    ] )
  } );
  dfault( "delete", "/v1/observation_photos/:id", ObservationPhotosController.delete );

  // Taxa
  dfault( "get", "/v1/taxa", TaxaController.search,
    { defaultTTL: 300, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/autocomplete", TaxaController.autocomplete,
    { defaultTTL: 120, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/suggest", TaxaController.suggest,
    { preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/nearby", TaxaController.nearby,
    { preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/:id", TaxaController.show,
    { validateMultiIDParam: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/taxa/:id/wanted", TaxaController.wanted,
    { validateMultiIDParam: true, preload: { localeDefaults: true } } );

  // Places
  dfault( "get", "/v1/places/containing", PlacesController.containing );
  dfault( "get", "/v1/places/autocomplete", PlacesController.autocomplete,
    { defaultTTL: 300 } );
  dfault( "get", "/v1/places/nearby", PlacesController.nearby,
    { defaultTTL: 300 } );
  dfault( "get", "/v1/places/:id", PlacesController.show,
    { validateMultiIDParam: true, allowIDSlugs: true } );

  // Projects
  dfault( "get", "/v1/projects", ProjectsController.search,
    { preload: { siteID: true } } );
  dfault( "get", "/v1/projects/autocomplete", ProjectsController.autocomplete,
    { defaultTTL: 300 } );
  dfault( "post", "/v1/projects", ProjectsController.create, {
    routeHandler: upload.fields( [
      { name: "project[icon]", maxCount: 1 },
      { name: "project[cover]", maxCount: 1 }
    ] )
  } );
  dfault( "put", "/v1/projects/:id", ProjectsController.update, {
    routeHandler: upload.fields( [
      { name: "project[icon]", maxCount: 1 },
      { name: "project[cover]", maxCount: 1 }
    ] )
  } );
  dfault( "delete", "/v1/projects/:id", ProjectsController.delete );
  dfault( "get", "/v1/projects/:id", ProjectsController.show,
    { validateMultiIDParam: true, allowIDSlugs: true } );
  dfault( "get", "/v1/projects/:id/members", ProjectsController.members,
    { validateMultiIDParam: true, allowIDSlugs: true } );
  dfault( "get", "/v1/projects/:id/posts", ProjectsController.posts );
  dfault( "post", "/v1/projects/:id/join", ProjectsController.join, { validateMultiIDParam: true } );
  dfault( "delete", "/v1/projects/:id/leave", ProjectsController.leave, { validateMultiIDParam: true } );
  dfault( "post", "/v1/projects/:id/add", ProjectsController.add );
  dfault( "delete", "/v1/projects/:id/remove", ProjectsController.remove );
  dfault( "get", "/v1/projects/:id/subscriptions", ProjectsController.subscriptions );
  dfault( "get", "/v1/projects/:id/followers", ProjectsController.followers );
  dfault( "put", "/v1/projects/:id/feature", ProjectsController.feature );
  dfault( "put", "/v1/projects/:id/unfeature", ProjectsController.unfeature );

  // Comments
  dfault( "post", "/v1/comments", CommentsController.create );
  dfault( "put", "/v1/comments/:id", CommentsController.update );
  dfault( "delete", "/v1/comments/:id", CommentsController.delete );

  // Flags
  dfault( "post", "/v1/flags", FlagsController.create );
  dfault( "put", "/v1/flags/:id", FlagsController.update );
  dfault( "delete", "/v1/flags/:id", FlagsController.delete );

  // Identifications
  dfault( "get", "/v1/identifications", IdentificationsController.search,
    { preload: allPreloads } );
  dfault( "post", "/v1/identifications", IdentificationsController.create );
  dfault( "get", "/v1/identifications/categories", IdentificationsController.categories );
  dfault( "get", "/v1/identifications/species_counts", IdentificationsController.speciesCounts,
    { setTTL: true, preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/identifiers", IdentificationsController.identifiers,
    { preload: allPreloads } );
  dfault( "get", "/v1/identifications/observers", IdentificationsController.observers,
    { preload: allPreloads } );
  dfault( "get", "/v1/identifications/recent_taxa", IdentificationsController.recentTaxa,
    { preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/recent_taxa_revisited", IdentificationsController.recentTaxa,
    { preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/similar_species", ObservationsController.similarSpecies,
    { preload: { localeDefaults: true } } );
  dfault( "get", "/v1/identifications/:id", IdentificationsController.show,
    { preload: allPreloads } );
  dfault( "put", "/v1/identifications/:id", IdentificationsController.update );
  dfault( "delete", "/v1/identifications/:id", IdentificationsController.delete );

  // Messages
  dfault( "post", "/v1/messages", MessagesController.create );
  dfault( "delete", "/v1/messages/:id", MessagesController.delete );
  dfault( "get", "/v1/messages", MessagesController.index );
  dfault( "get", "/v1/messages/unread", MessagesController.unread );
  dfault( "get", "/v1/messages/:id", MessagesController.show );

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
  dfault( "put", "/v1/users/:id", UsersController.update, {
    routeHandler: upload.fields( [
      { name: "user[icon]", maxCount: 1 }
    ] )
  } );
  dfault( "get", "/v1/users/me", UsersController.me );
  dfault( "get", "/v1/users/:id", UsersController.show );
  dfault( "get", "/v1/users/:id/projects", UsersController.projects );
  dfault( "get", "/v1/users/:id/followees", UsersController.followees );
  dfault( "get", "/v1/users/:id/place_and_taxon_subscriptions", UsersController.placeAndTaxonSubscriptions );
  dfault( "post", "/v1/users/:id/mute", UsersController.mute );
  dfault( "delete", "/v1/users/:id/mute", UsersController.unmute );

  // Posts
  dfault( "get", "/v1/posts", PostsController.index );
  dfault( "get", "/v1/posts/for_user", PostsController.for_user );
  dfault( "post", "/v1/posts", PostsController.create );
  dfault( "put", "/v1/posts/:id", PostsController.update );
  dfault( "delete", "/v1/posts/:id", PostsController.delete );

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
  dfault( "get", "/v1/search", SearchController.search,
    { defaultTTL: 120, preload: { localeDefaults: true } } );

  // Sites
  dfault( "get", "/v1/sites", SitesController.index );

  // GeoIP
  dfault( "get", "/v1/geoip_lookup", async req => {
    let results = { };
    if ( req.query.ip ) {
      results = geoip.lookup( req.query.ip );
    }
    return { results };
  } );

  setTimeout( ( ) => {
    Taxon.loadIconicTaxa( ).then( ( ) => {
      InaturalistMapStyles.markersAndCircles( null, { resetCache: true } );
    } );
    Site.loadDefaultSite( );
    Taxon.loadReferencedTaxa( );
    TaxaController.fetchSeekExceptionList( ).then( ( ) => { } );
  }, 1000 );

  return app;
};

InaturalistAPI.defaultMapFields = ( ) => (
  ["id", "location", "taxon.iconic_taxon_id", "captive",
    "quality_grade", "geoprivacy", "private_location"]
);

InaturalistAPI.validateMultiIDParam = ( req, options = { } ) => {
  if ( !req.params.id ) {
    return { messsage: "ID missing", status: 422 };
  }
  const regex = options.allowIDSlugs
    ? /^[0-9a-zá_,-]*[0-9a-zá_-]$/
    : /^[0-9,]*[0-9]$/;
  if ( !req.params.id.match( regex ) ) {
    return { messsage: "invalid ID", status: 422 };
  }
  return null;
};

InaturalistAPI.setPerPage = ( req, options ) => {
  req.query.per_page = InaturalistAPI.perPage( req, options );
};

InaturalistAPI.perPage = ( req, options ) => {
  options = options || { };
  options.default = options.default || 30;
  options.max = options.max || 100;
  let perPage = Number( req.query.per_page );
  if ( perPage === 0 ) { return 0; }
  perPage = perPage || options.default;
  if ( perPage < 1 || perPage > options.max ) {
    perPage = options.default;
  }
  return perPage;
};

InaturalistAPI.paginationData = ( req, options ) => {
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
};

InaturalistAPI.setDefaultParamValue = ( param, dfault, options ) => {
  options = options || { };
  if ( !dfault ) { return param; }
  param = param || dfault;
  if ( options.enum ) {
    if ( !_.includes( options.enum, param ) ) {
      param = dfault;
    }
  }
  return param;
};

InaturalistAPI.responseLocationToLatLng = response => {
  if ( response && response.hits && !_.isUndefined( response.hits.hits[0] ) ) {
    _.each( response.hits.hits, hit => {
      util.locationToLatLng( hit._source );
    } );
  }
};

InaturalistAPI.basicResponse = ( req, response ) => {
  const empty = ( !response || _.isUndefined( response.hits.hits[0] ) );
  const results = empty ? []
    : _.map( response.hits.hits, "_source" );
  return {
    total_results: empty ? 0 : response.hits.total.value,
    page: req.query.page || 1,
    per_page: empty ? 0 : Math.min( response.hits.total.value, req.query.per_page ),
    results
  };
};

InaturalistAPI.resultsHash = options => {
  options = options || { };
  return {
    total_results: options.total || 0,
    page: options.page || 1,
    per_page: !options.total ? 0 : Math.min( options.total, options.per_page ),
    results: options.results
  };
};

InaturalistAPI.lookupTaxonMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "taxon_id", Taxon.findByID, "taxon" );
};

InaturalistAPI.lookupPlaceMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "place_id", Place.findByID, "place" );
};

InaturalistAPI.lookupPreferredPlaceMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "preferred_place_id", Place.findByID, "preferredPlace" );
};

InaturalistAPI.lookupUnobservedByUserMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "unobserved_by_user_id", User.findByLoginOrID, "unobservedByUser" );
};

InaturalistAPI.lookupProjectMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstancesMiddleware( req, res, next,
    "project_id", Project.findAllByIDElastic, "project" );
};

InaturalistAPI.lookupProjectRulesMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "apply_project_rules_for", Project.findByID, "apply_project_rules_for" );
};

InaturalistAPI.lookupNotMatchingProjectMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "not_matching_project_rules_for", Project.findByID, "not_matching_project_rules_for" );
};

InaturalistAPI.lookupNotInProjectMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstancesMiddleware( req, res, next,
    "not_in_project", Project.findAllByIDElastic, "not_in_project" );
};

InaturalistAPI.lookupMembersOfProjectProjectMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstancesMiddleware( req, res, next,
    "members_of_project", Project.findAllByIDElastic, "members_of_project" );
};


InaturalistAPI.lookupListMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "list_id", List.findByID, "list" );
};

InaturalistAPI.lookupNotInListMiddleware = ( req, res, next ) => {
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "not_in_list_id", List.findByID, "not_in_list" );
};

InaturalistAPI.lookupUserMiddleware = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
  if ( !req.query.user_id ) { return void next( ); }
  const asInt = Number( req.query.user_id );
  // if user_id is an integer then skip the search by login
  if ( asInt && asInt.toString( ).length === req.query.user_id.length ) { return void next( ); }
  InaturalistAPI.lookupInstanceMiddleware( req, res, next,
    "user_id", User.findByLogin, "user" );
};

InaturalistAPI.lookupIdentifierUsersMiddleware = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
  if ( !req.query.ident_user_id ) { return void next( ); }
  InaturalistAPI.lookupInstancesMiddleware( req, res, next,
    "ident_user_id", User.findAllByLoginOrID, "ident_users" );
};

InaturalistAPI.lookupWithoutIdentifierUsersMiddleware = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
  if ( !req.query.without_ident_user_id ) { return void next( ); }
  InaturalistAPI.lookupInstancesMiddleware( req, res, next,
    "without_ident_user_id", User.findAllByLoginOrID, "without_ident_users" );
};

InaturalistAPI.lookupProjectsMiddleware = ( req, res, next ) => {
  if ( req.method === "OPTIONS" ) { return void next( ); }
  if ( !req.query.projects ) { return void next( ); }
  req.inat = req.inat || { };
  req.inat.projects = [];
  req.query.project_ids = [];
  const projectIDs = util.paramArray( req.query.projects );
  let resultCount = 0;
  _.each( projectIDs, p => {
    Project.findByID( p ).then( obj => {
      if ( obj ) {
        req.inat.projects.push( obj );
        req.query.project_ids.push( obj.id );
      }
      resultCount += 1;
      if ( resultCount === projectIDs.length ) { return void next( ); }
    } ).catch( err => util.renderError( err, res ) );
  } );
};

// if the record does not exist, raise an error
InaturalistAPI.lookupInstanceMiddleware = ( req, res, callback, paramKey, method, objectKey ) => {
  if ( req.method === "OPTIONS" ) { return void callback( ); }
  req.inat = req.inat || { };
  InaturalistAPI.lookupInstance( req, paramKey, method, ( err, obj ) => {
    if ( err ) { return void util.renderError( err, res ); }
    if ( obj ) {
      if ( objectKey ) { req.inat[objectKey] = obj; }
      req.query[paramKey] = obj.id;
    }
    callback( );
  } );
};

// if we have the param specified, try to look up the instance
InaturalistAPI.lookupInstance = ( req, paramKey, method, callback ) => {
  if ( req.query[paramKey] ) {
    // the value could be a comma-delimited list of IDs
    const ids = util.paramArray( req.query[paramKey] );
    if ( ids.length !== 1 ) { return void callback( ); }
    if ( ids[0] === "any" ) { return void callback( ); }
    // lookup the instance by ID
    method( ids[0] ).then( obj => {
      if ( !obj ) {
        return void callback( {
          error: `Unknown ${paramKey} ${req.query[paramKey]}`,
          status: 422
        } );
      }
      callback( null, obj );
    } ).catch( callback );
  } else { callback( ); }
};

// if none of the records exist, raise an error
InaturalistAPI.lookupInstancesMiddleware = ( req, res, callback, paramKey, method, objectKey ) => {
  if ( req.method === "OPTIONS" ) { return void callback( ); }
  req.inat = req.inat || { };
  InaturalistAPI.lookupInstances( req, paramKey, method, ( err, objs ) => {
    if ( err ) { return void util.renderError( err, res ); }
    if ( objs && objectKey ) {
      req.inat[objectKey] = objs;
    }
    callback( );
  } );
};

// if we have the param specified, try to look up the instance
InaturalistAPI.lookupInstances = ( req, paramKey, method, callback ) => {
  if ( req.query[paramKey] ) {
    // the value could be a comma-delimited list of IDs
    const ids = util.paramArray( req.query[paramKey] );
    if ( ids.length === 0 ) { return void callback( ); }
    if ( ids[0] === "any" ) { return void callback( ); }
    // lookup the instances by ID
    method( ids ).then( objs => {
      // throw an error if NONE of the instances exist
      // otherwise the param would not be included at all, and thus
      // the request could return many more results than expected
      if ( _.isEmpty( objs ) ) {
        return void callback( {
          error: `Unknown ${paramKey}: [${req.query[paramKey]}]`,
          status: 422
        } );
      }
      req.query[paramKey] = _.map( objs, "id" );
      callback( null, objs );
    } ).catch( callback );
  } else { callback( ); }
};

InaturalistAPI.iNatJSWrap = ( method, req ) => {
  const params = Object.assign( { }, req.body, req.query );
  _.each( req.params, ( v, k ) => {
    params[k] = req.params[k];
  } );
  const options = {
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
  } );
  if ( !options.remote_ip && req.connection && req.connection.remoteAddress ) {
    options.remote_ip = req.connection.remoteAddress;
  }
  return method( params, options );
};

module.exports = InaturalistAPI;
