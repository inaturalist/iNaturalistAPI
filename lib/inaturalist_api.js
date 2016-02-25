var _ = require( "underscore" ),
    moment = require( "moment" ),
    querystring = require( "querystring" ),
    extend = require( "node.extend" ),
    util = require( "./util" ),
    esClient = require( "./es_client" ),
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

  // JSON API routes
  var routes = require( "./routes" );
  app.get( "/", routes.index );
  app.get( "/swagger.json", routes.swaggerJSON );
  app.get( "/observations", routes.observations_index );
  app.get( "/observations/identifiers", routes.observations_identifiers );
  app.get( "/observations/observers", routes.observations_observers );
  app.get( "/observations/species_counts", routes.species_counts );
  app.get( "/observations/:id", routes.observations_show );
  app.get( "/taxa/autocomplete", routes.taxa_autocomplete );
  app.get( "/taxa/:id", routes.taxa_show );
  app.get( "/places/nearby", routes.places_nearby );
  app.get( "/places/:id", routes.places_show );

  return app;
};

InaturalistAPI.elasticResults = function( req, index, callback ) {
  InaturalistAPI.reqToElasticQuery( req, function( err, query ) {
    req.elastic_query = query;
    if( req.query.aggs && _.isObject( req.query.aggs ) ) {
      req.elastic_query.aggs = req.query.aggs;
    }
    var searchHash = esClient.searchHash( req.elastic_query );
    esClient.connection.search({
      preference: global.config.elasticsearch.preference || "_local",
      index: ( process.env.NODE_ENV || global.config.environment ) + "_" + index,
      body: searchHash,
      searchType: ( searchHash.size === 0 ? "count" : null )
    }, callback );
  });
};

InaturalistAPI.defaultMapFields = function( ) {
  return [ "id", "location", "taxon.iconic_taxon_id", "captive",
    "quality_grade", "geoprivacy", "private_location" ];
};

InaturalistAPI.methodValidationError = function( req ) {
  if( !req.params.id ) {
    return { messsage: "ID missing", status: "400" };
  }
  if( !req.params.id.match(/^[0-9,]*[0-9]$/) ) {
    return { messsage: "invalid ID", status: "400" };
  }
};

InaturalistAPI.applyProjectRules = function( req, callback ) {
  var params = _.extend( { }, req.query );
  // if given a project whose rules to apply, fetch those
  // rules and call this method again with the merged params
  if( req.inat && req.inat.apply_project_rules_for ) {
    req.inat.apply_project_rules_for.searchParams( function( err, rules ) {
      delete params.apply_project_rules_for;
      delete req.inat.apply_project_rules_for;
      params = _.extend( { }, params, rules );
      InaturalistAPI.reqToElasticQueryComponents(
        _.extend( { }, req, { query: params }), callback );
    });
  }
};

InaturalistAPI.applyInverseProjectRules = function( req, callback ) {
  var params = _.extend( { }, req.query );
  if( req.inat && req.inat.not_matching_project_rules_for ) {
    req.inat.not_matching_project_rules_for.searchParams( function( err, r ) {
      delete params.not_matching_project_rules_for;
      delete req.inat.not_matching_project_rules_for;
      InaturalistAPI.reqToElasticQueryComponents( _.extend( { }, req, { query: r }),
        function( err, components ) {
          if( err ) { return callback( err ); }
          params = _.extend( { }, params, { inverse_filters: components.search_filters } );
          InaturalistAPI.reqToElasticQueryComponents(
            _.extend( { }, req, { query: params }), callback );
        }
      );
    });
  }
};

InaturalistAPI.applyListTaxaFilters = function( req, callback ) {
  var params = _.extend( { }, req.query );
  // if given a list, fetch its taxon_ids and use those as params
  if( req.inat && req.inat.list ) {
    req.inat.list.taxonIDs( function( err, ids ) {
      delete params.list_id;
      delete req.inat.list;
      params.taxon_ids = params.taxon_ids || [ ];
      params.taxon_ids = params.taxon_ids.concat( ids );
      InaturalistAPI.reqToElasticQueryComponents(
        _.extend( { }, req, { query: params }), callback );
    });
  }
};

InaturalistAPI.reqToElasticQueryComponents = function( req, callback ) {
  if( req.inat && req.inat.apply_project_rules_for ) {
    return InaturalistAPI.applyProjectRules( req, callback );
  }
  if( req.inat && req.inat.not_matching_project_rules_for ) {
    return InaturalistAPI.applyInverseProjectRules( req, callback );
  }
  if( req.inat && req.inat.list ) {
    return InaturalistAPI.applyListTaxaFilters( req, callback );
  }
  var p = req.query;
  // clone the params object
  var params = _.extend( { }, p );
  var search_wheres = [ ];
  var search_filters = [ ];
  var inverse_filters = params.inverse_filters || [ ];

  if( params.has && _.isArray( params.has ) ) {
    _.each( params.has, function( p ) {
      params[ p ] = "true";
    });
  }
  if( params.q ) {
    var search_on = params.search_on;
    var fields;
    switch( search_on ) {
      case "names":
        fields = [ "taxon.names.name" ];
        break;
      case "tags":
        fields = [ "tags" ];
        break;
      case "description":
        fields = [ "description" ];
        break;
      case "place":
        fields = [ "place_guess" ];
        break;
      default:
        fields = [ "taxon.names.name", "tags", "description", "place_guess" ];
    }
    search_wheres.push({ multi_match: {
      query: params.q, operator: "and", fields: fields }});
  }

  var observed_on_param = params.observed_on || params.on;
  var observed_on = observed_on_param ? moment( observed_on_param ) : null;
  if( observed_on && observed_on.isValid( ) ) {
    observed_on.parseZone( );
    params.day = params.day || observed_on.date( );
    params.month = params.month || observed_on.month( ) + 1;
    params.year = params.year || observed_on.year( );
  }
  if( !_.isEmpty( params.user_id ) && !parseInt( params.user_id ) ) {
    params.user_login = params.user_id;
    delete params.user_id;
  }

  if( params.photo_license && !_.isArray( params.photo_license ) ) {
    params.photo_license = params.photo_license.toLowerCase( );
  }
  if( params.sound_license && !_.isArray( params.sound_license ) ) {
    params.sound_license = params.sound_license.toLowerCase( );
  }
  _.each([ { http_param: "rank", es_field: "taxon.rank" },
    { http_param: "user_id", es_field: "user.id" },
    { http_param: "user_login", es_field: "user.login" },
    { http_param: "taxon_name", es_field: "taxon.names.name" },
    { http_param: "day", es_field: "observed_on_details.day" },
    { http_param: "month", es_field: "observed_on_details.month" },
    { http_param: "year", es_field: "observed_on_details.year" },
    { http_param: "week", es_field: "observed_on_details.week" },
    { http_param: "place_id", es_field: "place_ids" },
    { http_param: "site_id", es_field: "site_id" },
    { http_param: "id", es_field: "id" },
    { http_param: "license", es_field: "license_code" },
    { http_param: "photo_license", es_field: "photos.license_code" },
    { http_param: "sound_license", es_field: "sounds.license_code" }
  ], function( filter ) {
    if( params[ filter.http_param ] && params[ filter.http_param ] != "any" ) {
      search_filters.push( esClient.termFilter(
        filter.es_field, params[ filter.http_param ] ) );
    }
  });

  _.each([ { http_param: "introduced", es_field: "taxon.introduced" },
    { http_param: "threatened", es_field: "taxon.threatened" },
    { http_param: "native", es_field: "taxon.native" },
    { http_param: "endemic", es_field: "taxon.endemic" },
    { http_param: "id_please", es_field: "id_please" },
    { http_param: "out_of_range", es_field: "out_of_range" },
    { http_param: "mappable", es_field: "mappable" },
    { http_param: "captive", es_field: "captive" }
  ], function( filter ) {
    if( params[ filter.http_param ] == "true" ) {
      search_filters.push( esClient.termFilter( filter.es_field, true ) );
    } else if( params[ filter.http_param ] == "false" ) {
      search_filters.push( esClient.termFilter( filter.es_field, false ) );
    }
  });

  _.each([ { http_param: "photos", es_field: "photos.url" },
    { http_param: "sounds", es_field: "sounds" },
    { http_param: "geo", es_field: "geojson" },
    { http_param: "identified", es_field: "taxon" }
  ], function( filter ) {
    var f = { exists: { field: filter.es_field } };
    if( params[ filter.http_param ] == "true" ) {
      search_filters.push( f );
    } else if( params[ filter.http_param ] == "false" ) {
      search_filters.push( { not: f } );
    }
  });

  // include the taxon plus all of its descendants.
  // Every taxon has its own ID in ancestor_ids
  if( params.taxon_id || params.taxon_ids ) {
    search_filters.push( esClient.termFilter(
      "taxon.ancestor_ids", params.taxon_id || params.taxon_ids ) );
  }

  if( params.verifiable == "true" ) {
    search_filters.push(
      esClient.termFilter( "quality_grade", [ "needs_id", "research" ] ) );
  } else if( params.verifiable == "false" ) {
    search_filters.push( { not: {
      terms: { quality_grade: [ "needs_id", "research" ] }
    }});
  }

  var created_on = params.created_on ? moment( params.created_on ) : null;
  if( created_on && created_on.isValid( ) ) {
    created_on.parseZone( );
    search_filters.push( esClient.termFilter(
      "created_at_details.day", created_on.date( ) ) );
    search_filters.push( esClient.termFilter(
      "created_at_details.month", created_on.month( ) + 1 ) );
    search_filters.push( esClient.termFilter(
      "created_at_details.year", created_on.year( ) ) );
  }
  params.project_id = params.project_id || params.project_ids;
  if( params.project_id && !( _.isArray( params.project_id ) && _.isEmpty( params.project_id ))) {
    search_filters.push( esClient.termFilter( "project_ids", params.project_id ) );
    if( params.pcid ) {
      if( params.pcid == "true" ) {
        search_filters.push( esClient.termFilter(
          "project_ids_with_curator_id", params.project_id ) );
      } else if( params.pcid == "false" ) {
        search_filters.push( esClient.termFilter(
          "project_ids_without_curator_id", params.project_id ) );
      }
    }
  } else if( params.pcid ) {
    if( params.pcid == "true" ) {
      search_filters.push({ exists: {
        field: "project_ids_with_curator_id" } });
    } else if( params.pcid == "false" ) {
      search_filters.push({ exists: {
        field: "project_ids_without_curator_id" } });
    }
  }
  if( params.not_in_project ) {
    search_filters.push( { not: {
      term: { project_ids: params.not_in_project }
    }});
  }
  if( params.hrank || params.lrank ) {
    search_filters.push({ range: { "taxon.rank_level": {
      gte: util.ranks[ params.lrank ] || 0,
      lte: util.ranks[ params.hrank ] || 100 } } });
  }
  if( params.quality_grade && params.quality_grade !== "any" ) {
    search_filters.push( esClient.termFilter(
      "quality_grade", params.quality_grade ) );
  }
  if( params.identifications === "most_agree" ) {
    search_filters.push( esClient.termFilter( "identifications_most_agree", true ) );
  } else if( params.identifications === "some_agree" ) {
    search_filters.push( esClient.termFilter( "identifications_some_agree", true ) );
  } else if( params.identifications === "most_disagree" ) {
    search_filters.push( esClient.termFilter( "identifications_most_disagree", true ) );
  }

  if( params.nelat || params.nelng || params.swlat || params.swlng ) {
    search_filters.push({ envelope: { geojson: {
      nelat: params.nelat, nelng: params.nelng,
      swlat: params.swlat, swlng: params.swlng } } });
  }

  if( params.lat && params.lng ) {
    search_filters.push({ geo_distance: {
      distance: ( params.radius || 10 ) + "km",
      location: { lat: params.lat, lon: params.lng }
    }});
  }

  if( params.iconic_taxa ) {
    var includesUnknown = false;
    var names = util.paramArray( params.iconic_taxa );
    var iconicTaxonIDs = _.compact( _.map( names, function( n ) {
      if( n === "unknown" ) { includesUnknown = true; }
      return util.iconicTaxonIDsByName[ n.toLowerCase( ) ];
    }));
    if( includesUnknown ) {
      search_filters.push({ bool: { should: [
        { terms: { "taxon.iconic_taxon_id": iconicTaxonIDs } },
        { missing: { field: "taxon.iconic_taxon_id" } }
      ]}});
    } else {
      search_filters.push( esClient.termFilter(
        "taxon.iconic_taxon_id", iconicTaxonIDs ) );
    }
  }

  if( params.viewer_id ) {
    if( params.reviewed === "true" ) {
      search_filters.push( esClient.termFilter(
        "reviewed_by", params.viewer_id ) );
    } else if( params.reviewed === "false" ) {
      search_filters.push( { not: {
        term: { reviewed_by: params.viewer_id }
      }});
    }
  }

  var drf;
  if(( drf = util.dateRangeFilter( "time_observed_at", params.d1, params.d2, "observed_on_details.date" ))) {
    search_filters.push( drf );
  }
  if(( drf = util.dateRangeFilter( "created_at", params.created_d1, params.created_d2 ))) {
    search_filters.push( drf );
  }

  if( params.featured_observation_id ) {
    search_filters.push( { not: {
      term: { id: params.featured_observation_id }
    }});
  }

  if( params.updated_since ) {
    var parsedDate = moment.utc( Date.parse( params.updated_since ) );
    if( parsedDate && parsedDate.isValid( ) ) {
      search_filters.push({ range: { updated_at: { gte: parsedDate.format( ) } } });
    }
  }
  // the default "extended" qs query parser for express is great
  // for many things, except when there are escaped brackets in
  // params keys (e.g. field:Origin%2B%5BIUCN%2BRed%2BList%5D)
  // using `querystring` here, which is the default express "simple"
  // query parser
  var simpleParsedParams = req._parsedUrl ? querystring.parse( req._parsedUrl.query ) : { };
  _.each( simpleParsedParams, function( v, k ) {
    // use a nested query to search within a single nested
    // object and not across all nested objects
    var matches = k.match( /^field:(.*)/ );
    if( _.isEmpty( matches ) ) { return; }
    // this and Rails will turn + and %20 into spaces
    var fieldName = matches[ 1 ].replace( /(%20|\+)/g, " ");
    var nested_query = {
      nested: {
        path: "ofvs",
        query: { bool: { must: [ { match: {
          "ofvs.name": fieldName } } ] }
        }
      }
    }
    if( v ) {
      nested_query.nested.query.bool.must.push({
        match: { "ofvs.value": v } });
    }
    search_wheres.push( nested_query );
  });
  // conservation status
  var values;
  if( params.cs ) {
    values = _.map( util.paramArray( params.cs ), function( v ) {
      return v.toLowerCase( );
    });
    search_wheres.push( InaturalistAPI.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if( params.csi ) {
    values = _.filter( _.map( util.paramArray( params.csi ), function( v ) {
      return util.iucnValues[ v.toLowerCase( ) ];
    }), _.identity );
    if( values.length > 0 ) {
      search_wheres.push( InaturalistAPI.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if( params.csa ) {
    values = _.map( util.paramArray( params.csa ), function( v ) {
      return v.toLowerCase( );
    });
    search_wheres.push( InaturalistAPI.conservationCondition( "authority", values, params ) );
  }

  if( params.popular === "true" ) {
    search_filters.push({ range: { cached_votes_total: { gte: 1 } } });
  } else if( params.popular === "false" ) {
    search_filters.push( esClient.termFilter( "cached_votes_total", 0 ) );
  }

  if( params.id_above ) {
    search_filters.push({ range: { id: { gt: params.id_above } } });
  }

  if( params.geoprivacy === "open" ) {
    search_filters.push({ not: { exists: { field: "geoprivacy" } } });
  } else if( params.geoprivacy === "obscured_private" ) {
    search_filters.push( esClient.termFilter( "geoprivacy", [ "obscured", "private" ] ) );
  } else if( params.geoprivacy && params.geoprivacy != "any" ) {
    search_filters.push( esClient.termFilter( "geoprivacy", params.geoprivacy ) );
  }

  // sort defaults to created at descending
  var sort_order = ( params.order || "desc" ).toLowerCase( );
  var sort;
  switch( params.order_by ) {
    case "observed_on":
      sort = {
        "observed_on_details.date": sort_order,
        time_observed_at: { order: sort_order, missing: (sort_order === "desc" ? "_last" : "_first") },
        created_at: sort_order };
      break;
    case "species_guess":
      sort = { species_guess: sort_order };
      break;
    case "votes":
      sort = { cached_votes_total: sort_order };
      break;
    case "id":
      sort = { id: sort_order };
      break;
    default:
      sort = { created_at: sort_order };
  }
  callback( null, {
    search_wheres: search_wheres,
    search_filters: search_filters,
    inverse_filters: inverse_filters,
    sort: sort
  });
};

InaturalistAPI.reqToElasticQuery = function( req, callback ) {
  InaturalistAPI.reqToElasticQueryComponents( req, function( err, components ) {
    if( err ) { return callback( err ); }
    var elasticQuery = { where: components.search_wheres,
      filters: components.search_filters,
      inverse_filters: components.inverse_filters,
      per_page: ( req.query.per_page || req.query.per_page === 0) ?
        req.query.per_page : 30,
      page: req.query.page || 1,
      sort: components.sort };
    callback( null, elasticQuery );
  });
};

InaturalistAPI.observationsIndex = function( req, callback ) {
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var users = _.object(_.uniq(_.map(data.hits.hits, function(h) {
      return [ h._source.user.id, { } ];
    })));
    User.assignToObject( users, function( err ) {
      if( err ) { return callback( err ); }
      callback(null, {
        total_results: data.hits.total,
        page: parseInt( req.elastic_query.page ),
        per_page: parseInt( req.elastic_query.per_page ),
        results: _.map( data.hits.hits, function( h ) {
          if( h._source.user && h._source.user.id && !_.isEmpty( users[ h._source.user.id ] ) ) {
            h._source.user = users[ h._source.user.id ].user;
          }
          // make sure the observation's taxon is ready
          h._source.taxon = new Taxon( h._source.taxon );
          h._source.taxon.prepareForResponse( InaturalistAPI.localeOpts( req ) );
          h._source.obscured = !!(h._source.geoprivacy === "obscured" || h._source.private_location);
          if( h._source.obscured ) {
            h._source = _.omit( h._source, "place_guess" );
          }
          return _.omit( h._source, "private_location", "private_geojson" );
        })
      });
    });
  });
};

InaturalistAPI.leafCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query, {
    per_page: 0,
    aggs: {
      ancestries: { terms: { field: "taxon.ancestry", size: 0 } }
  }});
  var countReq = _.extend( { }, req, { query: countQuery });
  InaturalistAPI.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var knownAncestors = { },
        possibleLeaves = { },
        ancestors, taxonID;
    _.each( data.aggregations.ancestries.buckets, function( bucket ) {
       ancestors = bucket.key.split(",");
       taxonID = ancestors.pop( );
       possibleLeaves[ taxonID ] = bucket.doc_count;
       _.each( ancestors, function( a ) {
         knownAncestors[ a ] = true;
       });
    });
    var taxonIDs = _.keys( possibleLeaves );
    _.each( taxonIDs, function( taxonID ) {
      if( knownAncestors[ taxonID ] ) {
        delete possibleLeaves[ taxonID ];
      }
    });
    var leafCounts = _.sortBy( _.map( possibleLeaves, function( v, k ) {
      return { taxon_id: k, count: v };
    }), function( o ) {
      return o.count * -1;
    });
    callback( null, leafCounts );
  });
};

InaturalistAPI.localeOpts = function( req ) {
  var localeOpts = { };
  if( req.query.locale ) { localeOpts.locale = req.query.locale; }
  localeOpts.locale = localeOpts.locale || "en";
  if( req.inat && req.inat.preferredPlace ) {
    localeOpts.preferredPlace = req.inat.preferredPlace;
  }
  if( req.inat && req.inat.place ) {
    localeOpts.place = req.inat.place;
  }
  return localeOpts;
};

InaturalistAPI.leafTaxaCounts = function( req, callback ) {
  InaturalistAPI.leafCounts( req, function( err, leafCounts ) {
    if( err ) { return callback( err ); }
    var totalResults = leafCounts.length;
    leafCounts = leafCounts.slice( 0, req.query.per_page || 500 )
    var leafCountObject = _.object( _.map( leafCounts, function( c ) {
      return [ c.taxon_id, { count: c.count } ];
    }));
    var filters = [ { terms: { id: _.keys( leafCountObject ) } } ];
    var searchReq = _.extend( { }, req, { query: { is_active : null, size: req.query.per_page || 500,
      locale: req.query.locale } });
    InaturalistAPI.taxaSearchQuery( searchReq, null, filters, function( err, response ) {
      if( err ) { return callback( err ); }
      // insert the resulting taxa into the leafCountObject
      _.each( response.results, function( tax ) {
        leafCountObject[ tax.id ].taxon = tax;
      });
      // remove any with missing taxa
      var leafCountArray = _.reject( leafCountObject, function( lc ) {
        if( !lc.taxon ) {
          util.debug( "Taxon missing" )
        }
        return !lc.taxon;
      });
      // sort the results again by count descending
      callback( null, {
        total_results: totalResults,
        page: 1,
        per_page: leafCountArray.length,
        results: _.sortBy( leafCountArray, function( o ) {
          return -1 * o.count;
        })
      });
    });
  });
};

InaturalistAPI.observationsIdentifiers = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  countQuery.aggs = {
    ids: {
      nested: { path: "non_owner_ids" },
      aggs: {
        identifiers: { cardinality: { field: "non_owner_ids.user.id", precision_threshold: 10000 } },
        top_identifiers: {
          terms: { field: "non_owner_ids.user.id", size: req.query.per_page || 500 }
        }
      }
    }
  };
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  InaturalistAPI.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var buckets = _.object( _.map( data.aggregations.ids.top_identifiers.buckets, function( b ) {
      return [ b.key, { user: { id: b.key }, count: b.doc_count } ];
    }));
    User.assignToObject( buckets, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: data.aggregations.ids.identifiers.value,
        page: 1,
        per_page: _.keys( buckets ).length,
        results: _.sortBy( buckets, function( b ) {
          return -1 * b.count;
        })
      });
    });
  });
};

InaturalistAPI.observationsObservers = function( req, callback ) {
  // depending on the sort order, need to call observers and species
  // counts, since they need separate queries. The second one to be
  // called with add a user_id filter so we can get the corresponding
  // count for all users from the results of the first query.
  if( req.query.order_by == "species_count" ) {
    InaturalistAPI.observationsSpeciesObserverCounts( req, function( err, speciesObservers ) {
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( speciesObservers );
      var spReq = _.extend( { }, req, { query: spQuery });
      InaturalistAPI.observationsObserverCounts( spReq, function( err, observers ) {
        InaturalistAPI.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  } else {
    InaturalistAPI.observationsObserverCounts( req, function( err, observers ) {
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( observers.counts );
      var spReq = _.extend( { }, req, { query: spQuery });
      InaturalistAPI.observationsSpeciesObserverCounts( spReq, function( err, speciesObservers ) {
        InaturalistAPI.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  }
};

InaturalistAPI.observationsObserversResponse = function( req, observers, speciesObservers, callback ) {
  // using the node.extend package for a deep clone to merge these objects
  var userIndexedCounts = extend( true, { }, observers.counts, speciesObservers );
  var orderField = ( req.query.order_by == "species_count" ) ?
    "species_count" : "observation_count";
  userIndexedCounts = _.mapObject( userIndexedCounts, function( counts ) {
    counts.observation_count = counts.observation_count || 0;
    counts.species_count = counts.species_count || 0;
    return counts;
  });
  User.assignToObject( userIndexedCounts, function( err ) {
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: observers.total,
      page: 1,
      per_page: req.query.per_page || _.keys( userIndexedCounts ).length,
      results: _.sortBy( userIndexedCounts, function( b ) {
        return -1 * b[ orderField ];
      })
    });
  });
};

InaturalistAPI.observationsObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  var perPage = _.isArray( countQuery.user_id ) ?
    countQuery.user_id.length : req.query.per_page || 500;
  countQuery.aggs = {
    total_observers: { cardinality: { field: "user.id", precision_threshold: 10000 } },
    top_observers: { terms: { field: "user.id", size: perPage } }
  };
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  InaturalistAPI.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var userIndexedCounts = _.object( _.map( data.aggregations.top_observers.buckets, function( b ) {
      return [ b.key, { observation_count: b.doc_count } ];
    }));
    callback( null, { total: data.aggregations.total_observers.value,
      counts: userIndexedCounts });
  });
};


InaturalistAPI.observationsSpeciesObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  countQuery.hrank = "species";
  countQuery.lrank = "species";
  var perPage = _.isArray( countQuery.user_id ) ?
    countQuery.user_id.length : req.query.per_page || 500;
  countQuery.aggs = {
    user_taxa: {
      terms: {
        field: "user.id", size: perPage, order: { distinct_taxa: "desc" } },
      aggs: {
        distinct_taxa: {
          cardinality: { field: "taxon.id", precision_threshold: 10000 } } } } };
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  InaturalistAPI.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var userIndexedCounts = _.object( _.map( data.aggregations.user_taxa.buckets, function( b ) {
      return [ b.key, { species_count: b.distinct_taxa.value } ];
    }));
    callback( null, userIndexedCounts );
  });
};

InaturalistAPI.taxaExact = function( req, callback ) {
  var q = req.query.q || req.query.term;
  if( !q || q.length < 2 ) { return callback( null, { }); }
  var search_wheres = [ { match: { "names.exact": { query: q } } } ];
  req.query.highlight = { fields: { "names.exact": { } } };
  if( util.is_ja( q ) ) {
    search_wheres.push({ multi_match: {
      query: q,
      fields: [ "names.name_ja^10", "names.exact" ] } });
    req.query.highlight.fields[ "names.name_ja" ] = { };
  }
  var is_active = true;
  if( req.query.is_active === "false" ) {
    is_active = false;
  } else if( req.query.is_active === "any" ) {
    is_active = null;
  }
  var search_filters = [ ];
  if( is_active !== null ) {
    search_filters.push( esClient.termFilter( "is_active", is_active ) );
  }
  req.query.page = 1;
  req.query.sort = "_score";
  InaturalistAPI.taxaSearchQuery( req, search_wheres, search_filters, callback )
};

InaturalistAPI.taxaAutocomplete = function( req, callback ) {
  // not sending the actual req, rather making a copy
  InaturalistAPI.taxaExact( { query: req.query }, function( err, exactResponse ) {
    var exactResult = ( exactResponse && exactResponse.results && exactResponse.results.length > 0 ) ?
      exactResponse.results[0] : null;
    var q = req.query.q || req.query.term;
    req.query.per_page = parseInt( req.query.per_page ) || 30;
    if( req.query.per_page < 1 || req.query.per_page > 30 ) {
      req.query.per_page = 30;
    }
    if( !q || q.length < 1 ) { return callback( null, { }); }
    var is_active = true;
    if( req.query.is_active === "false" ) {
      is_active = false;
    } else if( req.query.is_active === "any" ) {
      is_active = null;
    }
    var search_wheres = [ { match: { "names.name_autocomplete": {
      query: q, operator: "and" } } } ];
    var search_filters = [ ];
    req.query.highlight = { fields: { "names.name_autocomplete": { } } };
    if( util.is_ja( q ) ) {
      search_wheres.push({ multi_match: {
        query: q,
        fields: [ "names.name_autocomplete_ja^10", "names.name_autocomplete" ] } });
      req.query.highlight.fields[ "names.name_autocomplete_ja" ] = { };
    }
    if( is_active !== null ) {
      search_filters.push( esClient.termFilter( "is_active", is_active ) );
    }
    req.query.page = 1;
    req.query.sort = { observations_count: "desc" };
    InaturalistAPI.taxaSearchQuery( req, search_wheres, search_filters, function( err, response ) {
      if( err ) { return callback( err ); }
      if( response && response.results && exactResult ) {
        response.results = _.reject( response.results, function( r ) {
          return r.id == exactResult.id;
        });
        response.results.unshift( exactResult );
        if( response.total_results < response.results.length ) {
          response.total_results = response.results.length;
        }
      }
      callback( err, response );
    });
  });
};

InaturalistAPI.taxaSearchQuery = function( req, search_wheres, search_filters, callback ) {
  var searchHash = {
    where: search_wheres,
    filters: search_filters,
    size: parseInt( req.query.size ),
    per_page: parseInt( req.query.per_page ) || 30,
    page: parseInt( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };
  req.elastic_query = esClient.searchHash( searchHash );
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_taxa",
    body: req.elastic_query,
    _source: req._source || [ "id", "name", "names.name", "names.locale",
      "names.place_taxon_names", "rank", "default_photo",
      "colors", "is_active", "observations_count", "iconic_taxon_id",
      "rank_level", "ancestor_name", "ancestor_rank",
      "listed_taxa.place_id", "listed_taxa.establishment_means",
      "statuses.place_id", "statuses.iucn" ]
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    var taxa = _.map( data.hits.hits, function( h ) {
      if( req.query.highlight && h.highlight ) {
        var highlighted = h.highlight[ _.keys( h.highlight )[0] ];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      var t = new Taxon( h._source );
      t.prepareForResponse( InaturalistAPI.localeOpts( req ) );
      return t;
    });
    var places = _.uniq( _.compact( _.flatten( _.map( taxa, function( t ) {
      var place_ids = [ ];
      if( t.establishment_means && t.establishment_means.place_id ) {
        place_ids.push( t.establishment_means.place_id );
      }
      if( t.conservation_status && t.conservation_status.place_id ) {
        place_ids.push( t.conservation_status.place_id );
      }
      return place_ids;
    }))));
    places = _.object(places, _.map( places, function( ){ return { } } ));
    Place.assignToObject( places, function( ) {
      _.each( taxa, function( t ) {
        if( t.establishment_means && t.establishment_means.place_id ) {
          t.establishment_means.place = places[ t.establishment_means.place_id ];
          delete t.establishment_means.place_id;
        }
        if( t.conservation_status && t.conservation_status.place_id ) {
          t.conservation_status.place = places[ t.conservation_status.place_id ];
          delete t.conservation_status.place_id;
        }
      });
      callback( null, {
        total_results: data.hits.total,
        page: parseInt( searchHash.page ),
        per_page: parseInt( searchHash.per_page ),
        results: taxa
      });
    });
  });
};

InaturalistAPI.conservationCondition = function( esField, values, params ) {
  // use a nested query to search the specified fields
  var statusCondition = {
    nested: {
      path: "taxon.statuses",
      query: { filtered: { query: {
        bool: { must: [ ] }
      } } }
    }
  };
  var statusFilter = { terms: { } };
  statusFilter.terms[ "taxon.statuses." + esField ] = values;
  statusCondition.nested.query.filtered.query.bool.must.push( statusFilter );
  if( params.place_id ) {
    // if a place condition is specified, return all results
    // from the place(s) specified, or where place is NULL
    statusCondition.nested.query.filtered.filter = { bool: { should: [
      { terms: { "taxon.statuses.place_id": util.paramArray( params.place_id ) } },
      { missing: { field: "taxon.statuses.place_id" } }
    ] } };
  } else {
    // no place condition specified, so apply a `place is NULL` condition
    statusCondition.nested.query.filtered.filter = [
      { missing: { field: "taxon.statuses.place_id" } }
    ]
  }
  return statusCondition;
};

InaturalistAPI.placesNearby = function( req, callback ) {
  var placesQuery = _.extend( { }, req.query );
  // looking up standard places
  placesQuery.community = false;
  InaturalistAPI.placesNearbyQuery( { query: placesQuery },
    function( err, response ) {
      if( err ) { return callback( err ); }
      var standardPlaces = response.results || [ ];

      // looking up community places
      placesQuery = _.extend( { }, req.query );
      placesQuery.community = true;
      InaturalistAPI.placesNearbyQuery( { query: placesQuery },
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

InaturalistAPI.placesNearbyQueryBody = function( req ) {
  if( !( req.query.swlat && req.query.swlng &&
           req.query.nelat && req.query.nelng ) ) {
    return;
  }
  var filters = [
    { exists: { field: "geometry_geojson" } },
    { missing: { field: "user" } } ];
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
    _source: [ "id", "name", "display_name", "place_type", "admin_level",
      "bbox_area", "ancestor_place_ids", "geometry_geojson", "location" ],
    sort: sort,
    size: req.query.per_page
  };
  if( req.query.name ) {
    body.query.bool.must.push({
      match: { display_name_autocomplete: req.query.name } });
  }
  return body;
};


InaturalistAPI.placesNearbyQuery = function( req, callback ) {
  var body = InaturalistAPI.placesNearbyQueryBody( req );
  if( _.isUndefined( body ) ) { return callback( null, [ ] ); }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_places",
    body: body
  }, function( err, response ) {
    if( err ) { return callback( err ); }
    if( _.isUndefined( response.hits.hits[0] ) ) {
      return callback( null, [ ] );
    }
    var places = _.map( response.hits.hits, function( h ) { return h._source; });
    callback( null, {
      total_results: response.hits.total,
      page: 1,
      per_page: req.query.per_page || 12,
      results: places
    });
  });
};

InaturalistAPI.placesShow = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity );
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
      _source: [ "id", "name", "display_name", "place_type", "admin_level",
        "bbox_area", "ancestor_place_ids", "geometry_geojson",
        "location" ]
    }
  }, function( err, response ) {
    if( err ) { return callback( err ); }
    var places = _.map( response.hits.hits, function( h ) { return h._source; });
    callback( null, {
      total_results: response.hits.total,
      page: 1,
      per_page: Math.min( response.hits.total, 50 ),
      results: places
    });
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
        return callback({ message: "Unknown "+ paramKey +" "+ req.query[ paramKey ], status: 422 });
      }
      callback( null, obj );
    });
  } else { callback( ); }
};

module.exports = InaturalistAPI;
