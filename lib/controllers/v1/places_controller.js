var _ = require( "underscore" ),
    esClient = require( "../../es_client" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    PlacesController = { };

PlacesController.returnFields = [
  "id", "name", "display_name", "place_type", "admin_level",
  "bbox_area", "ancestor_place_ids", "geometry_geojson",
  "location" ];

PlacesController.autocomplete = function( req, callback ) {
  InaturalistAPI.setPerPage( req, { default: 10, max: 20 } );
  var filters = [ ], sort = [{ admin_level: "asc" }];
  if( !req.query.q ) {
    return InaturalistAPI.basicResponse( null, req, null, callback );
  }
  var wheres = { bool: { should: [
    { match: { display_name_autocomplete: req.query.q } },
    { match: { display_name: { query: req.query.q, operator: "and" } } }
  ] } };
  if( req.query.geo ) {
    filters.push({ exists: { field: "geometry_geojson" } });
  }
  if( req.query.order_by == "area" ) {
    sort.push({ bbox_area: "desc" });
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_places",
    body: {
      query: {
        bool: {
          must: wheres,
          filter: filters
        }
      },
      _source: PlacesController.returnFields,
      sort: sort,
      size: req.query.per_page
    }
  }, function( err, response ) {
    InaturalistAPI.basicResponse( err, req, response, callback );
  });
};

PlacesController.nearby = function( req, callback ) {
  InaturalistAPI.setPerPage( req, { default: 10, max: 20 } );
  var placesQuery = _.extend( { }, req.query );
  // looking up standard places
  placesQuery.community = false;
  PlacesController.nearbyQuery( { query: placesQuery },
    function( err, response ) {
      if( err ) { return callback( err ); }
      var standardPlaces = response.results || [ ];

      // looking up community places
      placesQuery = _.extend( { }, req.query );
      placesQuery.community = true;
      PlacesController.nearbyQuery( { query: placesQuery },
        function( err, response ) {
          if( err ) { return callback( err ); }
          var communityPlaces = response.results || [ ];
          // preparing response
          callback( null, {
            total_results: standardPlaces.length + communityPlaces.length,
            page: 1,
            per_page: standardPlaces.length + communityPlaces.length,
            results: {
              standard: standardPlaces,
              community: communityPlaces
            }
          });
        }
      );
    }
  );
};

PlacesController.nearbyQueryBody = function( req ) {
  if( !( req.query.swlat && req.query.swlng &&
           req.query.nelat && req.query.nelng ) ) {
    return;
  }
  var filters = [
    { exists: { field: "geometry_geojson" } } ];
  var latDiff = Math.abs( Math.abs( req.query.nelat ) - Math.abs( req.query.swlat ) );
  var lngDiff = Math.abs( Math.abs( req.query.nelng ) - Math.abs( req.query.swlng ) );
  var latOffsetPx = latDiff * 0.1;
  var lngOffsetPx = lngDiff * 0.1;
  var queryArea = latDiff * lngDiff;
  if( queryArea < 1.5 ) { queryArea = 1.5; }
  req.query.swlng = parseFloat( req.query.swlng ) + lngOffsetPx;
  req.query.swlat = parseFloat( req.query.swlat ) + latOffsetPx;
  req.query.nelng = parseFloat( req.query.nelng ) - lngOffsetPx;
  req.query.nelat = parseFloat( req.query.nelat ) - latOffsetPx;
  req.query.swlng = (( 180 + req.query.swlng ) % 360 ) - 180;
  req.query.nelng = (( 180 + req.query.nelng ) % 360 ) - 180;
  if( req.query.swlat < -90 ) { req.query.swlat = -90; }
  if( req.query.nelat < -90 ) { req.query.nelat = -90; }
  if( req.query.swlat > 90 ) { req.query.swlat = 90; }
  if( req.query.nelat > 90 ) { req.query.nelat = 90; }
  filters.push( esClient.envelopeFilter( { envelope: { geometry_geojson: {
    nelat: req.query.nelat, nelng: req.query.nelng,
    swlat: req.query.swlat, swlng: req.query.swlng }}}));
  if( req.query.community ) {
    filters.push({ missing: { field: "admin_level" } });
    filters.push({ range: { bbox_area: { lte: queryArea, gt: 0 } } });
  } else {
    filters.push({ range: { admin_level: { gte: 0 } } });
  }
  var sort = [ { admin_level: "asc" } ];
  if( req.query.lat && req.query.lng && !req.query.community ) {
    sort.push({
      _geo_distance: {
        location: [ parseFloat( req.query.lng ), parseFloat( req.query.lat ) ],
        unit: "km",
        order: "asc"
      }
    });
  } else {
    sort.push({ bbox_area: "desc" });
  }
  var body = {
    query: {
      bool: {
        must: [ ],
        filter: filters
      }
    },
    _source: PlacesController.returnFields,
    sort: sort,
    size: req.query.per_page
  };
  if( req.query.name ) {
    body.query.bool.must.push({
      match: { display_name_autocomplete: req.query.name } });
  }
  return body;
};


PlacesController.nearbyQuery = function( req, callback ) {
  var body = PlacesController.nearbyQueryBody( req );
  if( _.isUndefined( body ) ) { return callback( null, [ ] ); }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_places",
    body: body
  }, function( err, response ) {
    InaturalistAPI.basicResponse( err, req, response, callback );
  });
};

PlacesController.show = function( req, callback ) {
  var err = InaturalistAPI.setPerPage( req, { default: 20, max: 20 } );
  var ids = _.filter( req.params.id.split(","), _.identity );
  if( !err && ids.length > req.query.per_page ) {
    err = { error: "Too many IDs", status: 422 };
  }
  if( err ) { return callback( err ); }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_places",
    body: {
      sort: { id: "desc" },
      query: {
        filtered: {
          filter: [ { terms: { id: ids } } ]
        }
      },
      _source: PlacesController.returnFields
    }
  }, function( err, response ) {
    InaturalistAPI.basicResponse( err, req, response, callback );
  });
};


module.exports = {
  show: PlacesController.show,
  autocomplete: PlacesController.autocomplete,
  nearby: PlacesController.nearby,
  nearbyQueryBody: PlacesController.nearbyQueryBody
};
