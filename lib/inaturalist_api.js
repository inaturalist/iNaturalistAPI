var _ = require( "underscore" ),
    moment = require( "moment" ),
    elasticsearch = require( "elasticsearch" ),
    simplify = require( "simplify-geometry" ),
    util = require( "./util" ),
    esClient = require( "./es_client" ),
    User = require( "./models/user" ),
    InaturalistAPI = { };

var cachedTaxa = { };
InaturalistAPI.lookupTaxon = function( taxonID, callback ) {
  if( !_.isUndefined( cachedTaxa[ taxonID ] ) ) {
    return callback( null, cachedTaxa[ taxonID ] );
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_taxa",
    body: { query: { term: { id: taxonID } } }
  }, function( err, results ) {
    if( err ) { callback( err ); }
    else if( _.isUndefined( results.hits.hits[0] ) ) {
      cachedTaxa[ taxonID ] = null;
      callback( null, null );
    } else {
      cachedTaxa[ taxonID ] = results.hits.hits[0]._source;
      callback( null, cachedTaxa[ taxonID ] );
    }
  });
};

InaturalistAPI.elasticResults = function( req, index, callback ) {
  req.elastic_query = InaturalistAPI.paramsToElasticQuery( req.query );
  var searchHash = esClient.searchHash( req.elastic_query );
  util.debug( searchHash );
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_" + index,
    body: searchHash,
    searchType: ( searchHash.size === 0 ? "count" : null ),
  }, callback );
};

InaturalistAPI.defaultMapFields = function( ) {
  return [ "id", "location", "taxon.iconic_taxon_id", "captive",
    "quality_grade", "geoprivacy", "private_location" ];
};

InaturalistAPI.fetchIDs = function( req, indexName, callback ) {
  if( !req.params.id ) {
    return callback({ messsage: "ID missing", status: "400" });
  }
  if( !req.params.id.match(/^[0-9,]*[0-9]$/) ) {
    return callback({ messsage: "invalid ID", status: "400" });
  }
  var ids = _.filter( req.params.id.split(","), _.identity );
  if( ids.length > 50 ) {
    return callback({ messsage: "too many IDs", status: "400" });
  }

  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_" + indexName,
    body: {
      sort: { id: "desc" },
      query: {
        filtered: {
          filter: [ { terms: { id: ids } } ]
        }
      }
    }
  }, function( err, rsp ) {
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: rsp.hits.total,
      page: 1,
      per_page: Math.min( rsp.hits.total, 50 ),
      results: _.map( rsp.hits.hits, function( h ) {
        return _.omit( h._source, "private_location", "private_geojson" );
      })
    });
  });
};

InaturalistAPI.paramsToElasticQuery = function( p ) {
  var search_wheres = [ ];
  var extra_preloads = [ ];
  var search_filters = [ ];

  // clone the params object
  var params = _.extend( { }, p );
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
  var observed_on = observed_on_param ? Date.parse( observed_on_param ) : null;
  if( observed_on ) {
    var observed_date = new Date( observed_on );
    params.day = params.day || observed_date.getDate( );
    params.month = params.month || observed_date.getMonth( ) + 1;
    params.year = params.year || observed_date.getFullYear( );
  }

  _.each([ { http_param: "rank", es_field: "taxon.rank" },
    { http_param: "user_id", es_field: "user.id" },
    { http_param: "taxon_name", es_field: "taxon.names.name" },
    { http_param: "day", es_field: "observed_on_details.day" },
    { http_param: "month", es_field: "observed_on_details.month" },
    { http_param: "year", es_field: "observed_on_details.year" },
    { http_param: "week", es_field: "observed_on_details.week" },
    { http_param: "place_id", es_field: "place_ids" },
    { http_param: "site_id", es_field: "site_id" },
    { http_param: "license", es_field: "license_code" },
    { http_param: "photo_license", es_field: "photos.license_code" },
    { http_param: "sound_license", es_field: "sounds.license_code" }
  ], function( filter ) {
    if( params[ filter.http_param ] ) {
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
    { http_param: "verifiable", es_field: "verifiable" },
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

  var created_on = params.created_on ? Date.parse( params.created_on ) : null;
  if( created_on ) {
    var created_date = new Date( created_on );
    search_filters.push( esClient.termFilter(
      "created_at_details.day", created_date.getDate( ) ) );
    search_filters.push( esClient.termFilter(
      "created_at_details.month", created_date.getMonth( ) + 1 ) );
    search_filters.push( esClient.termFilter(
      "created_at_details.year", created_date.getFullYear( ) ) );
  }
  params.project_id = params.project_id || params.project_ids;
  if( params.project_id ) {
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

  if( params.d1 || params.d2 ) {
    var d1 = params.d1 ? moment.utc( Date.parse( params.d1 ) ) : null;
    var d2 = params.d2 ? moment.utc( Date.parse( params.d2 ) ) : null;
    if( d1 && !d1.isValid( ) ) { d1 = null; }
    if( d2 && !d2.isValid( ) ) { d2 = null; }
    if( d1 || d2 ) {
      d1 = d1 || moment.utc( Date.parse( "1800-01-01T00:00:00+00:00" ) );
      d2 = d2 || moment.utc( );
      search_filters.push({ or: [
        { and: [
          { range: { observed_on: {
            gte: d1.utc( ).format( ), lte: d2.format( ) } } },
          { exists: { field: "time_observed_at" } }
        ] },
        { and: [
          { range: { observed_on: {
            gte: d1.startOf( "day" ).format( ),
            lte: d2.endOf( "day" ).format( ) } } },
          { missing: { field: "time_observed_at" } }
        ] }
      ]});
    }
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
  _.each( params, function( v, k ) {
    // use a nested query to search within a single nested
    // object and not across all nested objects
    var matches = k.match( /^field:(.*)/ );
    if( _.isEmpty( matches ) ) { return; }
    var fieldName = matches[ 1 ];
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
  if( params.cs ) {
    var values = _.map( util.paramArray( params.cs ), function( v ) {
      return v.toLowerCase( );
    });
    search_wheres.push( InaturalistAPI.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if( params.csi ) {
    var values = _.filter( _.map( util.paramArray( params.csi ), function( v ) {
      return util.iucnValues[ v.toLowerCase( ) ];
    }), _.identity );
    if( values.length > 0 ) {
      search_wheres.push( InaturalistAPI.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if( params.csa ) {
    var values = _.map( util.paramArray( params.csa ), function( v ) {
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
      sort = { observed_on: sort_order };
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

  elasticQuery = { where: search_wheres,
    filters: search_filters,
    per_page: (params.per_page || params.per_page === 0) ? params.per_page : 30,
    page: params.page || 1,
    sort: sort };
  if( params.aggs && _.isObject( params.aggs ) ) {
    elasticQuery.aggs = params.aggs;
  }
  return elasticQuery;
};

InaturalistAPI.observationsIndex = function( req, callback ) {
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var users = _.object(_.uniq(_.map(data.hits.hits, function(h) { return [ h._source.user.id, { } ]; })));
    User.assignToObject( users, function( err ) {
      if( err ) { return callback( err ); }
      callback(null, {
        total_results: data.hits.total,
        page: parseInt( req.elastic_query.page ),
        per_page: parseInt( req.elastic_query.per_page ),
        results: _.map( data.hits.hits, function( h ) {
          if( h._source.user && h._source.user.id && users[ h._source.user.id ] ) {
            h._source.user = users[ h._source.user.id ].user;
          }
          return _.omit( h._source, "private_location", "private_geojson" );
        })
      });
    });
  });
};

InaturalistAPI.leafCounts = function( req, callback ) {
  req.query.per_page = 0;
  req.query.aggs = {
    ancestors: { terms: { field: "taxon.ancestor_ids", size: 0 } },
    taxa: { terms: { field: "taxon.id", size: 0 } }
  };
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    // make a hash of all ancestors and how many times they
    // are used. This will include the observations' direct taxa
    var ancestorCounts = _.object(
      _.map( data.aggregations.ancestors.buckets, function( bucket ) {
        return [ bucket.key, bucket.doc_count ];
      })
    );
    var taxonCounts = { };
    // remove the number of times they were direct taxa for an observation
    _.each( data.aggregations.taxa.buckets, function( bucket ) {
      taxonCounts[ bucket.key ] = bucket.doc_count;
      ancestorCounts[ bucket.key ] -= bucket.doc_count;
    });
    // any 'ancestor' now with a count of 0 has only ever been used directly,
    // not as an ancestor of another observation, i.e. leaf node
    leaves = _.pick( ancestorCounts, function( value, key ) {
      return value == 0;
    });
    var leafCounts = _.sortBy( _.map( leaves, function( v, k ) {
      return { taxon_id: k, count: taxonCounts[ k ] };
    }), function( o ) {
      return o.count * -1;
    });
    callback( null, leafCounts );
  });
};

InaturalistAPI.leafTaxaCounts = function( req, callback ) {
  InaturalistAPI.leafCounts( req, function( err, leafCounts ) {
    if( err ) { return callback( err ); }
    leafCounts = leafCounts.slice(0, 500)
    var leafCountObject = _.object( _.map( leafCounts, function( c ) {
      return [ c.taxon_id, { count: c.count } ];
    }));
    var filters = [ { terms: { id: _.keys( leafCountObject ) } } ];
    InaturalistAPI.taxaSearchQuery({ query: { is_active : null, size: 500 } }, null, filters, function( err, response ) {
      if( err ) { return callback( err ); }
      // insert the resulting taxa into the leafCountObject
      _.each( response.results, function( t ) {
        leafCountObject[ t.id ].taxon = t;
      });
      // remove any with missing taxa
      leafCountArray = _.reject( leafCountObject, function( lc ) {
        if( !lc.taxon ) {
          util.debug("Taxon missing")
        }
        return !lc.taxon;
      });
      // sort the results again by count descending
      callback( null, _.sortBy( leafCountArray, function( o ) {
        return -1 * o.count;
      }));
    });
  });
};

InaturalistAPI.leafCount = function( req, callback ) {
  InaturalistAPI.leafCounts( req, function( err, leafCounts ) {
    if( err ) { return callback( err ); }
    callback( null, { leaf_count: leafCounts.length } );
  });
};

InaturalistAPI.observationsStats = function( req, callback ) {
  req.query.per_page = 0;
  req.query.aggs = {
    observers: { cardinality: { field: "user.id", precision_threshold: 10000 } },
    identifiers: { cardinality: { field: "identifications.user.id", precision_threshold: 10000 } }
  };
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    callback(null, {
      observer_count: data.aggregations.observers.value,
      identifier_count: data.aggregations.identifiers.value
    });
  });
};

InaturalistAPI.observationsIdentifiers = function( req, callback ) {
  req.query.per_page = 0;
  req.query.aggs = { top_identifiers: { terms: {
    field: "identifications.user.id", size: 500 } } };
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var buckets = _.object( _.map( data.aggregations.top_identifiers.buckets, function( b ) {
      return [ b.key, { user: { id: b.key }, count: b.doc_count } ];
    }));
    User.assignToObject( buckets, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, _.sortBy( buckets, function( b ) {
        return -1 * b.count;
      }));
    });
  });
};

InaturalistAPI.observationsObservers = function( req, callback ) {
  req.query.per_page = 0;
  req.query.aggs = { top_observers: { terms: {
    field: "user.id", size: 500 } } };
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    var buckets = _.object( _.map( data.aggregations.top_observers.buckets, function( b ) {
      return [ b.key, { user: { id: b.key }, count: b.doc_count } ];
    }));
    User.assignToObject( buckets, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, _.sortBy( buckets, function( b ) {
        return -1 * b.count;
      }));
    });
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
  search_filters = [ esClient.termFilter( "is_active", true ) ];
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
  util.debug( req.elastic_query );
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_taxa",
    body: req.elastic_query,
    _source: [ "id", "name", "names", "rank", "default_photo_url",
      "medium_photo_url", "square_photo_url",
      "colors", "is_active", "observations_count", "iconic_taxon_id",
      "rank_level", "ancestor_name", "ancestor_rank" ]
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: data.hits.total,
      page: parseInt( searchHash.page ),
      per_page: parseInt( searchHash.per_page ),
      results: _.map( data.hits.hits, function( h ) {
        if( req.query.highlight && h.highlight ) {
          var highlighted = h.highlight[ _.keys( h.highlight)[0] ];
          h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
        }
        return h._source;
      })
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
  if( !( req.query.lat && req.query.lng ) ) { return callback( null, [ ] ); }
  var filters = [
    { exists: { field: "geometry_geojson" } },
    { exists: { field: "admin_level" } } ];
  if( req.query.min_area || req.query.max_area ) {
    var filter = { range: { bbox_area: { } } };
    if( req.query.min_area ) { filter.range.bbox_area.gte = req.query.min_area; }
    if( req.query.max_area ) { filter.range.bbox_area.lte = req.query.max_area; }
    filters.push( filter );
  }
  if( req.query.admin_level ) {
    filters.push( { range: { admin_level: { lte: req.query.admin_level } } } );
  }
  if( req.query.radius ) {
    if( req.query.radius > 100000000 ) { req.query.radius = 100000000; }
    filters.push({ geo_shape: {
      geometry_geojson: {
        shape: {
          type: "circle",
          radius: req.query.radius + "m",
          coordinates: [ parseFloat( req.query.lng ), parseFloat( req.query.lat ) ]
        }
      }
    }});
  }
  var body = {
    query: { filtered: { filter: {
     bool: { must: filters } } }
    },
    sort: {
      _geo_distance: {
        location: [ parseFloat( req.query.lng ), parseFloat( req.query.lat ) ],
        unit: "km",
        order: "asc"
      }
    },
    size: 8
  };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_places",
    body: body
  }, function( err, response ) {
    if( err ) { return callback( err ); }
    if( _.isUndefined( response.hits.hits[0] ) ) {
      return callback( null, [ ] );
    }
    var places = _.map( response.hits.hits, function( h ) { return h._source } );
    _.map( places, InaturalistAPI.simplifyPlace );
    callback( null, {
      total_results: response.hits.total,
      page: 1,
      per_page: 1,
      results: places
    });
  });
};

InaturalistAPI.placesShow = function( req, callback ) {
  InaturalistAPI.fetchIDs( req, "places", function( err, response ) {
    if( err ) { return callback( err ); }
    _.map( response.results, InaturalistAPI.simplifyPlace );
    callback( null, response );
  });
};

InaturalistAPI.simplifyPlace = function( place ) {
  if( place.geometry_geojson && place.geometry_geojson.coordinates ) {
    _.each( place.geometry_geojson.coordinates, function( arr, index ) {
      _.each( arr, function( arr2, index2 ) {
        place.geometry_geojson.coordinates[ index ][ index2 ] = simplify( arr2, 0.01 );
      });
    });
  }
}

module.exports = InaturalistAPI;
