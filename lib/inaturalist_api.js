var _ = require( "underscore" ),
    util = require( "./util" ),
    User = require( "./models/user" ),
    Taxon = require( "./models/taxon" ),
    Place = require( "./models/place" ),
    Project = require( "./models/project" ),
    List = require( "./models/list" ),
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
  a.use( InaturalistAPI.lookupProjectsMiddleware );
  a.use( InaturalistAPI.lookupNotMatchingProjectMiddleware );
  a.use( InaturalistAPI.lookupNotInProjectMiddleware );
  a.use( InaturalistAPI.lookupUserMiddleware );
  a.use( InaturalistAPI.lookupListMiddleware );
};

InaturalistAPI.server = function( ) {
  var ElasticMapper = require( "elasticmaps" ),
      InaturalistMapserver = require( "./inaturalist_map_server" ),
      config = require( "../config" );
  var app = ElasticMapper.server( _.extend( config, {
    prepareApp: InaturalistAPI.prepareApp,
    prepareQuery: InaturalistMapserver.prepareQuery,
    prepareStyle: InaturalistMapserver.prepareStyle,
    beforeSendResult: InaturalistMapserver.beforeSendResult
  }));

  // log request times. Doing this outside prepareApp since
  // elasticmaps will log its own requests, if config.debug = true
  app.use( util.timingMiddleware );

  // map tile routes
  app.get( "/places/:place_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.placesRoute );
  app.get( "/taxon_places/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.taxonPlacesRoute );
  app.get( "/taxon_ranges/:taxon_id/:zoom/:x/:y.:format([a-z\.]+)",
    InaturalistMapserver.taxonRangesRoute );

  // map tile routes
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

  app.get( "/v1", routesV1.docs );
  app.get( "/v1/swagger.json", routesV1.swaggerJSON );
  app.get( "/v1/observations", routesV1.observations_index );
  app.get( "/v1/observations/identifiers", routesV1.observations_identifiers );
  app.get( "/v1/observations/observers", routesV1.observations_observers );
  app.get( "/v1/observations/species_counts", routesV1.species_counts );
  app.get( "/v1/observations/:id", routesV1.observations_show );
  app.get( "/v1/taxa/autocomplete", routesV1.taxa_autocomplete );
  app.get( "/v1/taxa/:id", routesV1.taxa_show );
  app.get( "/v1/places/autocomplete", routesV1.places_autocomplete );
  app.get( "/v1/places/nearby", routesV1.places_nearby );
  app.get( "/v1/places/:id", routesV1.places_show );

  return app;
};

InaturalistAPI.defaultMapFields = function( ) {
  return [ "id", "location", "taxon.iconic_taxon_id", "captive",
    "quality_grade", "geoprivacy", "private_location" ];
};

InaturalistAPI.methodValidationError = function( req ) {
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
  options.max = options.default || 100;
  req.query.per_page = parseInt( req.query.per_page ) || options.default;
  if( req.query.per_page < 1 || req.query.per_page > options.max ) {
    req.query.per_page = options.default;
  }
}

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
  var asInt = parseInt( req.query.user_id );
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

module.exports = InaturalistAPI;
