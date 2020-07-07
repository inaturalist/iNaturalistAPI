const _ = require( "lodash" );
const moment = require( "moment" );
const extend = require( "node.extend" );
const squel = require( "squel" );
const { observations } = require( "inaturalistjs" );
const CachemanCache = require( "../../cacheman_cache" );
const esClient = require( "../../es_client" );
const pgClient = require( "../../pg_client" );
const ESModel = require( "../../models/es_model" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );
const TaxaController = require( "./taxa_controller" );
const ControlledTerm = require( "../../models/controlled_term" );
const Observation = require( "../../models/observation" );
const Place = require( "../../models/place" );
const Project = require( "../../models/project" );
const Taxon = require( "../../models/taxon" );
const Comment = require( "../../models/comment" );
const User = require( "../../models/user" );
const Identification = require( "../../models/identification" );
const UpdateAction = require( "../../models/update_action" );
const ObservationQueryBuilder = require( "../../models/observation_query_builder" );

const ObservationsController = { };

ObservationsController.create = async req => {
  const response = await InaturalistAPI.iNatJSWrap( observations.create, req );
  const arr = [{ observation_id: response["0"].id }];
  const localeOpts = util.localeOpts( req );
  await Observation.preloadInto( arr, localeOpts );
  return arr[0].observation;
};

ObservationsController.update = async req => {
  const response = await InaturalistAPI.iNatJSWrap( observations.update, req );
  const arr = [{ observation_id: response["0"].id }];
  const localeOpts = util.localeOpts( req );
  await Observation.preloadInto( arr, localeOpts );
  return arr[0].observation;
};

ObservationsController.delete = async req => (
  InaturalistAPI.iNatJSWrap( observations.delete, req )
);

ObservationsController.fave = async req => {
  await InaturalistAPI.iNatJSWrap( observations.fave, req );
  const arr = [{ observation_id: req.params.id }];
  const localeOpts = util.localeOpts( req );
  await Observation.preloadInto( arr, localeOpts );
  return arr[0].observation;
};

ObservationsController.unfave = async req => {
  await InaturalistAPI.iNatJSWrap( observations.unfave, req );
  const arr = [{ observation_id: req.params.id }];
  const localeOpts = util.localeOpts( req );
  await Observation.preloadInto( arr, localeOpts );
  return arr[0].observation;
};

ObservationsController.review = async req => (
  InaturalistAPI.iNatJSWrap( observations.review, req )
);

ObservationsController.unreview = async req => (
  InaturalistAPI.iNatJSWrap( observations.unreview, req )
);

ObservationsController.setQualityMetric = async req => (
  InaturalistAPI.iNatJSWrap( observations.setQualityMetric, req )
);

ObservationsController.deleteQualityMetric = async req => (
  InaturalistAPI.iNatJSWrap( observations.deleteQualityMetric, req )
);

ObservationsController.subscribe = async req => {
  await InaturalistAPI.iNatJSWrap( observations.subscribe, req );
  return true;
};

ObservationsController.taxonSummary = async req => (
  InaturalistAPI.iNatJSWrap( observations.taxonSummary, req )
);

ObservationsController.viewedUpdates = async req => (
  InaturalistAPI.iNatJSWrap( observations.viewedUpdates, req )
);

ObservationsController.show = async req => {
  const ids = _.filter( req.params.id.split( "," ), _.identity ).slice( 0, 200 );
  // also preserve the ttl and locale params
  req.query = Object.assign( req.query, {
    id: ids,
    details: "all",
    per_page: ids.length
  } );
  return ObservationsController.searchCacheWrapper( req );
};

ObservationsController.searchCacheWrapper = async req => (
  ObservationsController.methodCacheWrapper( req,
    ObservationsController.search, "ObservationsController.search", 60 * 60 )
);

ObservationsController.search = async req => {
  if ( req.query.return_bounds === "true" ) {
    req.query.aggs = {
      bbox: {
        geo_bounds: {
          field: "location"
        }
      }
    };
  }
  const data = await ObservationsController.resultsForRequest( req );
  const localeOpts = util.localeOpts( req );
  let preloadMethod;
  if ( req.query.only_id && req.query.only_id !== "false" ) {
    return data;
  }
  if ( req.query.details === "all" ) {
    preloadMethod = Observation.preloadAllAssociations;
  } else {
    preloadMethod = Observation.preloadMinimal;
  }

  // newProjectsContaining
  if ( req.query.include_new_projects ) {
    await ObservationsController.loadNewProjects( data.results );
  }
  await preloadMethod( data.results, localeOpts );
  if ( !( req.query.only_id && req.query.only_id !== "false" ) ) {
    data.results = _.map( data.results, r => (
      new Observation( r, { userSession: req.userSession } )
    ) );
  }
  return data;
};

ObservationsController.loadNewProjects = async obs => (
  // newProjectsContaining
  Promise.all( _.map( obs, async item => {
    const projectIDs = await ObservationsController.newProjectsContaining( item );
    item.non_traditional_projects = _.map( projectIDs, id => ( { project_id: id } ) );
  } ) )
);

// this needs to remain a named function
ObservationsController.elasticResults = async function observationElasticResults( req ) {
  const query = await ObservationsController.reqToElasticQuery( req );
  const opts = {
    excludes: ["taxon.names", "taxon.photos", "taxon.taxon_photos", "taxon.names_*"],
    track_total_hits: true
  };
  if ( req.query.only_id && req.query.only_id !== "false" ) { opts.includes = ["id"]; }
  return ESModel.elasticResults( req, query, "observations", opts );
};

ObservationsController.reqToElasticQuery = async req => {
  const components = await ObservationQueryBuilder.reqToElasticQueryComponents(
    _.cloneDeep( req )
  );
  return {
    where: components.search_wheres,
    filters: components.search_filters,
    inverse_filters: components.inverse_filters,
    grouped_inverse_filters: components.grouped_inverse_filters,
    per_page: InaturalistAPI.perPage( req, { default: 30, max: 200 } ),
    page: req.query.page || 1,
    sort: components.sort
  };
};

ObservationsController.histogram = async req => {
  req.query.date_field = InaturalistAPI.setDefaultParamValue(
    req.query.date_field, "observed", { enum: ["created", "observed"] }
  );
  req.query.interval = InaturalistAPI.setDefaultParamValue(
    req.query.interval, "month_of_year", {
      enum: ["year", "month", "week", "day", "hour",
        "month_of_year", "week_of_year"]
    }
  );
  const interval = req.query.interval.replace( /_of_(month|year)/, "" );
  const grouped = req.query.interval.match( /_of_/ );
  let queryField = ( req.query.date_field === "created" ) ? "created_at" : "observed_on";
  if ( interval === "hour" && req.query.date_field !== "created" ) {
    queryField = "time_observed_at";
  }
  const dateLimitField = ( req.query.date_field === "created" ) ? "created_d1" : "d1";
  const countQuery = _.assignIn( { }, req.query );
  // set a reasonable starting date to limit the number of buckets
  if ( !grouped && !countQuery[dateLimitField] ) {
    if ( interval === "year" || interval === "month" ) {
      countQuery[dateLimitField] = moment( ).subtract( 100, "years" ).format( );
    } else if ( interval === "week" ) {
      countQuery[dateLimitField] = moment( ).subtract( 10, "years" ).format( );
    } else if ( interval === "day" ) {
      countQuery[dateLimitField] = moment( ).subtract( 1, "years" ).format( );
    } else if ( interval === "hour" ) {
      countQuery[dateLimitField] = moment( ).subtract( 1, "week" ).format( );
    }
  }
  if ( grouped ) {
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
          interval,
          format: ( interval === "hour" ) ? "yyyy-MM-dd'T'HH:mm:ss'Z'" : "yyyy-MM-dd"
        }
      }
    };
  }
  // return nothing but aggregations
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const resultOptions = { };
  // fill in 0's for any values without hits, which date_histogram does automatically
  if ( req.query.interval === "month_of_year" ) {
    resultOptions.backfill = { min: 1, max: 12 };
  } else if ( req.query.interval === "week_of_year" ) {
    resultOptions.backfill = { min: 1, max: 53 };
  }
  const results = { };
  results[req.query.interval] = util
    .aggBucketsToHash( data.aggregations.histogram.buckets, resultOptions );
  return {
    total_results: _.size( results[req.query.interval] ),
    page: 1,
    per_page: _.size( results[req.query.interval] ),
    results
  };
};

ObservationsController.prepareElasticDataForReponse = ( data, req ) => {
  const obs = _.map( data.hits.hits, "_source" );
  const response = { total_results: data.hits.total.value };
  if (
    data.aggregations
    && data.aggregations.bbox
    && data.aggregations.bbox.bounds
    && data.aggregations.bbox.bounds.bottom_right
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
  return response;
};

ObservationsController.resultsForRequest = async req => {
  const data = await ObservationsController.elasticResults( req );
  return ObservationsController.prepareElasticDataForReponse( data, req );
};

ObservationsController.leafCounts = async req => (
  ESModel.ancestriesSpeciesCounts( req, "taxon.min_species_ancestry",
    ObservationsController.elasticResults )
);

ObservationsController.methodCacheWrapper = async ( req, method, cacheKey, ttl = 60 * 60 * 2 ) => (
  new Promise( ( resolve, reject ) => {
    ObservationQueryBuilder.applyLookupRules( req ).then( ( ) => {
      const fileCacheKey = util.observationSearchRequestCacheKey( req, cacheKey );
      const cb = ( err, data ) => {
        if ( err ) { return void reject( err ); }
        resolve( data );
      };
      CachemanCache.cachedOrFetchFile( fileCacheKey, ( ) => {
        method( req ).then( data => {
          CachemanCache.cachedCallbackFile( fileCacheKey, ttl, cb )( null, data );
        } );
      }, cb );
    } );
  } )
);

ObservationsController.speciesCountsCacheWrapper = async req => (
  ObservationsController.methodCacheWrapper( req,
    ObservationsController.speciesCounts, "ObservationsController.speciesCounts" )
);

ObservationsController.speciesCounts = async req => {
  const leafCounts = await ObservationsController.leafCounts( req );
  return TaxaController.speciesCountsResponse( req, leafCounts );
};

ObservationsController.taxa = async req => {
  if ( !req.query.user_id ) {
    throw new Error( 422 );
  }
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      taxon_ids: {
        terms: {
          field: "taxon.id",
          size: 400000
        }
      }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const taxonIDs = _.map( data.aggregations.taxon_ids.buckets, "key" );
  return {
    total_results: _.size( taxonIDs ),
    page: 1,
    per_page: _.size( taxonIDs ),
    results: taxonIDs
  };
};

ObservationsController.taxaCountsByMonth = async req => {
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      histogram: {
        terms: {
          field: "observed_on_details.month",
          size: 20
        },
        aggs: {
          ancestries: { terms: { field: "taxon.min_species_ancestry", size: 5000 } }
        }
      }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const results = _.fromPairs( _.map( data.aggregations.histogram.buckets, histogramBucket => {
    const knownAncestors = { };
    const possibleLeaves = { };
    const allNodes = { };
    _.each( histogramBucket.ancestries.buckets, bucket => {
      const ancestors = bucket.key.split( "," );
      const taxonID = ancestors.pop( );
      possibleLeaves[taxonID] = bucket.doc_count;
      allNodes[taxonID] = bucket.doc_count;
      _.each( ancestors, a => {
        knownAncestors[a] = true;
        allNodes[a] = allNodes[a] || 0;
        allNodes[a] += bucket.doc_count;
      } );
    } );
    const leafCounts = _.sortBy( _.map( allNodes, ( v, k ) => (
      { taxon_id: Number( k ), count: v, leaf: !knownAncestors[k] }
    ) ), o => o.count * -1 );
    return [histogramBucket.key, leafCounts];
  } ) );
  return {
    total_results: _.size( results ),
    page: 1,
    per_page: _.size( results ),
    results: {
      month_of_year: results
    }
  };
};

ObservationsController.newProjectsContaining = async obs => {
  const obsSearchParams = { };
  obsSearchParams.user_id = obs.user ? obs.user.id : null;
  obsSearchParams.taxon_id = obs.taxon ? obs.taxon.ancestor_ids : null;
  obsSearchParams.native = obs.taxon ? obs.taxon.native : null;
  obsSearchParams.introduced = obs.taxon ? obs.taxon.introduced : null;
  obsSearchParams.place_id = _.isEmpty( obs.place_ids ) ? null : obs.place_ids;
  obsSearchParams.quality_grade = obs.quality_grade;
  obsSearchParams.captive = obs.captive ? "true" : "false";
  obsSearchParams.photos = !_.isEmpty( obs.photos ) || obs.photos_count > 0;
  obsSearchParams.sounds = !_.isEmpty( obs.sounds ) || obs.sounds_count > 0;
  obsSearchParams.date = obs.time_observed_at || obs.observed_on;
  obsSearchParams.observed_on = obs.observed_on_details ? obs.observed_on_details.date : null;
  obsSearchParams.month = obs.observed_on_details ? obs.observed_on_details.month : null;
  obsSearchParams.term_id = [];
  obsSearchParams.term_value_id = [];
  _.each( obs.annotations, a => {
    obsSearchParams.term_id.push( a.controlled_attribute_id );
    obsSearchParams.term_value_id.push( a.controlled_value_id );
  } );

  const filters = [
    esClient.termFilter( "project_type", "collection" ),
    { exists: { field: "search_parameter_fields" } }
  ];
  const inverseFilters = [];
  _.each( obsSearchParams, ( value, field ) => {
    // there is a value that isn't false or an empty array
    if ( value && !( _.isArray( value ) && _.isEmpty( value ) ) ) {
      const shoulds = [];
      if ( field === "date" ) {
        const momentDate = moment.utc( value ).parseZone( );
        // Essentially this is:
        //   ( (d1 < date || !d1) && (d2 > date || !d2) )
        _.each( ["d1", "d2"], subfield => {
          const dateShoulds = [
            {
              range: {
                [`search_parameter_fields.${subfield}`]: {
                  [subfield === "d1" ? "lte" : "gte"]: value
                }
              }
            },
            {
              bool: {
                must_not: {
                  exists: {
                    field: `search_parameter_fields.${subfield}`
                  }
                }
              }
            }
          ];
          // if d2 is a date, using gte on the d2 datetime field doesn't work
          // if d2_date exists use that to properly match end dates
          if ( subfield === "d2" && momentDate && momentDate.isValid( ) ) {
            dateShoulds.push( {
              range: {
                "search_parameter_fields.d2_date": {
                  gte: momentDate.format( "YYYY-MM-DD" )
                }
              }
            } );
          }
          filters.push( {
            bool: {
              should: dateShoulds
            }
          } );
        } );
      } else {
        shoulds.push( esClient.termFilter( `search_parameter_fields.${field}`, value ) );
        shoulds.push( {
          bool: {
            must_not: { exists: { field: `search_parameter_fields.${field}` } }
          }
        } );
        filters.push( { bool: { should: shoulds } } );

        // for inverse filters. The observation has a value for a parameter
        // that collection projects can use as an inverse filter. Add filters
        // to only consider projects which do not have this value in an inverse filter
        if ( field === "taxon_id" ) {
          inverseFilters.push( esClient.termFilter( "search_parameter_fields.without_taxon_id", value ) );
        } else if ( field === "user_id" ) {
          inverseFilters.push( esClient.termFilter( "search_parameter_fields.not_user_id", value ) );
        } else if ( field === "place_id" ) {
          inverseFilters.push( esClient.termFilter( "search_parameter_fields.not_in_place", value ) );
        }
      }
      // the observation has no data for the field, so only look for projects
      // which don't use the field as a search criterion
    } else if ( field === "date" ) {
      inverseFilters.push( { exists: { field: "search_parameter_fields.d1" } } );
      inverseFilters.push( { exists: { field: "search_parameter_fields.d2" } } );
    } else {
      inverseFilters.push( { exists: { field: `search_parameter_fields.${field}` } } );
    }
  } );
  const query = {
    filters,
    inverse_filters: inverseFilters,
    size: 10000,
    _source: ["id"]
  };
  const allCollectionsResponse = await ESModel.elasticResults( { query: { } }, query, "projects" );
  const collectionProjectIDs = _.map( allCollectionsResponse.hits.hits, "_source.id" );
  if ( _.isEmpty( collectionProjectIDs ) ) {
    return collectionProjectIDs;
  }
  query.filters.push( esClient.termFilter( "user_ids", obs.user.id ) );
  const joinedCollectionsResponse = await ESModel.elasticResults( { query: { } }, query, "projects" );
  const joinedCollectionProjectIDs = _.map( joinedCollectionsResponse.hits.hits, "_source.id" );
  const umbrellaProjectsQuery = {
    filters: [
      { term: { project_type: "umbrella" } },
      { terms: { "search_parameter_fields.project_id": collectionProjectIDs } },
      { term: { user_ids: obs.user.id } }
    ],
    size: 100,
    _source: ["id"]
  };
  const umbrellaData = await ESModel.elasticResults( { query: { } }, umbrellaProjectsQuery, "projects" );
  const umbrellaProjectIDs = _.map( umbrellaData.hits.hits, "_source.id" );
  return joinedCollectionProjectIDs.concat( umbrellaProjectIDs );
};

ObservationsController.treeTaxa = async req => {
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      ancestries: { terms: { field: "taxon.min_species_ancestry", size: 5000 } }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const knownAncestors = { };
  const possibleLeaves = { };
  const allNodes = { };
  _.each( data.aggregations.ancestries.buckets, bucket => {
    const ancestors = bucket.key.split( "," );
    const taxonID = ancestors.pop( );
    possibleLeaves[taxonID] = bucket.doc_count;
    allNodes[taxonID] = bucket.doc_count;
    _.each( ancestors, a => {
      knownAncestors[a] = knownAncestors[a] || 0;
      knownAncestors[a] += bucket.doc_count;
    } );
  } );
  const taxonIDs = _.keys( possibleLeaves );
  _.each( taxonIDs, taxonID => {
    if ( knownAncestors[taxonID] ) {
      delete possibleLeaves[taxonID];
      delete allNodes[taxonID];
    }
  } );
  _.each( knownAncestors, ( count, taxonID ) => {
    if ( !_.has( allNodes, taxonID ) ) {
      allNodes[taxonID] = count;
    }
  } );
  const leafCounts = _.sortBy( _.map( allNodes, ( v, k ) => (
    { taxon_id: k, count: v }
  ) ), o => o.count * -1 );

  const r = await TaxaController.speciesCountsResponse( req,
    leafCounts, { perPageOverride: leafCounts.length } );
  _.each( r.results, result => {
    result.isLeaf = _.has( possibleLeaves, result.taxon.id );
    result.taxon = _.pick( result.taxon,
      ["id", "name", "iconic_taxon_id", "preferred_common_name", "rank", "ancestor_ids"] );
  } );
  return r;
};

ObservationsController.taxonomy = async req => {
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      min_species_taxon_ids: {
        terms: {
          field: "taxon.min_species_taxon_id",
          size: 100000
        }
      },
      without_taxon: {
        filter: {
          bool: {
            must_not: {
              exists: {
                field: "taxon"
              }
            }
          }
        }
      }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const initialCounts = { };
  let taxa = [];
  const countWithoutTaxon = data.aggregations.without_taxon.doc_count;
  _.each( data.aggregations.min_species_taxon_ids.buckets, bucket => {
    initialCounts[bucket.key] = bucket.doc_count;
    taxa.push( { id: bucket.key, count: bucket.doc_count } );
  } );
  await Taxon.preloadBasicInfoFromDBParallel( taxa );
  const ancestors = _.map( _.compact( _.uniq( _.flatten(
    _.map( taxa, t => ( t.ancestry || "" ).split( "/" ) )
  ) ) ), ancestorID => ( { id: ancestorID } ) );
  await Taxon.preloadBasicInfoFromDBParallel( ancestors );
  taxa = _.fromPairs( _.map( taxa.concat( ancestors ), t => [t.id, t] ) );
  const allCounts = { };
  _.each( initialCounts, ( count, taxonID ) => {
    const taxon = taxa[taxonID];
    if ( taxon ) {
      allCounts[taxonID] = allCounts[taxonID] || 0;
      allCounts[taxonID] += count;
      const ancestorIDs = ( taxon.ancestry || "" ).split( "/" );
      _.each( ancestorIDs, ancestorID => {
        if ( Number( ancestorID ) === Number( taxonID ) ) { return; }
        allCounts[ancestorID] = allCounts[ancestorID] || 0;
        allCounts[ancestorID] += count;
      } );
    }
  } );
  _.each( taxa, ( v, k ) => {
    taxa[k].descendant_obs_count = allCounts[k] || 0;
    taxa[k].direct_obs_count = initialCounts[k] || 0;
    delete taxa[k].ancestry;
  } );
  return {
    count_without_taxon: countWithoutTaxon,
    results: _.values( taxa )
  };
};

ObservationsController.lifelistExport = async req => {
  if ( !req.query.user_id ) {
    throw new Error( 422 );
    // TODO: custom error messages with thrown errors?
    // { error: "Missing required parameter `user_id`", status: 422 }
  }
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      min_species_taxon_ids: {
        terms: {
          field: "taxon.min_species_taxon_id",
          size: 100000
        },
        aggs: {
          earliest: {
            top_hits: {
              sort: {
                observed_on: {
                  order: "asc"
                },
                time_observed_at: {
                  order: "asc"
                }
              },
              size: 1,
              _source: {
                includes: ["id", "observed_on"]
              }
            }
          },
          latest: {
            top_hits: {
              sort: {
                observed_on: {
                  order: "desc"
                },
                time_observed_at: {
                  order: "desc"
                }
              },
              size: 1,
              _source: {
                includes: ["id", "observed_on"]
              }
            }
          }
        }
      }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const knownAncestors = { };
  const initialCounts = { };
  const earliestObs = { };
  const latestObs = { };
  let taxaCounts = [];
  _.each( data.aggregations.min_species_taxon_ids.buckets, bucket => {
    initialCounts[bucket.key] = bucket.doc_count;
    taxaCounts.push( { id: bucket.key } );
    earliestObs[bucket.key] = bucket.earliest.hits.hits[0]._source;
    latestObs[bucket.key] = bucket.latest.hits.hits[0]._source;
    earliestObs[bucket.key].observed_on_moment = moment
      .utc( earliestObs[bucket.key].observed_on ).parseZone( );
    latestObs[bucket.key].observed_on_moment = moment
      .utc( latestObs[bucket.key].observed_on ).parseZone( );
  } );

  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonOpts = {
    modifier: prepareTaxon,
    foreignKey: "id",
    filters: [{ term: { is_active: true } }],
    source: {
      includes: [
        "id",
        "parent_id",
        "ancestry",
        "rank",
        "rank_level",
        "name",
        "names.name",
        "names.locale",
        "names.position",
        "names.is_valid",
        "names.place_taxon_names",
        "min_species_ancestry"
      ]
    }
  };

  await ESModel.fetchBelongsTo( taxaCounts, Taxon, taxonOpts );
  const ancestorIDs = _.uniq( _.compact( _.flatten( _.map( taxaCounts, tc => (
    tc.taxon && tc.taxon.min_species_ancestry
      ? _.map( tc.taxon.min_species_ancestry.split( "," ).slice( 0, -1 ) )
      : null
  ) ) ) ) );
  const ancestorCounts = _.map( ancestorIDs, aid => ( { id: aid } ) );
  ESModel.fetchBelongsTo( ancestorCounts, Taxon, taxonOpts );
  taxaCounts = _.fromPairs(
    _.map( ancestorCounts.concat( taxaCounts ), tc => [Number( tc.id ), tc] )
  );
  const observationCounts = { };
  const leafCounts = { };
  _.each( initialCounts, ( count, taxonID ) => {
    taxonID = Number( taxonID );
    const taxonCount = taxaCounts[taxonID];
    if ( taxonCount && taxonCount.taxon ) {
      observationCounts[taxonID] = observationCounts[taxonID] || 0;
      observationCounts[taxonID] += count;
      leafCounts[taxonID] = leafCounts[taxonID] || 0;
      leafCounts[taxonID] += 1;
      const leafAncestorIDs = ( taxonCount.taxon.ancestry || "" ).split( "/" );
      _.each( leafAncestorIDs, ancestorID => {
        ancestorID = Number( ancestorID );
        if ( ancestorID === taxonID ) { return; }
        knownAncestors[ancestorID] = true;
        observationCounts[ancestorID] = observationCounts[ancestorID] || 0;
        observationCounts[ancestorID] += count;
        leafCounts[ancestorID] = leafCounts[ancestorID] || 0;
        leafCounts[ancestorID] += 1;
        if ( !earliestObs[ancestorID]
          || !earliestObs[ancestorID].observed_on_moment
          || ( earliestObs[taxonID].observed_on_moment
            < earliestObs[ancestorID].observed_on_moment ) ) {
          earliestObs[ancestorID] = earliestObs[taxonID];
        }
        if ( !latestObs[ancestorID]
          || !latestObs[ancestorID].observed_on_moment
          || ( earliestObs[taxonID].observed_on_moment
            > earliestObs[ancestorID].observed_on_moment ) ) {
          latestObs[ancestorID] = latestObs[taxonID];
        }
      } );
    } else {
      // taxon missing
    }
  } );
  taxaCounts = _.omitBy( taxaCounts, tc => !tc.taxon );
  _.each( taxaCounts, ( v, k ) => {
    taxaCounts[k] = taxaCounts[k].taxon;
    taxaCounts[k].count = observationCounts[k] || 0;
    taxaCounts[k].observation_count = observationCounts[k] || 0;
    taxaCounts[k].leaf_count = leafCounts[k] || 0;
    taxaCounts[k].is_leaf = !knownAncestors[k];
    if ( earliestObs[k] ) {
      taxaCounts[k].earliest_observation = _.omit( earliestObs[k], ["observed_on_moment"] );
    }
    if ( latestObs[k] ) {
      taxaCounts[k].latest_observation = _.omit( latestObs[k], ["observed_on_moment"] );
    }
    delete taxaCounts[k].ancestry;
    delete taxaCounts[k].min_species_ancestry;
  } );
  return { total_results: taxaCounts.length, results: _.values( taxaCounts ) };
};

ObservationsController.iconicTaxaCounts = async req => {
  const countQuery = _.assignIn( { }, req.query );
  countQuery.aggs = {
    iconic_taxa: {
      terms: { field: "taxon.iconic_taxon_id" }
    }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const buckets = _.map( data.aggregations.iconic_taxa.buckets, b => (
    { taxon_id: b.key, count: b.doc_count }
  ) );
  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonOpts = {
    modifier: prepareTaxon,
    source: { excludes: ["photos", "taxon_photos"] }
  };
  await ESModel.fetchBelongsTo( buckets, Taxon, taxonOpts );
  return {
    total_results: buckets.length,
    page: 1,
    per_page: buckets.length,
    results: _.reverse( _.sortBy( buckets, "count" ) )
  };
};

ObservationsController.iconicTaxaSpeciesCounts = async req => {
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      iconic_taxa: {
        terms: { field: "taxon.iconic_taxon_id" },
        aggs: {
          ancestries: { terms: { field: "taxon.min_species_ancestry", size: 250000 } }
        }
      }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const iconicTaxonLeafCounts = [];
  _.each( data.aggregations.iconic_taxa.buckets, b => {
    const iconicTaxonID = b.key;
    const knownAncestors = { };
    const possibleLeaves = { };
    _.each( b.ancestries.buckets, bb => {
      const ancestors = bb.key.split( "," );
      const taxonID = ancestors.pop( );
      possibleLeaves[taxonID] = bb.doc_count;
      _.each( ancestors, a => {
        knownAncestors[a] = true;
      } );
    } );
    const taxonIDs = _.keys( possibleLeaves );
    _.each( taxonIDs, taxonID => {
      if ( knownAncestors[taxonID] ) {
        delete possibleLeaves[taxonID];
      }
    } );
    const leafCounts = _.sortBy( _.map( possibleLeaves, ( v, k ) => (
      { taxon_id: k, count: v }
    ) ), o => o.count * -1 );
    iconicTaxonLeafCounts.push( { taxon_id: iconicTaxonID, count: leafCounts.length } );
  } );

  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonOpts = {
    modifier: prepareTaxon,
    source: { excludes: ["photos", "taxon_photos"] }
  };
  await ESModel.fetchBelongsTo( iconicTaxonLeafCounts, Taxon, taxonOpts );
  return {
    total_results: iconicTaxonLeafCounts.length,
    page: 1,
    per_page: iconicTaxonLeafCounts.length,
    results: _.reverse( _.sortBy( iconicTaxonLeafCounts, "count" ) )
  };
};

ObservationsController.qualityGrades = async req => {
  req.query = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      quality_grade: {
        terms: { field: "quality_grade" }
      }
    }
  } );
  const data = await ObservationsController.elasticResults( req );
  const { buckets } = data.aggregations.quality_grade;
  return {
    total_results: buckets.length,
    page: 1,
    per_page: buckets.length,
    results: _.map( buckets, b => ( {
      quality_grade: b.key,
      count: b.doc_count
    } ) )
  };
};

ObservationsController.umbrellaSubprojectsAggregation = async projects => {
  const aggs = { umbrellaSubprojects: { filters: { filters: { } } } };
  const queryFilters = await ObservationQueryBuilder.projectsQueryFilters( projects );
  _.each( queryFilters, q => {
    aggs.umbrellaSubprojects.filters.filters[`project_${q.project.id}`] = {
      bool: {
        must: q.filters,
        must_not: q.inverse_filters
      }
    };
  } );
  return aggs;
};

ObservationsController.umbrellaProjectStats = async req => {
  let allSubprojects = [];
  // req.inat.project is populated via the `project_id` param
  _.each( req.inat.project, project => {
    if ( project.project_type === "umbrella" ) {
      const subprojects = _.compact( _.map( project.project_observation_rules, "project" ) );
      allSubprojects = allSubprojects.concat( subprojects );
    }
  } );
  // there were no umbrella projects with subprojects
  if ( _.isEmpty( allSubprojects ) ) {
    return InaturalistAPI.basicResponse( req );
  }
  // create filter aggregations for all subprojects
  const aggs = await ObservationsController.umbrellaSubprojectsAggregation( allSubprojects );
  // aggs for observers, species counts, and top species across all subprojects
  aggs.umbrellaSubprojects.aggs = {
    total_observers: {
      cardinality: { field: "user.id", precision_threshold: 1000 }
    },
    species_filter: {
      filter: {
        range: {
          "taxon.rank_level": {
            gte: Taxon.ranks.subspecies,
            lte: Taxon.ranks.species
          }
        }
      },
      aggs: {
        distinct_taxa: {
          cardinality: {
            field: "taxon.min_species_ancestry", precision_threshold: 1000
          }
        }
      }
    }
  };
  const countQuery = _.assignIn( { }, req.query, { per_page: 0, aggs } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const obsAggs = data.aggregations;
  // aggregation keys were `project_${projectID}` so the aggregation results
  // can be easily assigned to their projects
  const buckets = _.map( obsAggs.umbrellaSubprojects.buckets, ( b, key ) => ( {
    project_id: key.split( "_" )[1],
    observation_count: b.doc_count,
    species_count: b.species_filter.distinct_taxa.value,
    observers_count: b.total_observers.value
  } ) );
  const results = _.reverse( _.sortBy( buckets, "observation_count" ) );
  const placeOptions = { source: { excludes: ["geometry_geojson"] } };
  await ESModel.fetchBelongsTo( results, Project, { source: Project.returnFields } );
  await ESModel.fetchBelongsTo( _.map( results, "project" ), Place, placeOptions );
  return {
    total_results: results.length,
    page: 1,
    per_page: results.length,
    results
  };
};

ObservationsController.identifiersCacheWrapper = async req => (
  ObservationsController.methodCacheWrapper( req,
    ObservationsController.identifiers, "ObservationsController.identifiers" )
);

ObservationsController.identifiers = async req => {
  const countQuery = _.assignIn( { }, req.query );
  const paginationOptions = { default: 500, max: 500 };
  const { offset, aggSize } = InaturalistAPI.paginationData( req, paginationOptions );
  countQuery.aggs = {
    total: { cardinality: { field: "non_owner_identifier_user_ids", precision_threshold: 10000 } }
  };
  if ( offset < 500 ) {
    countQuery.aggs.users = {
      terms: { field: "non_owner_identifier_user_ids", size: aggSize }
    };
  }
  return ESModel.userAggregationQuery( req, countQuery,
    ObservationsController.elasticResults, { paginationOptions } );
};

ObservationsController.observersCacheWrapper = async req => (
  ObservationsController.methodCacheWrapper( req,
    ObservationsController.observers, "ObservationsController.observers" )
);

ObservationsController.observers = async req => {
  // depending on the sort order, need to call observers and species
  // counts, since they need separate queries. The second one to be
  // called with add a user_id filter so we can get the corresponding
  // count for all users from the results of the first query.
  if ( req.query.order_by === "species_count" ) {
    const speciesObservers = await ObservationsController
      .observationsSpeciesObserverCounts( _.cloneDeep( req ) );
    const spQuery = _.assignIn( { }, req.query );
    spQuery.user_id = _.keys( speciesObservers.counts );
    const spReq = _.assignIn( { }, req, { query: spQuery } );
    const observers = await ObservationsController.observationsObserverCounts( spReq );
    return ObservationsController.observationsObserversResponse( req, observers, speciesObservers );
  }
  const observers = await ObservationsController.observationsObserverCounts( _.cloneDeep( req ) );
  const spQuery = _.assignIn( { }, req.query );
  spQuery.user_id = _.keys( observers.counts );
  const spReq = _.assignIn( { }, req, { query: spQuery } );
  const speciesObservers = await ObservationsController.observationsSpeciesObserverCounts( spReq );
  return ObservationsController.observationsObserversResponse( req, observers, speciesObservers );
};

ObservationsController.observationsObserversResponse = async (
  req, observers, speciesObservers ) => {
  // using the node.extend package for a deep clone to merge these objects
  const userIndexedCounts = extend( true, { }, observers.counts, speciesObservers.counts );
  const orderField = ( req.query.order_by === "species_count" )
    ? "species_count" : "observation_count";
  const { page, perPage } = InaturalistAPI.paginationData( req,
    { default: 500, max: 500 } );
  let userCounts = _.map( userIndexedCounts, counts => {
    counts.observation_count = counts.observation_count || 0;
    counts.species_count = counts.species_count || 0;
    return counts;
  } );
  userCounts = _.reverse( _.sortBy( userCounts, orderField ) );
  await ESModel.fetchBelongsTo( userCounts, User );
  return {
    total_results: ( observers.total || speciesObservers.total ) || 0,
    page,
    per_page: perPage,
    results: userCounts
  };
};

ObservationsController.observationsObserverCounts = async req => {
  const countQuery = _.assignIn( { }, req.query );
  // observationsSpeciesObserverCounts has already run, and applied a `user_id` query param
  const isSecondRoundQuery = _.isArray( countQuery.user_id );
  let { perPage, offset, aggSize } = InaturalistAPI.paginationData( req,
    { default: 500, max: 500 } );
  countQuery.aggs = { };
  if ( isSecondRoundQuery ) {
    perPage = countQuery.user_id.length;
    offset = 0;
  }
  countQuery.aggs.total_observers = {
    cardinality: { field: "user.id", precision_threshold: 10000 }
  };
  if ( offset < 500 ) {
    countQuery.aggs.top_observers = {
      terms: { field: "user.id", size: aggSize }
    };
  }
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  let counts = { };
  if ( countQuery.aggs.top_observers ) {
    // map top_observers into an array to pass to _.fromPairs
    counts = _.map( data.aggregations.top_observers.buckets, b => (
      [b.key, { user_id: b.key, observation_count: b.doc_count }]
    ) );
    if ( !isSecondRoundQuery ) {
      // sort by count desc; trim to result window;
      counts = _.sortBy( counts, b => ( -1 * b[1].observation_count ) )
        .slice( offset, offset + perPage );
    }
    counts = _.fromPairs( counts );
  }
  return {
    total: data.aggregations.total_observers ? data.aggregations.total_observers.value : null,
    counts
  };
};

ObservationsController.observationsSpeciesObserverCounts = async req => {
  const countQuery = _.assignIn( { }, req.query );
  // observationsObserverCounts has already run, and applied a `user_id` query param
  const isSecondRoundQuery = _.isArray( countQuery.user_id );
  let { perPage, offset, aggSize } = InaturalistAPI.paginationData( req,
    { default: 500, max: 500 } );
  countQuery.aggs = { };
  if ( isSecondRoundQuery ) {
    perPage = countQuery.user_id.length;
    offset = 0;
  }
  countQuery.hrank = "species";
  countQuery.lrank = "subspecies";
  if ( offset < 500 ) {
    countQuery.aggs = {
      user_taxa: {
        terms: {
          field: "user.id", size: aggSize, order: { distinct_taxa: "desc" }
        },
        aggs: {
          distinct_taxa: {
            cardinality: {
              field: "taxon.min_species_taxon_id"
            }
          }
        }
      }
    };
  }
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  let userIndexedCounts = { };
  if ( countQuery.aggs ) {
    // map user_taxa into an array to pass to _.fromPairs
    userIndexedCounts = _.map( data.aggregations.user_taxa.buckets, b => (
      [b.key, { user_id: b.key, species_count: b.distinct_taxa.value }]
    ) );
    if ( !isSecondRoundQuery ) {
      // sort by count desc; trim to result window;
      userIndexedCounts = _.sortBy( userIndexedCounts, b => ( -1 * b[1].species_count ) )
        .slice( offset, offset + perPage );
    }
    userIndexedCounts = _.fromPairs( userIndexedCounts );
  }
  return {
    counts: userIndexedCounts
  };
};

// returns unviewed notifications about new IDs and comments
// on the authorized user's observations
ObservationsController.updates = async req => {
  if ( !req.userSession ) {
    throw new Error( 401 );
  }
  // do not cache results by default
  req.query.ttl = req.query.ttl || -1;
  InaturalistAPI.setPerPage( req, { default: 20, max: 200 } );
  req.query.page = Number( req.query.page ) || 1;
  const updatesFilters = [
    { term: { resource_type: "Observation" } },
    { term: { notification: "activity" } },
    { terms: { notifier_type: ["Identification", "Comment"] } },
    { term: { subscriber_ids: req.userSession.user_id } }
  ];
  const inverseFilters = [];
  if ( req.query.created_after ) {
    const afterDate = moment.utc( req.query.created_after ).parseZone( );
    if ( afterDate.isValid( ) ) {
      updatesFilters.push( {
        range: {
          created_at: {
            gte: afterDate.format( "YYYY-MM-DDTHH:mm:ssZ" )
          }
        }
      } );
    }
  }
  if ( req.query.viewed === "false" ) {
    inverseFilters.push( { term: { viewed_subscriber_ids: req.userSession.user_id } } );
  }
  if ( req.query.observations_by === "owner" ) {
    updatesFilters.push( {
      term: { resource_owner_id: req.userSession.user_id }
    } );
  } else if ( req.query.observations_by === "following" ) {
    inverseFilters.push( {
      term: { resource_owner_id: req.userSession.user_id }
    } );
  }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_update_actions`,
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
      _source: ["id", "resource_type", "resource_id", "notifier_type",
        "notifier_id", "notification", "created_at", "resource_owner_id",
        "viewed_subscriber_ids"]
    }
  } );
  const hits = _.map( response.hits.hits, h => new UpdateAction( h._source ) );
  // add in foreign keys for object preloading
  _.each( hits, h => {
    if ( h.notifier_type === "Comment" ) {
      h.comment_id = h.notifier_id;
    } else if ( h.notifier_type === "Identification" ) {
      h.identification_id = h.notifier_id;
    }
    if ( _.includes( h.viewed_subscriber_ids, req.userSession.user_id ) ) {
      h.viewed = true;
    } else {
      h.viewed = false;
    }
    delete h.viewed_subscriber_ids;
  } );

  const localeOpts = util.localeOpts( req );
  await Comment.preloadInto( hits, localeOpts );
  await Identification.preloadInto( hits, localeOpts );
  return {
    total_results: response.hits.total.value,
    page: req.query.page || 1,
    per_page: req.query.per_page,
    results: hits
  };
};

ObservationsController.deleted = async req => {
  req.query.ttl = req.query.ttl || -1;
  if ( !req.userSession ) {
    throw new Error( 401 );
  }
  let deletedSince;
  if ( req.query.since ) {
    deletedSince = moment.utc( req.query.since ).parseZone( );
  }
  if ( deletedSince && deletedSince.isValid( ) ) {
    const query = squel.select( ).field( "observation_id" ).from( "deleted_observations" )
      .where( "user_id = ? AND created_at >= ?", req.userSession.user_id, deletedSince.format( ) )
      .order( "observation_id", false )
      .limit( 500 );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return {
      total_results: rows.length,
      page: 1,
      per_page: 500,
      results: _.map( rows, "observation_id" )
    };
  }
  return {
    total_results: 0,
    page: 1,
    per_page: 500,
    results: []
  };
};

ObservationsController.popularFieldValues = async req => {
  const countQuery = _.assignIn( { }, req.query, { annotation_min_score: 0 } );
  const interval = req.query.interval === "week_of_year" ? "week" : "month";
  countQuery.aggs = {
    nested_annotations: {
      nested: { path: "annotations" },
      aggs: {
        attributes: {
          terms: {
            field: "annotations.concatenated_attr_val",
            size: 100
          }
        }
      }
    }
  };
  if ( !req.query.no_histograms ) {
    countQuery.aggs.nested_annotations.aggs.attributes.aggs = {
      back_to_observation: {
        reverse_nested: { },
        aggs: {
          by_date: {
            terms: {
              field: `observed_on_details.${interval}`,
              size: interval === "month" ? 12 : 52
            }
          }
        }
      }
    };
  }
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const resultOptions = { backfill: { min: 1, max: interval === "month" ? 12 : 52 } };
  let results = [];
  const controlledTermsIDs = { };
  _.each( data.aggregations.nested_annotations.attributes.buckets, b => {
    const pieces = b.key.split( "|" );
    controlledTermsIDs[Number( pieces[0] )] = true;
    controlledTermsIDs[Number( pieces[1] )] = true;
    const result = {
      controlled_attribute_id: pieces[0],
      controlled_value_id: pieces[1],
      count: b.doc_count
    };
    if ( !req.query.no_histograms ) {
      result[`${interval}_of_year`] = util.aggBucketsToHash(
        b.back_to_observation.by_date.buckets, resultOptions
      );
    }
    results.push( result );
  } );
  const terms = await ESModel.fetchInstancesByIDsObject( controlledTermsIDs, ControlledTerm );
  _.each( terms, ( t, controlledAttributeID ) => {
    terms[controlledAttributeID] = new ControlledTerm( t );
    terms[controlledAttributeID].values = _.map( t.values, v => ( new ControlledTerm( v ) ) );
  } );
  _.each( results, r => {
    if ( terms[r.controlled_attribute_id] ) {
      r.controlled_attribute = terms[r.controlled_attribute_id];
      delete r.controlled_attribute_id;
    }
    if ( terms[r.controlled_value_id] ) {
      r.controlled_value = terms[r.controlled_value_id];
      delete r.controlled_value_id;
    }
  } );
  results = _.filter( results, r => (
    r.controlled_attribute && r.controlled_value
  ) );

  let unannotatedData;
  // This is a lame hack but this is very slow without some scoping
  if ( req.query.unannotated ) {
    // Unannotated will be an object literal keyed by the controlled attribute
    // ID containing count, the number of observations that do not have an
    // annotation for that attribute, and a histogram, e.g. month_of_year,
    // breaking down that count into date buckets
    const unannotatedQuery = _.assignIn( { size: 0 }, req.query );
    unannotatedQuery.aggs = {};
    const controlledAttributeIds = _.uniq( _.map( results, r => r.controlled_attribute.id ) );
    _.each( controlledAttributeIds, controlledAttributeID => {
      unannotatedQuery.aggs[`missing_${controlledAttributeID}`] = {
        filter: {
          bool: {
            must_not: [
              {
                nested: {
                  path: "annotations",
                  query: {
                    term: { "annotations.controlled_attribute_id": controlledAttributeID }
                  }
                }
              }
            ]
          }
        },
        aggs: {
          by_date: {
            terms: {
              field: `observed_on_details.${interval}`,
              size: interval === "month" ? 12 : 52
            }
          }
        }
      };
    } );
    const unannotatedReq = _.assignIn( { }, req, { query: unannotatedQuery } );
    unannotatedData = await ObservationsController.elasticResults( unannotatedReq );
  }
  const payload = {
    total_results: results.length,
    page: 1,
    per_page: results.length,
    results: _.reverse( _.sortBy( results, "count" ) )
  };
  if ( unannotatedData ) {
    payload.unannotated = _.reduce( unannotatedData.aggregations, ( memo, agg, key ) => {
      const controlledAttributeID = _.last( key.split( "_" ) );
      memo[controlledAttributeID] = {
        count: agg.doc_count,
        [`${interval}_of_year`]: util.aggBucketsToHash(
          agg.by_date.buckets, resultOptions
        )
      };
      return memo;
    }, { } );
  }
  return payload;
};

ObservationsController.qualityMetrics = async req => {
  const query = squel.select( ).field( "*" )
    .from( "quality_metrics" )
    .where( "observation_id = ?", req.params.id );
  const { rows } = await pgClient.connection.query( query.toString( ) );
  await ESModel.fetchBelongsTo( rows, User );
  return {
    total_results: rows.length,
    page: 1,
    per_page: rows.length,
    results: rows
  };
};

ObservationsController.subscriptions = async req => {
  if ( !req.userSession ) {
    throw new Error( 401 );
  }
  const query = squel.select( ).field( "s.*" )
    .from( "observations o" )
    .join( "subscriptions s", null, `(
      (s.resource_type='Observation' AND s.resource_id=o.id) OR
      (s.resource_type='User' and s.resource_id=o.user_id) )` )
    .where( "o.id = ?", req.params.id )
    .where( "s.user_id = ?", req.userSession.user_id );
  const { rows } = await pgClient.connection.query( query.toString( ) );
  return {
    total_results: rows.length,
    page: 1,
    per_page: rows.length,
    results: rows
  };
};

ObservationsController.identificationCategories = async req => {
  const countQuery = _.assignIn( { }, req.query );
  countQuery.aggs = {
    categories: { terms: { field: "identification_categories", size: 10 } }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const buckets = _.map( data.aggregations.categories.buckets, b => (
    { category: b.key, count: b.doc_count }
  ) );
  return {
    total_results: _.size( buckets ),
    page: 1,
    per_page: _.keys( buckets ).length,
    results: _.sortBy( buckets, b => -1 * b.count )
  };
};

ObservationsController.similarSpecies = async req => {
  if ( !req.query.taxon_id ) {
    throw new Error( 422 );
    // { error: "Missing required parameter `taxon_id`", status: 422 }
  }
  const taxon = await Taxon.findByID( req.query.taxon_id );
  if ( !taxon ) {
    throw new Error( 422 );
    // { error: `Unknown taxon ${req.query.taxon_id}`, status: 422 }
  }
  if ( taxon.rank_level > 20 ) {
    throw new Error( 422 );
    // { error: `Taxon ${req.query.taxon_id} is not genus or finer`, status: 422 }
  }
  const countQuery = _.assignIn( { }, req.query, {
    taxon_id: null,
    ident_taxon_id: taxon.id
  } );
  if ( Taxon.homo ) {
    countQuery.without_taxon_id = Taxon.homo.id;
  }
  countQuery.aggs = {
    categories: { terms: { field: "ident_taxon_ids", size: 200, exclude: taxon.ancestor_ids } }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  const data = await ObservationsController.elasticResults( countReq );
  const buckets = _.map( data.aggregations.categories.buckets, b => ( {
    taxon_id: b.key,
    count: b.doc_count
  } ) );
  const localeOpts = util.localeOpts( req );
  const prepareTaxon = t => {
    t.prepareForResponse( localeOpts );
  };
  const taxonOpts = {
    modifier: prepareTaxon,
    source: { excludes: ["photos"] }
  };
  await ESModel.fetchBelongsTo( buckets, Taxon, taxonOpts );
  await TaxaController.assignAncestors( { }, _.map( buckets, "taxon" ), { localeOpts, ancestors: true } );
  const sameRankResults = { };
  _.each( buckets, b => {
    let bucketSameRankTaxon;
    if ( b.taxon.rank_level === taxon.rank_level
      && b.taxon.iconic_taxon_id === taxon.iconic_taxon_id
      && b.taxon.id !== taxon.id
      && b.taxon.is_active ) {
      bucketSameRankTaxon = b.taxon;
    }
    if ( bucketSameRankTaxon ) {
      sameRankResults[bucketSameRankTaxon.id] = sameRankResults[bucketSameRankTaxon.id] || {
        taxon: bucketSameRankTaxon,
        count: 0
      };
      sameRankResults[bucketSameRankTaxon.id].count += b.count;
      delete sameRankResults[bucketSameRankTaxon.id].taxon.ancestors;
    }
  } );
  let results = _.sortBy( _.values( sameRankResults ), "count" );
  _.reverse( results );
  results = results.slice( 0, 24 );
  return {
    total_results: results.length,
    page: 1,
    per_page: results.length,
    results
  };
};

module.exports = ObservationsController;
