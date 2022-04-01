const _ = require( "lodash" );
const esClient = require( "../../es_client" );
const InaturalistAPI = require( "../../inaturalist_api" );
const util = require( "../../util" );

const PlacesController = { };

PlacesController.returnFields = [
  "admin_level",
  "ancestor_place_ids",
  "bbox_area",
  "bounding_box_geojson",
  "display_name",
  "geometry_geojson",
  "id",
  "location",
  "name",
  "place_type",
  "slug",
  "uuid"
];

PlacesController.autocomplete = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 20 } );
  const filters = [];
  const sort = [{ admin_level: "asc" }];
  if ( !req.query.q ) {
    return InaturalistAPI.basicResponse( req );
  }
  filters.push( {
    bool: {
      should: [
        { match: { display_name_autocomplete: req.query.q } },
        { match: { display_name: { query: req.query.q, operator: "and" } } }
      ]
    }
  } );
  if ( req.query.geo ) {
    filters.push( { exists: { field: "geometry_geojson" } } );
  }
  if ( req.query.order_by === "area" ) {
    sort.push( { bbox_area: "desc" } );
  }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_places`,
    body: {
      query: {
        bool: {
          filter: filters
        }
      },
      _source: PlacesController.returnFields,
      sort,
      size: req.query.per_page
    }
  } );
  return InaturalistAPI.basicResponse( req, response );
};

PlacesController.nearby = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 20 } );
  let placesQuery = _.assignIn( { }, req.query );
  // looking up standard places
  placesQuery.community = false;
  const nearbyRsp = await PlacesController.nearbyQuery( { query: placesQuery } );
  const standardPlaces = nearbyRsp.results || [];

  // looking up community places
  placesQuery = _.assignIn( { }, req.query );
  placesQuery.community = true;
  const commRsp = await PlacesController.nearbyQuery( { query: placesQuery } );
  const communityPlaces = commRsp.results || [];
  // preparing response
  return {
    total_results: standardPlaces.length + communityPlaces.length,
    page: 1,
    per_page: standardPlaces.length + communityPlaces.length,
    results: {
      standard: standardPlaces,
      community: communityPlaces
    }
  };
};

PlacesController.nearbyQueryBody = req => {
  if ( !( req.query.swlat && req.query.swlng
    && req.query.nelat && req.query.nelng ) ) {
    return null;
  }
  const filters = [{ exists: { field: "geometry_geojson" } }];
  const inverseFilters = [];
  const latDiff = Math.abs( Math.abs( req.query.nelat ) - Math.abs( req.query.swlat ) );
  const lngDiff = Math.abs( Math.abs( req.query.nelng ) - Math.abs( req.query.swlng ) );
  const latOffsetPx = latDiff * 0.1;
  const lngOffsetPx = lngDiff * 0.1;
  let queryArea = latDiff * lngDiff;
  if ( queryArea < 1.5 ) { queryArea = 1.5; }
  req.query.swlng = parseFloat( req.query.swlng ) + lngOffsetPx;
  req.query.swlat = parseFloat( req.query.swlat ) + latOffsetPx;
  req.query.nelng = parseFloat( req.query.nelng ) - lngOffsetPx;
  req.query.nelat = parseFloat( req.query.nelat ) - latOffsetPx;
  req.query.swlng = ( ( 180 + req.query.swlng ) % 360 ) - 180;
  req.query.nelng = ( ( 180 + req.query.nelng ) % 360 ) - 180;
  if ( req.query.swlat < -90 ) { req.query.swlat = -90; }
  if ( req.query.nelat < -90 ) { req.query.nelat = -90; }
  if ( req.query.swlat > 90 ) { req.query.swlat = 90; }
  if ( req.query.nelat > 90 ) { req.query.nelat = 90; }
  filters.push( esClient.envelopeFilter( {
    envelope: {
      geometry_geojson: {
        nelat: req.query.nelat,
        nelng: req.query.nelng,
        swlat: req.query.swlat,
        swlng: req.query.swlng
      }
    }
  } ) );
  if ( req.query.community ) {
    inverseFilters.push( { exists: { field: "admin_level" } } );
    filters.push( { range: { bbox_area: { lte: queryArea, gt: 0 } } } );
  } else {
    filters.push( { range: { admin_level: { gte: -10 } } } );
  }
  if ( req.query.name ) {
    filters.push( { match: { display_name_autocomplete: req.query.name } } );
  }
  const sort = [{ admin_level: "asc" }];
  if ( req.query.lat && req.query.lng && !req.query.community ) {
    sort.push( {
      _geo_distance: {
        location: [parseFloat( req.query.lng ), parseFloat( req.query.lat )],
        unit: "km",
        order: "asc"
      }
    } );
  } else {
    sort.push( { bbox_area: "desc", id: "asc" } );
  }
  const body = {
    query: {
      bool: {
        filter: filters,
        must_not: inverseFilters
      }
    },
    _source: PlacesController.returnFields,
    sort,
    size: req.query.per_page
  };
  return body;
};

PlacesController.nearbyQuery = async req => {
  const body = PlacesController.nearbyQueryBody( req );
  if ( _.isUndefined( body ) ) { return []; }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_places`,
    body
  } );
  return InaturalistAPI.basicResponse( req, response );
};

PlacesController.show = async req => {
  const ids = _.filter( req.params.id.split( "," ), _.identity );
  if ( ids ) {
    req.query.per_page = ids.length;
  }
  InaturalistAPI.setPerPage( req, { max: 500 } );
  if ( ids.length > req.query.per_page ) {
    throw util.httpError( 422, "Too many IDs" );
  }
  const numericIDs = _.filter( ids, id => Number( id ) );
  let { returnFields } = PlacesController;
  if ( req.query.no_geom ) {
    returnFields = _.filter( returnFields, f => f.indexOf( "geojson" ) < 0 );
  }
  let sort = { id: "desc" };
  if ( req.query.order_by === "admin_and_distance" ) {
    const floatLat = parseFloat( req.query.lat );
    const floatLng = parseFloat( req.query.lng );
    if ( ( !floatLat && floatLat !== 0 ) || ( !floatLng && floatLng !== 0 ) ) {
      const error = new Error( );
      error.custom_message = "Must provide `lat` and `lng";
      error.status = 422;
      throw error;
    }
    sort = [
      { admin_level: "asc" },
      {
        _geo_distance: {
          location: [parseFloat( req.query.lng ), parseFloat( req.query.lat )],
          unit: "km",
          order: "asc"
        }
      }
    ];
  }
  const body = {
    sort,
    query: {
      bool: {
        should: [
          { terms: { id: numericIDs } },
          { terms: { slug: ids } }
        ]
      }
    },
    size: req.query.per_page,
    _source: { includes: returnFields }
  };
  if ( req.query.admin_level ) {
    body.query.bool.filter = esClient.termFilter( "admin_level", req.query.admin_level );
    body.query.bool.minimum_should_match = 1;
  }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_places`,
    body
  } );
  return InaturalistAPI.basicResponse( req, response );
};

PlacesController.containing = async req => {
  InaturalistAPI.setPerPage( req, { default: 20, max: 100 } );
  const floatLat = parseFloat( req.query.lat );
  const floatLng = parseFloat( req.query.lng );
  if ( ( !floatLat && floatLat !== 0 ) || ( !floatLng && floatLng !== 0 ) ) {
    throw util.httpError( 422, "Must provide `lat` and `lng`" );
  }
  const filters = [
    { range: { bbox_area: { gt: 0 } } },
    {
      geo_shape: {
        geometry_geojson: {
          relation: "intersects",
          shape: {
            coordinates: [
              Number( req.query.lng ),
              Number( req.query.lat )
            ],
            type: "point"
          }
        }
      }
    }
  ];
  if ( !req.query.include_community_places ) {
    filters.push( { terms: { admin_level: [0, 1, 2, 10, 20] } } );
  }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_places`,
    body: {
      sort: [
        { admin_level: "asc" },
        {
          _geo_distance: {
            location: [parseFloat( req.query.lng ), parseFloat( req.query.lat )],
            unit: "km",
            order: "asc"
          }
        }
      ],
      query: {
        bool: {
          filter: filters
        }
      },
      _source: PlacesController.returnFields
    }
  } );
  return InaturalistAPI.basicResponse( req, response );
};

module.exports = {
  autocomplete: PlacesController.autocomplete,
  containing: PlacesController.containing,
  nearby: PlacesController.nearby,
  nearbyQuery: PlacesController.nearbyQuery,
  nearbyQueryBody: PlacesController.nearbyQueryBody,
  show: PlacesController.show
};
