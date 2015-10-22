var _ = require( "underscore" ),
    moment = require( "moment" ),
    elasticsearch = require( "elasticsearch" ),
    util = require( "./util" ),
    esClient = require( "./es_client" ),
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

InaturalistAPI.paramsToElasticQuery = function( params ) {
  var search_wheres = { };
  var extra_preloads = [ ];
  var search_filters = [ ];

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
    search_wheres.multi_match = {
      query: params.q, operator: "and", fields: fields };
  }

  // include the taxon plus all of its descendants.
  // Every taxon has its own ID in ancestor_ids
  if( params.taxon_id ) {
    search_wheres[ "taxon.ancestor_ids" ] = params.taxon_id;
  } else if( params.taxon_ids ) {
    search_wheres[ "taxon.ancestor_ids" ] = params.taxon_ids;
  }
  if( params.has && _.isArray( params.has ) ) {
    _.each( params.has, function( p ) {
      params[ p ] = true;
    });
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

  var created_on = params.created_on ? Date.parse( params.created_on ) : null;
  if( created_on ) {
    var created_date = new Date( created_on );
    search_wheres["created_at_details.day"] = created_date.getDate( );
    search_wheres["created_at_details.month"] = created_date.getMonth( ) + 1;
    search_wheres["created_at_details.year"] = created_date.getFullYear( );
  }
  if( params.project_id ) { search_wheres.project_ids = params.project_id; }
  else if( params.project_ids ) { search_wheres.project_ids = params.project_ids; }
  if( params.hrank || params.lrank ) {
    search_wheres.range = { "taxon.rank_level": {
      from: util.ranks[ params.lrank ] || 0,
      to: util.ranks[ params.hrank ] || 100 } };
  }
  if( params.quality_grade && params.quality_grade !== "any" ) {
    search_wheres.quality_grade = params.quality_grade;
  }
  if( params.identifications === "most_agree" ) {
    search_wheres.identifications_most_agree = true
  } else if( params.identifications === "some_agree" ) {
    search_wheres.identifications_some_agree = true
  } else if( params.identifications === "most_disagree" ) {
    search_wheres.identifications_most_disagree = true
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

  if( params.iconic_taxa && _.isArray( params.iconic_taxa ) ) {
    var includesUnknown = false;
    var iconicTaxonIDs = _.compact( _.map( params.iconic_taxa, function( t ) {
      if( t === "unknown" ) { includesUnknown = true; }
      return util.iconicTaxonIDsByName[ t.toLowerCase( ) ];
    }));
    if( includesUnknown ) {
      search_filters.push({ bool: { should: [
        { terms: { "taxon.iconic_taxon_id": iconicTaxonIDs } },
        { missing: { field: "taxon.iconic_taxon_id" } }
      ]}});
    } else {
      search_wheres["taxon.iconic_taxon_id"] = iconicTaxonIDs;
    }
  }

  if( params.viewer_id ) {
    if( params.reviewed === "true" ) {
      search_wheres.reviewed_by = params.viewer_id;
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

  if( params.not_in_project ) {
    search_filters.push( { not: {
      term: { project_ids: params.not_in_project }
    }});
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

  if( params.popular === "true" ) {
    search_filters.push({ range: { cached_votes_total: { gte: 1 } } });
  } else if( params.popular === "false" ) {
    search_filters.push({ term: { cached_votes_total: 0 } });
  }

  if( params.id_above ) {
    search_filters.push({ range: { id: { gt: params.id_above } } });
  }

  if( params.geoprivacy === "open" ) {
    search_filters.push({ not: { exists: { field: "geoprivacy" } } });
  } else if( params.geoprivacy === "obscured_private" ) {
    search_wheres.geoprivacy = [ "obscured", "private" ];
  } else if( params.geoprivacy && params.geoprivacy != "any" ) {
    search_wheres.geoprivacy = params.geoprivacy;
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

  return { where: search_wheres,
    filters: search_filters,
    per_page: params.per_page || 30,
    page: params.page || 1,
    sort: sort };
};

InaturalistAPI.observationsIndex = function( req, callback ) {
  InaturalistAPI.elasticResults( req, "observations", function( err, data ) {
    if( err ) { return callback( err ); }
    callback(null, {
      total_results: data.hits.total,
      page: parseInt( req.elastic_query.page ),
      per_page: parseInt( req.elastic_query.per_page ),
      results: _.map( data.hits.hits, function( h ) {
        return _.omit( h._source, "private_location", "private_geojson" );
      })
    });
  });
};

InaturalistAPI.taxaExact = function( req, callback ) {
  var q = req.query.q || req.query.term;
  if( !q || q.length < 2 ) { return callback( null, { }); }
  var search_wheres = { match: { "names.exact": { query: q } } };
  req.query.highlight = { fields: { "names.exact": { } } };
  if( util.is_ja( q ) ) {
    search_wheres = { multi_match: { query: q,
      fields: [ "names.name_ja^10", "names.exact" ] } };
    req.query.highlight.fields[ "names.name_ja" ] = { };
  }
  search_wheres.is_active = true;
  req.query.page = 1;
  req.query.sort = "_score";
  InaturalistAPI.taxaSearchQuery( req, search_wheres, callback )
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
    }
    var search_wheres = { match: { "names.name_autocomplete": {
      query: q, operator: "and" } } }
    req.query.highlight = { fields: { "names.name_autocomplete": { } } };
    if( util.is_ja( q ) ) {
      search_wheres = { multi_match: { query: q,
        fields: [ "names.name_autocomplete_ja^10", "names.name_autocomplete" ] } };
      req.query.highlight.fields[ "names.name_autocomplete_ja" ] = { };
    }
    search_wheres.is_active = is_active
    req.query.page = 1;
    req.query.sort = { observations_count: "desc" };
    InaturalistAPI.taxaSearchQuery( req, search_wheres, function( err, response ) {
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

InaturalistAPI.taxaSearchQuery = function( req, search_wheres, callback ) {
  var searchHash = {
    where: search_wheres,
    per_page: parseInt( req.query.per_page ) || 30,
    page: parseInt( req.query.page ) || 1,
    sort: req.query.sort || { observations_count: "desc" },
    highlight: req.query.highlight
  };
  req.elastic_query = esClient.searchHash( searchHash );
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: global.config.environment + "_taxa",
    body: req.elastic_query,
    _source: [ "id", "name", "names", "rank", "default_photo_url",
      "colors", "is_active", "observations_count", "iconic_taxon_id",
      "rank_level", "ancestor_name", "ancestor_rank" ]
  }, function( err, data ) {
    if( err ) { return callback( err ); }
    callback(null, {
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
module.exports = InaturalistAPI;
