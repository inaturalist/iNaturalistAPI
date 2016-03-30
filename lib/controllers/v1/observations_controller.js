var _ = require( "underscore" ),
    moment = require( "moment" ),
    querystring = require( "querystring" ),
    extend = require( "node.extend" ),
    observations = require( "inaturalistjs" ).observations,
    esClient = require( "../../es_client" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    Observation = require( "../../models/observation" ),
    Taxon = require( "../../models/taxon" ),
    TaxaController = require( "./taxa_controller" ),
    ObservationsController = { };

ObservationsController.create = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.create, req ).then( function( r ) {
    var arr = [ { observation_id: r['0'].id } ];
    var localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, function( ) {
      return callback( null, arr[0].observation );
    });
  }).catch( callback );
};

ObservationsController.update = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.update, req ).then( function( r ) {
    var arr = [ { observation_id: r['0'].id } ];
    var localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, function( ) {
      return callback( null, arr[0].observation );
    });
  }).catch( callback );
};

ObservationsController.delete = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.delete, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

ObservationsController.show = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity );
  // also preserve the ttl param
  req.query = { id: ids, ttl: req.query.ttl, locale: req.query.locale,
    preferred_place_id: req.query.preferred_place_id };
  ObservationsController.search( req, function( err, data ) {
    if( err ) { return callback( err ); }
    var localeOpts = util.localeOpts( req );
    Observation.preloadAllAssociations( data.results, localeOpts, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, data );
    });
  });
}

ObservationsController.search = function( req, callback ) {
  ObservationsController.resultsForRequest( req, function( err, data ) {
    if( err ) { return callback( err ); }
    var localeOpts = util.localeOpts( req );
    Observation.preloadTaxaAndUsers( data.results, localeOpts, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, data );
    });
  });
};

ObservationsController.elasticResults = function( req, index, callback ) {
  ObservationsController.reqToElasticQuery( req, function( err, query ) {
    req.elastic_query = query;
    if( req.query.aggs && _.isObject( req.query.aggs ) ) {
      req.elastic_query.aggs = req.query.aggs;
    }
    var searchHash = esClient.searchHash( req.elastic_query );
    searchHash._source = { excludes: [ "taxon.names" ] };
    esClient.connection.search({
      preference: global.config.elasticsearch.preference || "_local",
      index: ( process.env.NODE_ENV || global.config.environment ) + "_" + index,
      body: searchHash,
      searchType: ( searchHash.size === 0 ? "count" : null )
    }, callback );
  });
};

ObservationsController.reqToElasticQuery = function( req, callback ) {
  ObservationsController.reqToElasticQueryComponents( req, function( err, components ) {
    if( err ) { return callback( err ); }
    var elasticQuery = { where: components.search_wheres,
      filters: components.search_filters,
      inverse_filters: components.inverse_filters,
      per_page: ( req.query.per_page || req.query.per_page === 0) ?
        req.query.per_page : 30,
      page: req.query.page || 1,
      sort: components.sort
    };
    callback( null, elasticQuery );
  });
};

ObservationsController.applyProjectRules = function( req, callback ) {
  var params = _.extend( { }, req.query );
  // if given a project whose rules to apply, fetch those
  // rules and call this method again with the merged params
  if( req.inat && req.inat.apply_project_rules_for ) {
    req.inat.apply_project_rules_for.searchParams( function( err, rules ) {
      delete params.apply_project_rules_for;
      delete req.inat.apply_project_rules_for;
      params = _.extend( { }, params, rules );
      ObservationsController.reqToElasticQueryComponents(
        _.extend( { }, req, { query: params }), callback );
    });
  }
};

ObservationsController.applyInverseProjectRules = function( req, callback ) {
  var params = _.extend( { }, req.query );
  if( req.inat && req.inat.not_matching_project_rules_for ) {
    req.inat.not_matching_project_rules_for.searchParams( function( err, r ) {
      delete params.not_matching_project_rules_for;
      delete req.inat.not_matching_project_rules_for;
      ObservationsController.reqToElasticQueryComponents( _.extend( { }, req, { query: r }),
        function( err, components ) {
          if( err ) { return callback( err ); }
          params = _.extend( { }, params, { inverse_filters: components.search_filters } );
          ObservationsController.reqToElasticQueryComponents(
            _.extend( { }, req, { query: params }), callback );
        }
      );
    });
  }
};

ObservationsController.applyListTaxaFilters = function( req, callback ) {
  var params = _.extend( { }, req.query );
  // if given a list, fetch its taxon_ids and use those as params
  if( req.inat && req.inat.list ) {
    req.inat.list.taxonIDs( function( err, ids ) {
      delete params.list_id;
      delete req.inat.list;
      params.taxon_ids = params.taxon_ids || [ ];
      params.taxon_ids = params.taxon_ids.concat( ids );
      ObservationsController.reqToElasticQueryComponents(
        _.extend( { }, req, { query: params }), callback );
    });
  }
};

ObservationsController.reqToElasticQueryComponents = function( req, callback ) {
  if( req.inat && req.inat.apply_project_rules_for ) {
    return ObservationsController.applyProjectRules( req, callback );
  }
  if( req.inat && req.inat.not_matching_project_rules_for ) {
    return ObservationsController.applyInverseProjectRules( req, callback );
  }
  if( req.inat && req.inat.list ) {
    return ObservationsController.applyListTaxaFilters( req, callback );
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
  if( !_.isEmpty( params.user_id ) && !Number( params.user_id ) &&
      !_.isArray( params.user_id )) {
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
      gte: Taxon.ranks[ params.lrank ] || 0,
      lte: Taxon.ranks[ params.hrank ] || 100 } } });
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
      return Taxon.iconicTaxonID( n );
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
    search_wheres.push( ObservationsController.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if( params.csi ) {
    values = _.filter( _.map( util.paramArray( params.csi ), function( v ) {
      return util.iucnValues[ v.toLowerCase( ) ];
    }), _.identity );
    if( values.length > 0 ) {
      search_wheres.push( ObservationsController.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if( params.csa ) {
    values = _.map( util.paramArray( params.csa ), function( v ) {
      return v.toLowerCase( );
    });
    search_wheres.push( ObservationsController.conservationCondition( "authority", values, params ) );
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

  if( params.changed_since && params.changed_fields ) {
    var changedDate = moment.utc( params.changed_since ).parseZone( )
    if( changedDate && changedDate.isValid( ) ) {
      var nested_query = {
        nested: {
          path: "field_change_times",
          query: { filtered: { query: {
            bool: {
              must: [ { range: { "field_change_times.changed_at":
                { gte: changedDate.format( ) }}}],
              minimum_should_match: 1
            }
          }}}
        }
      }
      // one of these fields must have changed (and have that recorded by Rails)
      nested_query.nested.query.filtered.query.bool.should = [{
        terms: { "field_change_times.field_name":
          util.paramArray( params.changed_fields ) }
      }];
      if( params.change_project_id ) {
        // project curator ID must have changed for these projects
        nested_query.nested.query.filtered.query.bool.should.push({
          terms: { "field_change_times.project_id":
            util.paramArray( params.change_project_id ) }
        });
      }
      search_wheres.push( nested_query );
    }
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

ObservationsController.resultsForRequest = function( req, callback ) {
  ObservationsController.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var obs = _.map( data.hits.hits, function( h ) {
      return new Observation( h._source );
    });
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: data.hits.total,
      page: Number( req.elastic_query.page ),
      per_page: Number( req.elastic_query.per_page ),
      results: obs
    });
  });
};

ObservationsController.leafCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query, {
    per_page: 0,
    aggs: {
      ancestries: { terms: { field: "taxon.min_species_ancestry", size: 0 } }
  }});
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, "observations", function( err, data ) {
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

ObservationsController.speciesCounts = function( req, callback ) {
  ObservationsController.leafCounts( req, function( err, leafCounts ) {
    if( err ) { return callback( err ); }
    var totalResults = leafCounts.length;
    leafCounts = leafCounts.slice( 0, req.query.per_page || 500 )
    var leafCountObject = _.object( _.map( leafCounts, function( c ) {
      return [ c.taxon_id, { count: c.count } ];
    }));
    var filters = [ { terms: { id: _.keys( leafCountObject ) } } ];
    var searchReq = _.extend( { }, req, { query: { is_active : null, size: req.query.per_page || 500,
      locale: req.query.locale } });
    TaxaController.searchQuery( searchReq, null, filters, function( err, response ) {
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

ObservationsController.identifiers = function( req, callback ) {
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
  ObservationsController.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var buckets = _.map( data.aggregations.ids.top_identifiers.buckets, function( b ) {
      return { user_id: b.key, count: b.doc_count };
    });
    Observation.preloadUsers( _.flatten( buckets ), function( err ) {
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

ObservationsController.observers = function( req, callback ) {
  // depending on the sort order, need to call observers and species
  // counts, since they need separate queries. The second one to be
  // called with add a user_id filter so we can get the corresponding
  // count for all users from the results of the first query.
  if( req.query.order_by == "species_count" ) {
    ObservationsController.observationsSpeciesObserverCounts( req, function( err, speciesObservers ) {
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( speciesObservers );
      var spReq = _.extend( { }, req, { query: spQuery });
      ObservationsController.observationsObserverCounts( spReq, function( err, observers ) {
        ObservationsController.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  } else {
    ObservationsController.observationsObserverCounts( req, function( err, observers ) {
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( observers.counts );
      var spReq = _.extend( { }, req, { query: spQuery });
      ObservationsController.observationsSpeciesObserverCounts( spReq, function( err, speciesObservers ) {
        ObservationsController.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  }
};

ObservationsController.observationsObserversResponse = function( req, observers, speciesObservers, callback ) {
  // using the node.extend package for a deep clone to merge these objects
  var userIndexedCounts = extend( true, { }, observers.counts, speciesObservers );
  var orderField = ( req.query.order_by == "species_count" ) ?
    "species_count" : "observation_count";
  var userCounts = _.map( userIndexedCounts, function( counts ) {
    counts.observation_count = counts.observation_count || 0;
    counts.species_count = counts.species_count || 0;
    return counts;
  });
  Observation.preloadUsers( userCounts, function( err ) {
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: observers.total,
      page: 1,
      per_page: req.query.per_page || userCounts.length,
      results: _.sortBy( userCounts, function( b ) {
        return -1 * b[ orderField ];
      })
    });
  });
};

ObservationsController.observationsObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  var perPage = _.isArray( countQuery.user_id ) ?
    countQuery.user_id.length : req.query.per_page || 500;
  countQuery.aggs = {
    total_observers: { cardinality: { field: "user.id", precision_threshold: 10000 } },
    top_observers: { terms: { field: "user.id", size: perPage } }
  };
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var userIndexedCounts = _.object( _.map( data.aggregations.top_observers.buckets, function( b ) {
      return [ b.key, { user_id: b.key, observation_count: b.doc_count } ];
    }));
    callback( null, { total: data.aggregations.total_observers.value,
      counts: userIndexedCounts });
  });
};


ObservationsController.observationsSpeciesObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  countQuery.hrank = "species";
  countQuery.lrank = "subspecies";
  var perPage = _.isArray( countQuery.user_id ) ?
    countQuery.user_id.length : req.query.per_page || 500;
  countQuery.aggs = {
    user_taxa: {
      terms: {
        field: "user.id", size: perPage, order: { distinct_taxa: "desc" } },
      aggs: {
        distinct_taxa: {
          cardinality: {
            field: "taxon.min_species_ancestry", precision_threshold: 10000 }}}}};
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var userIndexedCounts = _.object( _.map( data.aggregations.user_taxa.buckets, function( b ) {
      return [ b.key, { user_id: b.key, species_count: b.distinct_taxa.value } ];
    }));
    callback( null, userIndexedCounts );
  });
};

ObservationsController.conservationCondition = function( esField, values, params ) {
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


module.exports = {
  create: ObservationsController.create,
  update: ObservationsController.update,
  delete: ObservationsController.delete,
  show: ObservationsController.show,
  search: ObservationsController.search,
  identifiers: ObservationsController.identifiers,
  observers: ObservationsController.observers,
  speciesCounts: ObservationsController.speciesCounts,
  reqToElasticQuery: ObservationsController.reqToElasticQuery
};
