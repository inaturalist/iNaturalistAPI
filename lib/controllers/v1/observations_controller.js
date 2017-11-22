"use strict";
var _ = require( "underscore" ),
    moment = require( "moment" ),
    querystring = require( "querystring" ),
    extend = require( "node.extend" ),
    squel = require( "squel" ),
    observations = require( "inaturalistjs" ).observations,
    esClient = require( "../../es_client" ),
    pgClient = require( "../../pg_client" ),
    ESModel = require( "../../models/es_model" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    TaxaController = require( "./taxa_controller" ),
    ControlledTerm = require( "../../models/controlled_term" ),
    Observation = require( "../../models/observation" ),
    Taxon = require( "../../models/taxon" ),
    Comment = require( "../../models/comment" ),
    User = require( "../../models/user" ),
    Identification = require( "../../models/identification" ),
    UpdateAction = require( "../../models/update_action" ),
    ObservationsController = { },
    parsedDate;

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

ObservationsController.fave = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.fave, req  ).then( function( ) {
    var arr = [ { observation_id: req.params.id } ];
    var localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, function( ) {
      return callback( null, arr[0].observation );
    });
  }).catch( callback );
};

ObservationsController.unfave = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.unfave, req  ).then( function( ) {
    var arr = [ { observation_id: req.params.id } ];
    var localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, function( ) {
      return callback( null, arr[0].observation );
    });
  }).catch( callback );
};

ObservationsController.review = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.review, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

ObservationsController.unreview = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.unreview, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

ObservationsController.setQualityMetric = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.setQualityMetric, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

ObservationsController.deleteQualityMetric = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.deleteQualityMetric, req  ).then( function( r ) {
    return callback( null, r );
  }).catch( callback );
};

ObservationsController.subscribe = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.subscribe, req  ).then( function( ) {
    callback( null, true );
  }).catch( callback );
};

ObservationsController.taxonSummary = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.taxonSummary, req  ).then( function( r ) {
    callback( null, r );
  }).catch( callback );
};

ObservationsController.viewedUpdates = function( req, callback ) {
  InaturalistAPI.iNatJSWrap( observations.viewedUpdates, req  ).then( function( r ) {
    callback( null, r );
  }).catch( callback );
};

ObservationsController.show = function( req, callback ) {
  var ids = _.filter( req.params.id.split(","), _.identity ).slice( 0, 200 );
  // also preserve the ttl and locale params
  req.query = { id: ids, ttl: req.query.ttl, locale: req.query.locale,
    preferred_place_id: req.query.preferred_place_id, details: "all", per_page: ids.length };
  ObservationsController.search( req, callback );
}

ObservationsController.search = function( req, callback ) {
  if ( req.query.return_bounds === "true" ) {
    req.query.aggs = {
      bbox: {
        geo_bounds: {
          field: "location"
        }
      }
    };
  }
  ObservationsController.resultsForRequest( req, function( err, data ) {
    if( err ) { return callback( err ); }
    var localeOpts = util.localeOpts( req );
    let preloadCallback;
    if( req.query.details === "all" ) {
      preloadCallback = Observation.preloadAllAssociations;
    } else {
      preloadCallback = Observation.preloadMinimal;
    }
    preloadCallback( data.results, localeOpts, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, data );
    });
  });
};

ObservationsController.elasticResults = function( req, callback ) {
  ObservationsController.reqToElasticQuery( req, function( err, query ) {
    if( err ) { return callback( err ); }
    var opts = { excludes: [ "taxon.names", "taxon.photos", "taxon.taxon_photos" ] };
    ESModel.elasticResults( req, query, "observations", opts, callback );
  });
};

ObservationsController.reqToElasticQuery = function( req, callback ) {
  ObservationsController.reqToElasticQueryComponents( req, function( err, components ) {
    if( err ) { return callback( err ); }
    var elasticQuery = {
      where: components.search_wheres,
      filters: components.search_filters,
      inverse_filters: components.inverse_filters,
      grouped_inverse_filters: components.grouped_inverse_filters,
      per_page: InaturalistAPI.perPage( req, { default: 30, max: 200 } ),
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
  req.inat.apply_project_rules_for.searchParams( function( err, rules ) {
    delete params.apply_project_rules_for;
    delete req.inat.apply_project_rules_for;
    params = _.extend( { }, params, rules );
    ObservationsController.reqToElasticQueryComponents(
      _.extend( { }, req, { query: params }), callback );
  });
};

ObservationsController.applyInverseProjectRules = function( req, callback ) {
  var params = _.extend( { }, req.query );
  req.inat.not_matching_project_rules_for.searchParams( function( err, r ) {
    delete params.not_matching_project_rules_for;
    delete req.inat.not_matching_project_rules_for;
    ObservationsController.reqToElasticQueryComponents( _.extend( { }, req, { query: r }),
      function( err, components ) {
        if( err ) { return callback( err ); }
        params = _.extend( { }, params, { grouped_inverse_filters: components.search_filters } );
        ObservationsController.reqToElasticQueryComponents(
          _.extend( { }, req, { query: params }), callback );
      }
    );
  });
};

ObservationsController.applyListTaxaFilters = function( req, callback ) {
  var params = _.extend( { }, req.query );
  // if given a list, fetch its taxon_ids and use those as params
  req.inat.list.taxonIDs( function( err, ids ) {
    delete params.list_id;
    delete req.inat.list;
    params.taxon_ids = params.taxon_ids || [ ];
    params.taxon_ids = params.taxon_ids.concat( ids );
    ObservationsController.reqToElasticQueryComponents(
      _.extend( { }, req, { query: params }), callback );
  });
};

ObservationsController.applyUnobservedByUserFilters = function( req, callback ) {
  // if given a list, fetch its taxon_ids and use those as params
  var observedReq = {
    query: {
      user_id: req.inat.unobservedByUser.id,
      hrank: "species",
      per_page: 10000
    }
  };
  // preserve the taxon_id and without_taxon_id for faster queries, and
  // ignore the rest so we have a complete species list for the user
  if( req.query.taxon_id ) {
    observedReq.query.taxon_id = req.query.taxon_id;
  }
  if( req.query.without_taxon_id ) {
    observedReq.query.without_taxon_id = req.query.without_taxon_id;
  }
  ObservationsController.leafCounts( observedReq, ( err, taxonCounts ) => {
    if( err ) { return callback( err ); }
    var withoutTaxonIDs = _.map( taxonCounts, c => c.taxon_id );
    if( req.query.without_taxon_id ) {
      // combining with without_taxon_id parameter
      withoutTaxonIDs =
        withoutTaxonIDs.concat( util.paramArray( req.query.without_taxon_id ) );
    }
    var params = _.extend( { }, req.query );
    delete params.unobserved_by_user_id;
    delete req.inat.unobservedByUser;
    params.without_taxon_id = withoutTaxonIDs;
    ObservationsController.reqToElasticQueryComponents(
      _.extend( { }, req, { query: params }), callback );
  });
};

ObservationsController.histogram = function( req, callback ) {
  req.query.date_field = InaturalistAPI.setDefaultParamValue(
    req.query.date_field, "observed", { enum: [ "created", "observed" ] } );
  req.query.interval = InaturalistAPI.setDefaultParamValue(
    req.query.interval, "month_of_year", { enum:
      [ "year", "month", "week", "day", "hour",
        "month_of_year", "week_of_year" ] } );
  var interval = req.query.interval.replace( /_of_(month|year)/, "" );
  var grouped = req.query.interval.match( /_of_/ );
  var queryField = ( req.query.date_field === "created" ) ? "created_at" : "observed_on";
  var dateLimitField = ( req.query.date_field === "created" ) ? "created_d1" : "d1";
  var countQuery = _.extend( { }, req.query );
  // set a reasonable starting date to limit the number of buckets
  if( !grouped && !countQuery[ dateLimitField ] ) {
    if( interval === "year" || interval === "month" ) {
      countQuery[ dateLimitField ] = moment( ).subtract( 100, "years" ).format( );
    } else if( interval === "week" ) {
      countQuery[ dateLimitField ] = moment( ).subtract( 10, "years" ).format( );
    } else if( interval === "day" ) {
      countQuery[ dateLimitField ] = moment( ).subtract( 1, "years" ).format( );
    } else if( interval === "hour" ) {
      countQuery[ dateLimitField ] = moment( ).subtract( 1, "week" ).format( );
    }
  }
  if( grouped ) {
    // use the $DATE$_details field containing pre-calculated date parts
    countQuery.aggs = {
      histogram: { terms: { field: `${queryField}_details.${interval}`, size: 5000 } }
    };
  } else {
    // use the ES date_histogram aggregation on raw date types
    countQuery.aggs = {
      histogram: {
        date_histogram: {
          field: queryField,
          interval: interval,
          format: ( interval === "hour" ) ? "yyyy-MM-dd'T'HH:mm:ss'Z'" : "yyyy-MM-dd"
        }
      }
    };
  }
  // return nothing but aggregations
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    var resultOptions = { };
    // fill in 0's for any values without hits, which date_histogram does automatically
    if( req.query.interval === "month_of_year" ) {
      resultOptions.backfill = { min: 1, max: 12 };
    } else if( req.query.interval === "week_of_year" ) {
      resultOptions.backfill = { min: 1, max: 53 };
    }
    var results = { };
    results[ req.query.interval ] =
      util.aggBucketsToHash( data.aggregations.histogram.buckets, resultOptions );
    callback( null, {
      total_results: _.size( results[ req.query.interval ] ),
      page: 1,
      per_page: _.size( results[ req.query.interval ] ),
      results: results
    });
  });
};

ObservationsController.reqToElasticQueryComponents = function( req, callback ) {
  if( req.inat ) {
    if( req.inat.apply_project_rules_for ) {
      return ObservationsController.applyProjectRules( req, callback );
    }
    if( req.inat.not_matching_project_rules_for ) {
      return ObservationsController.applyInverseProjectRules( req, callback );
    }
    if( req.inat.list ) {
      return ObservationsController.applyListTaxaFilters( req, callback );
    }
    if( req.inat.unobservedByUser ) {
      return ObservationsController.applyUnobservedByUserFilters( req, callback );
    }
  }
  var p = req.query;
  // clone the params object
  var params = _.extend( { }, p );
  var search_filters = [ ];
  var inverse_filters = params.inverse_filters || [ ];
  var grouped_inverse_filters = params.grouped_inverse_filters || [ ];

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
    search_filters.push({ multi_match: {
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
      inverse_filters.push( f );
    }
  });

  // include the taxon plus all of its descendants.
  // Every taxon has its own ID in ancestor_ids
  if( params.taxon_id || params.taxon_ids ) {
    search_filters.push( esClient.termFilter(
      "taxon.ancestor_ids", params.taxon_id || params.taxon_ids ) );
  }

  if( params.without_taxon_id ) {
    inverse_filters.push( { terms: {
      "taxon.ancestor_ids": util.paramArray( params.without_taxon_id ) } });
  }

  if( params.not_id ) {
    inverse_filters.push( {
      terms: { id: util.paramArray( params.not_id ) }
    });
  }

  if( params.verifiable == "true" ) {
    search_filters.push(
      esClient.termFilter( "quality_grade", [ "needs_id", "research" ] ) );
  } else if( params.verifiable == "false" ) {
    inverse_filters.push( { terms: { quality_grade: [ "needs_id", "research" ] } });
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
    inverse_filters.push( { term: { project_ids: params.not_in_project } } );
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
        { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" } } } }
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
      inverse_filters.push( {  term: { reviewed_by: params.viewer_id } } );
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
    inverse_filters.push( { term: { id: params.featured_observation_id } });
  }

  if( params.updated_since ) {
    parsedDate = moment.utc( Date.parse( params.updated_since ) );
    if( parsedDate && parsedDate.isValid( ) ) {
      search_filters.push({ range: { updated_at: { gte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } } });
    }
  }

  if( params.observed_before ) {
    parsedDate = moment.utc( Date.parse( params.observed_before ) );
    if( parsedDate && parsedDate.isValid( ) ) {
      search_filters.push({ range: { observed_on: { lte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } } });
    }
  }

  if( params.observed_after ) {
    parsedDate = moment.utc( Date.parse( params.observed_after ) );
    if( parsedDate && parsedDate.isValid( ) ) {
      search_filters.push({ range: { observed_on: { gte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } } });
    }
  }

  var nested_query;

  if ( params.ident_user_id ) {
    const vals = util.paramArray( params.ident_user_id );
    let termFilter;
    if ( Number( vals[0] ) ) {
      termFilter = esClient.termFilter( "identifications.user.id", params.ident_user_id );
    } else {
      termFilter = esClient.termFilter( "identifications.user.login", params.ident_user_id );
    }
    search_filters.push( {
      nested: {
        path: "identifications",
        query: {
          bool: {
            filter: termFilter
          }
        }
      }
    } );
  }

  if( params.term_id ) {
    nested_query = {
      nested: {
        path: "annotations",
        query: { bool: { filter: [
          { term: { "annotations.controlled_attribute_id": params.term_id } },
          { range: { "annotations.vote_score": { gte: 0 } } }
        ] } }
      }
    }
    if( params.term_value_id ) {
      nested_query.nested.query.bool.filter.push({
        term: { "annotations.controlled_value_id": params.term_value_id } });
    }
    search_filters.push( nested_query );
    if ( params.without_term_value_id ) {
      inverse_filters.push( {
        nested: {
          path: "annotations",
          query: {
            bool: {
              filter: [
                { term: { "annotations.controlled_attribute_id": params.term_id } },
                { term: { "annotations.controlled_value_id": params.without_term_value_id } }
              ]
            }
          }
        }
      } );
    }
  } else if( params.annotation_min_score || params.annotation_min_score === 0 ) {
    nested_query = {
      nested: {
        path: "annotations",
        query: { bool: { filter: [
          { range: { "annotations.vote_score": { gte: params.annotation_min_score } } }
        ] } }
      }
    }
    search_filters.push( nested_query );
  } else if( params.without_term_id ) {
    nested_query = {
      nested: {
        path: "annotations",
        query: { bool: { filter: [
          { term: { "annotations.controlled_attribute_id": params.without_term_id } }
        ] } }
      }
    }
    inverse_filters.push( nested_query );
  }

  if (
    req.userSession &&
    req.userSession.blocks &&
    !req.params.id
  ) {
    let usersToFilter = req.userSession.blocks.blockedUsers;
    if ( params.user_id ) {
      usersToFilter = _.filter( usersToFilter, u => u.id !== params.user_id )
    }
    if ( params.user_login ) {
      usersToFilter = _.filter( usersToFilter, u => u.login !== params.user_login )
    }
    usersToFilter = usersToFilter.concat( req.userSession.blocks.blockedByUsers );
    inverse_filters.push(
      esClient.termFilter( "user.id", usersToFilter.map( u => u.id ) )
    );
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
    nested_query = {
      nested: {
        path: "ofvs",
        query: { bool: { filter: [ { match: {
          "ofvs.name_ci": fieldName } } ] }
        }
      }
    }
    if( v ) {
      nested_query.nested.query.bool.filter.push({
        match: { "ofvs.value_ci": v } });
    }
    search_filters.push( nested_query );
  });
  // conservation status
  var values;
  if( params.cs ) {
    values = _.map( util.paramArray( params.cs ), function( v ) {
      return v.toLowerCase( );
    });
    search_filters.push( ObservationsController.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if( params.csi ) {
    values = _.filter( _.map( util.paramArray( params.csi ), function( v ) {
      return util.iucnValues[ v.toLowerCase( ) ];
    }), _.identity );
    if( values.length > 0 ) {
      search_filters.push( ObservationsController.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if( params.csa ) {
    values = _.map( util.paramArray( params.csa ), function( v ) {
      return v.toLowerCase( );
    });
    search_filters.push( ObservationsController.conservationCondition( "authority", values, params ) );
  }

  if( params.popular === "true" ) {
    search_filters.push({ range: { cached_votes_total: { gte: 1 } } });
  } else if( params.popular === "false" ) {
    search_filters.push( esClient.termFilter( "cached_votes_total", 0 ) );
  }

  if( params.id_above ) {
    search_filters.push({ range: { id: { gt: params.id_above } } });
  }
  if( params.id_below ) {
    search_filters.push({ range: { id: { lt: params.id_below } } });
  }

  if( params.geoprivacy === "open" ) {
    inverse_filters.push({ exists: { field: "geoprivacy" } });
  } else if( params.geoprivacy === "obscured_private" ) {
    search_filters.push( esClient.termFilter( "geoprivacy", [ "obscured", "private" ] ) );
  } else if( params.geoprivacy && params.geoprivacy != "any" ) {
    search_filters.push( esClient.termFilter( "geoprivacy", params.geoprivacy ) );
  }

  if( params.changed_since ) {
    var changedDate = moment.utc( params.changed_since ).parseZone( )
    if( changedDate && changedDate.isValid( ) ) {
      nested_query = {
        nested: {
          path: "field_change_times",
          query: {
            bool: {
              filter: [ { range: { "field_change_times.changed_at":
                { gte: changedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) }}}]
            }
          }
        }
      }
      if( params.changed_fields ) {
        // one of these fields must have changed (and recorded by Rails)
        nested_query.nested.query.bool.filter.push({
          terms: { "field_change_times.field_name":
            util.paramArray( params.changed_fields ) }
        });
      }
      if( params.change_project_id ) {
        // if there's a project_id, but must be this one
        nested_query.nested.query.bool.filter.push({
          or: [
            { terms: { "field_change_times.project_id":
              util.paramArray( params.change_project_id ) } },
            { not: { exists: { field: "field_change_times.project_id" } } }
          ]
        });
      }
      search_filters.push( nested_query );
    }
  }

  if( params.not_in_place ) {
    inverse_filters.push({ terms: {
      place_ids: util.paramArray( params.not_in_place ) } });
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
    case "random":
      sort = "random"; // handle in esClient.searchHash
      break;
    case "updated_at":
      sort = { updated_at: sort_order };
      break;
    default:
      sort = { created_at: sort_order };
  }
  callback( null, {
    search_filters: search_filters,
    inverse_filters: inverse_filters,
    grouped_inverse_filters: grouped_inverse_filters,
    sort: sort
  });
};

ObservationsController.prepareElasticDataForReponse = function( data, req, callback ) {
  var obs = _.map( data.hits.hits, function( h ) {
    return new Observation( h._source, { userSession: req.userSession } );
  });
  var response = { total_results: data.hits.total };
  if (
    data.aggregations &&
    data.aggregations.bbox &&
    data.aggregations.bbox.bounds &&
    data.aggregations.bbox.bounds.bottom_right
  ) {
    response.total_bounds = {
      swlat: data.aggregations.bbox.bounds.bottom_right.lat,
      swlng: data.aggregations.bbox.bounds.top_left.lon,
      nelat: data.aggregations.bbox.bounds.top_left.lat,
      nelng: data.aggregations.bbox.bounds.bottom_right.lon
    };
  }
  response.page = Number( req.elastic_query.page );
  response.per_page = Number( req.elastic_query.per_page );
  response.results = obs;
  callback( null, response );
}

ObservationsController.resultsForRequest = function( req, callback ) {
  ObservationsController.elasticResults( req, function( err, data ) {
    if( err ) { return callback( err ); }
    ObservationsController.prepareElasticDataForReponse( data, req, callback );
  });
};

ObservationsController.leafCounts = function( req, callback ) {
  ESModel.ancestriesSpeciesCounts( req, "taxon.min_species_ancestry",
    ObservationsController.elasticResults, callback );
};

ObservationsController.speciesCounts = function( req, callback ) {
  ObservationsController.leafCounts( req, ( err, leafCounts ) => {
    if( err ) { return callback( err ); }
    TaxaController.speciesCountsResponse( req, leafCounts, { }, callback );
  });
};

ObservationsController.iconicTaxaCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  countQuery.aggs = {
    iconic_taxa: {
      terms: { field: "taxon.iconic_taxon_id" }
    }
  };
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    var buckets = _.map( data.aggregations.iconic_taxa.buckets, function( b ) {
      return { taxon_id: b.key, count: b.doc_count };
    });
    var localeOpts = util.localeOpts( req );
    var prepareTaxon = function( t ) {
      t.prepareForResponse( localeOpts );
    }
    var taxonOpts = { modifier: prepareTaxon,
      source: { excludes: [ "photos", "taxon_photos" ] } };
    ESModel.fetchBelongsTo( buckets, Taxon, taxonOpts, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: buckets.length,
        page: 1,
        per_page: buckets.length,
        results: _.sortBy( buckets, function( b ) {
          return -1 * b.count;
        })
      });
    });
  });
};

ObservationsController.iconicTaxaSpeciesCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query, {
    per_page: 0,
    aggs: {
      iconic_taxa: {
        terms: { field: "taxon.iconic_taxon_id" },
        aggs: {
          ancestries: { terms: { field: "taxon.min_species_ancestry", size: 150000 } }
        }
      }
  }});
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    var iconicTaxonLeafCounts = [ ];
    _.each( data.aggregations.iconic_taxa.buckets, b => {
      var iconicTaxonID = b.key;
      var knownAncestors = { },
          possibleLeaves = { },
          ancestors, taxonID;
      _.each( b.ancestries.buckets, bb => {
         ancestors = bb.key.split(",");
         taxonID = ancestors.pop( );
         possibleLeaves[ taxonID ] = bb.doc_count;
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
      iconicTaxonLeafCounts.push( { taxon_id: iconicTaxonID, count: leafCounts.length } );
    } );

    var localeOpts = util.localeOpts( req );
    var prepareTaxon = function( t ) {
      t.prepareForResponse( localeOpts );
    }
    var taxonOpts = { modifier: prepareTaxon,
      source: { excludes: [ "photos", "taxon_photos" ] } };
    var ESModel = require( "../../models/es_model" );
    ESModel.fetchBelongsTo( iconicTaxonLeafCounts, Taxon, taxonOpts, function( err ) {
      if( err ) { return callback( err ); }
      callback( null, {
        total_results: iconicTaxonLeafCounts.length,
        page: 1,
        per_page: iconicTaxonLeafCounts.length,
        results: _.sortBy( iconicTaxonLeafCounts, function( b ) {
          return -1 * b.count;
        })
      });
    });
  });
};

ObservationsController.identifiers = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  const paginationOptions = { default: 500, max: 500 };
  const { offset, aggSize } = InaturalistAPI.paginationData( req, paginationOptions );
  countQuery.aggs = {
    nested: {
      nested: { path: "identifications" },
      aggs: {
        filtered: {
          filter: { term: { "identifications.own_observation": false } },
          aggs: {
            total: { cardinality: { field: "identifications.user.id", precision_threshold: 10000 } }
          }
        }
      }
    }
  };
  if ( offset < 500 ) {
    countQuery.aggs.nested.aggs.filtered.aggs.users = {
      terms: { field: "identifications.user.id", size: aggSize }
    };
  }
  ESModel.userAggregationResponse( req, countQuery,
    ObservationsController.elasticResults, { paginationOptions }, callback );
};

ObservationsController.observers = function( req, callback ) {
  // depending on the sort order, need to call observers and species
  // counts, since they need separate queries. The second one to be
  // called with add a user_id filter so we can get the corresponding
  // count for all users from the results of the first query.
  if( req.query.order_by == "species_count" ) {
    ObservationsController.observationsSpeciesObserverCounts( req, function( err, speciesObservers ) {
      if( err ) { return callback( err ); }
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( speciesObservers.counts );
      var spReq = _.extend( { }, req, { query: spQuery });
      ObservationsController.observationsObserverCounts( spReq, function( err, observers ) {
        if( err ) { return callback( err ); }
        ObservationsController.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  } else {
    ObservationsController.observationsObserverCounts( req, function( err, observers ) {
      if( err ) { return callback( err ); }
      var spQuery = _.extend( { }, req.query );
      spQuery.user_id = _.keys( observers.counts );
      var spReq = _.extend( { }, req, { query: spQuery });
      ObservationsController.observationsSpeciesObserverCounts( spReq, function( err, speciesObservers ) {
        if( err ) { return callback( err ); }
        ObservationsController.observationsObserversResponse( req, observers, speciesObservers, callback );
      });
    });
  }
};

ObservationsController.observationsObserversResponse = function( req, observers, speciesObservers, callback ) {
  // using the node.extend package for a deep clone to merge these objects
  var userIndexedCounts = extend( true, { }, observers.counts, speciesObservers.counts );
  var orderField = ( req.query.order_by == "species_count" ) ?
    "species_count" : "observation_count";
  const { page, perPage } = InaturalistAPI.paginationData( req );
  var userCounts = _.map( userIndexedCounts, function( counts ) {
    counts.observation_count = counts.observation_count || 0;
    counts.species_count = counts.species_count || 0;
    return counts;
  } );
  userCounts = _.sortBy( userCounts, function( b ) {
    return -1 * b[ orderField ];
  } );
  Observation.preloadUsers( userCounts, function( err ) {
    if( err ) { return callback( err ); }
    callback( null, {
      total_results: ( observers.total || speciesObservers.total ) || 0,
      page: page,
      per_page: perPage,
      results: userCounts
    });
  });
};

ObservationsController.observationsObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  // observationsSpeciesObserverCounts has already run, and applied a `user_id` query param
  const isSecondRoundQuery = _.isArray( countQuery.user_id );
  let { perPage, offset, aggSize } = InaturalistAPI.paginationData( req, { default: 500, max: 500 } );
  countQuery.aggs = { };
  if ( isSecondRoundQuery ) {
    perPage = countQuery.user_id.length;
    offset = 0;
  } else {
    countQuery.aggs.total_observers = {
      cardinality: { field: "user.id", precision_threshold: 10000 }
    };
  }
  if ( offset < 500 ) {
    countQuery.aggs.top_observers =
      { terms: { field: "user.id", size: aggSize } };
  }
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    let counts = { };
    if ( countQuery.aggs.top_observers ) {
      // map top_observers into an array to pass to _.object
      counts = _.map( data.aggregations.top_observers.buckets, b => (
        [ b.key, { user_id: b.key, observation_count: b.doc_count } ]
      ));
      if ( !isSecondRoundQuery ) {
        // sort by count desc; trim to result window;
        counts = _.sortBy( counts, b => ( -1 * b[1].observation_count ) ).
          slice( offset, offset + perPage )
      }
      counts = _.object( counts );
    }
    callback( null, {
      total: isSecondRoundQuery ? null : data.aggregations.total_observers.value,
      counts: counts
    } );
  });
};


ObservationsController.observationsSpeciesObserverCounts = function( req, callback ) {
  var countQuery = _.extend( { }, req.query );
  // observationsObserverCounts has already run, and applied a `user_id` query param
  const isSecondRoundQuery = _.isArray( countQuery.user_id );
  let { perPage, offset, aggSize } = InaturalistAPI.paginationData( req, { default: 500, max: 500 } );
  countQuery.aggs = { };
  if ( isSecondRoundQuery ) {
    perPage = countQuery.user_id.length;
    offset = 0;
  } else {
    countQuery.aggs.total_observers = {
      cardinality: { field: "user.id", precision_threshold: 10000 }
    };
  }
  if ( offset < 500 ) {
    countQuery.aggs.species_filter = {
      filter: {
        range: {
          "taxon.rank_level": {
            gte: Taxon.ranks.subspecies,
            lte: Taxon.ranks.species
          }
        }
      },
      aggs: {
        user_taxa: {
        terms: {
          field: "user.id", size: aggSize, order: { distinct_taxa: "desc" } },
        aggs: {
          distinct_taxa: {
            cardinality: {
              field: "taxon.min_species_ancestry", precision_threshold: 10000 }
            }
          }
        }
      }
    }
  }
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    let userIndexedCounts = { };
    if ( countQuery.aggs ) {
      // map user_taxa into an array to pass to _.object
      userIndexedCounts = _.map( data.aggregations.species_filter.user_taxa.buckets, b => (
        [ b.key, { user_id: b.key, species_count: b.distinct_taxa.value } ]
      ));
      if ( !isSecondRoundQuery ) {
        // sort by count desc; trim to result window;
        userIndexedCounts = _.sortBy( userIndexedCounts, b => ( -1 * b[1].species_count ) ).
          slice( offset, offset + perPage );
      }
      userIndexedCounts = _.object( userIndexedCounts );
    }
    callback( null, { total: isSecondRoundQuery ? null : data.aggregations.total_observers.value,
      counts: userIndexedCounts });
  });
};

ObservationsController.conservationCondition = function( esField, values, params ) {
  // use a nested query to search the specified fields
  var filters = [ ];
  var inverseFilters = [ ];
  var statusFilter = { terms: { } };
  statusFilter.terms[ "taxon.statuses." + esField ] = values;
  filters.push( statusFilter );
  if( params.place_id ) {
    // if a place condition is specified, return all results
    // from the place(s) specified, or where place is NULL
    filters.push( { bool: { should: [
      { terms: { "taxon.statuses.place_id": util.paramArray( params.place_id ) } },
      { bool: { must_not: { exists: { field: "taxon.statuses.place_id" } } } }
    ] } } );
  } else {
    // no place condition specified, so apply a `place is NULL` condition
    inverseFilters.push( { exists: { field: "taxon.statuses.place_id" } } );
  }
  var statusCondition = {
    nested: {
      path: "taxon.statuses",
      query: { bool: {
        filter: filters,
        must_not: inverseFilters } }
    }
  };
  return statusCondition;
};

// returns unviewed notifications about new IDs and comments
// on the authroized user's observations
ObservationsController.updates = function( req, callback ) {
  if( !req.userSession ) {
    return callback({ error: "Unauthorized", status: 401 });
  }
  // do not cache results by default
  req.query.ttl = req.query.ttl || -1;
  InaturalistAPI.setPerPage( req, { default: 20, max: 200 } );
  req.query.page  = Number( req.query.page ) || 1;
  var updatesFilters = [
    { term: { resource_type: "Observation" } },
    { term: { notification: "activity" } },
    { terms: { notifier_type: [ `Identification`, `Comment` ] } },
    { term: { subscriber_ids: req.userSession.user_id } }
  ];
  var inverseFilters = [ ];
  if( req.query.created_after ) {
    var afterDate = moment.utc( req.query.created_after ).parseZone( );
    if( afterDate.isValid( ) ) {
      updatesFilters.push( { range: { created_at: {
        gte: afterDate.format( "YYYY-MM-DDTHH:mm:ssZ" )
      }}});
    }
  }
  if( req.query.viewed == "false" ) {
    inverseFilters.push( { term: { viewed_subscriber_ids: req.userSession.user_id } } );
  }
  if( req.query.observations_by == "owner" ) {
    updatesFilters.push( {
      term: { resource_owner_id: req.userSession.user_id }
    } );
  } else if ( req.query.observations_by == "following" ) {
    inverseFilters.push( {
      term: { resource_owner_id: req.userSession.user_id }
    } );
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index: ( process.env.NODE_ENV || global.config.environment ) + "_update_actions",
    body: {
      sort: { id: "desc" },
      size: req.query.per_page,
      from: ( req.query.per_page * req.query.page ) - req.query.per_page,
      query: {
        bool: {
          filter: updatesFilters,
          must_not: inverseFilters
        }
      },
      _source: [ "id", "resource_type", "resource_id", "notifier_type",
        "notifier_id", "notification", "created_at", "resource_owner_id",
        "viewed_subscriber_ids" ]
    }
  }, function( err, response ) {
    if( err ) { return callback( err ); }
    var hits = _.map( response.hits.hits, h => new UpdateAction( h._source ) );
    // add in foreign keys for object preloading
    _.each( hits, h => {
      if( h.notifier_type === "Comment" ) {
        h.comment_id = h.notifier_id;
      } else if( h.notifier_type === "Identification" ) {
        h.identification_id = h.notifier_id;
      }
      if( _.includes( h.viewed_subscriber_ids, req.userSession.user_id ) ) {
        h.viewed = true;
      } else {
        h.viewed = false;
      }
      delete h.viewed_subscriber_ids;
    });

    var localeOpts = util.localeOpts( req );
    Comment.preloadInto( hits, localeOpts, function( ) {
      Identification.preloadInto( hits, localeOpts, function( ) {
        callback( null, {
          total_results: response.hits.total,
          page: req.query.page || 1,
          per_page: req.query.per_page,
          results: hits
        });
      });
    });
  });
};

ObservationsController.deleted = function( req, callback ) {
  req.query.ttl = req.query.ttl || -1;
  if( !req.userSession ) {
    return callback({ error: "Unauthorized", status: 401 });
  }
  var deletedSince;
  if( req.query.since ) {
    deletedSince = moment.utc( req.query.since ).parseZone( );
  }
  if( deletedSince && deletedSince.isValid( ) ) {
    var query = squel.select( ).field( "observation_id ").from( "deleted_observations" ).
      where( "user_id = ? AND created_at >= ?", req.userSession.user_id, deletedSince.format( ) ).
      order( "observation_id", false ).limit( 500 );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        callback( null, {
          total_results: result.rows.length,
          page: 1,
          per_page: 500,
          results: _.map( result.rows, "observation_id" )
        });
      }
    );
  } else {
    callback( null, {
      total_results: 0,
      page: 1,
      per_page: 500,
      results: [ ]
    });
  }
};

ObservationsController.popularFieldValues = function( req, callback ) {
  var countQuery = _.extend( { }, req.query, { annotation_min_score: 0 } );
  countQuery.aggs = {
    nested_annotations: {
      nested: { path: "annotations" },
      aggs: {
        attributes: {
          terms: {
            field: "annotations.concatenated_attr_val",
            size: 100
          },
          aggs: {
            back_to_observation: {
              reverse_nested: { },
              aggs: {
                by_month: {
                  terms: {
                    field: "observed_on_details.month",
                    size: 12 }}}}}}}}};
  countQuery.per_page = 0;
  var countReq = _.extend( { }, req, { query: countQuery });
  ObservationsController.elasticResults( countReq, function( err, data ) {
    if( err ) { return callback( err ); }
    var resultOptions = { backfill: { min: 1, max: 12 } };
    var results = [ ];
    var controlledTermsIDs = { };
    _.each( data.aggregations.nested_annotations.attributes.buckets, b => {
      var pieces = b.key.split( "|" );
      controlledTermsIDs[ Number( pieces[0] ) ] = true;
      controlledTermsIDs[ Number( pieces[1] ) ] = true;
      results.push( {
        controlled_attribute_id: pieces[0],
        controlled_value_id: pieces[1],
        count: b.back_to_observation.doc_count,
        month_of_year: util.aggBucketsToHash(
          b.back_to_observation.by_month.buckets, resultOptions )
      });
    });
    ESModel.fetchInstancesByIDsObject( controlledTermsIDs, ControlledTerm, { }, ( err, terms ) => {
      if( err ) { return callback( err ); }
      _.each( terms, t => (
        t.values = _.map( t.values, v => ( new ControlledTerm( v ) ) )
      ));
      _.each( results, r => {
        if( terms[ r.controlled_attribute_id ] ) {
          r.controlled_attribute = terms[ r.controlled_attribute_id ];
          delete r.controlled_attribute_id;
        }
        if( terms[ r.controlled_value_id ] ) {
          r.controlled_value = terms[ r.controlled_value_id ];
          delete r.controlled_value_id;
        }
      });
      results = _.filter( results, r => (
        r.controlled_attribute && r.controlled_value
      ));
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results: _.sortBy( results, r => ( -1 * r.count ) )
      });
    });
  });
};

ObservationsController.qualityMetrics = ( req, callback ) => {
  var query = squel.select( ).field( "*" ).
    from( "quality_metrics" ).where( "observation_id = ?", req.params.id );
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if( err ) { return callback( err ); }
    var results = result.rows;
    ESModel.fetchBelongsTo( results, User, { }, () => {
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results: results
      });
    });
  });
};

ObservationsController.subscriptions = ( req, callback ) => {
  if( !req.userSession ) {
    return callback({ error: "Unauthorized", status: 401 });
  }
  var query = squel.select( ).field( "s.*" ).
    from( "observations o" ).
    join( "subscriptions s", null, `(
      (s.resource_type='Observation' AND s.resource_id=o.id) OR
      (s.resource_type='User' and s.resource_id=o.user_id) )` ).
    where( "o.id = ?", req.params.id ).
    where( "s.user_id = ?", req.userSession.user_id);
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if( err ) { return callback( err ); }
    var results = result.rows;
    callback( null, {
      total_results: results.length,
      page: 1,
      per_page: results.length,
      results: results
    });
  });
};

module.exports = {
  create: ObservationsController.create,
  delete: ObservationsController.delete,
  deleted: ObservationsController.deleted,
  deleteQualityMetric: ObservationsController.deleteQualityMetric,
  elasticResults: ObservationsController.elasticResults,
  fave: ObservationsController.fave,
  histogram: ObservationsController.histogram,
  iconicTaxaCounts: ObservationsController.iconicTaxaCounts,
  iconicTaxaSpeciesCounts: ObservationsController.iconicTaxaSpeciesCounts,
  identifiers: ObservationsController.identifiers,
  leafCounts: ObservationsController.leafCounts,
  observers: ObservationsController.observers,
  popularFieldValues: ObservationsController.popularFieldValues,
  qualityMetrics: ObservationsController.qualityMetrics,
  reqToElasticQuery: ObservationsController.reqToElasticQuery,
  review: ObservationsController.review,
  search: ObservationsController.search,
  setQualityMetric: ObservationsController.setQualityMetric,
  show: ObservationsController.show,
  speciesCounts: ObservationsController.speciesCounts,
  subscribe: ObservationsController.subscribe,
  subscriptions: ObservationsController.subscriptions,
  taxonSummary: ObservationsController.taxonSummary,
  unfave: ObservationsController.unfave,
  unreview: ObservationsController.unreview,
  update: ObservationsController.update,
  updates: ObservationsController.updates,
  viewedUpdates: ObservationsController.viewedUpdates
};
