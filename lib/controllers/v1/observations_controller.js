const _ = require( "lodash" );
const moment = require( "moment" );
const querystring = require( "querystring" );
const extend = require( "node.extend" );
const squel = require( "squel" );
const { observations } = require( "inaturalistjs" );
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

const ObservationsController = { };

const ElasticsearchTaxonNamesFields = [
  "taxon.names_ar",
  "taxon.names_bg",
  "taxon.names_br",
  "taxon.names_ca",
  "taxon.names_cs",
  "taxon.names_da",
  "taxon.names_de",
  "taxon.names_el",
  "taxon.names_en",
  "taxon.names_es",
  "taxon.names_et",
  "taxon.names_eu",
  "taxon.names_fi",
  "taxon.names_fr",
  "taxon.names_gl",
  "taxon.names_haw",
  "taxon.names_id",
  "taxon.names_it",
  "taxon.names_iw",
  "taxon.names_ja",
  "taxon.names_ko",
  "taxon.names_lb",
  "taxon.names_mi",
  "taxon.names_mk",
  "taxon.names_myn",
  "taxon.names_nl",
  "taxon.names_oc",
  "taxon.names_pt",
  "taxon.names_ru",
  "taxon.names_sci",
  "taxon.names_sq",
  "taxon.names_zh",
  "taxon.names_zh-CN"
];

ObservationsController.create = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.create, req ).then( r => {
    const arr = [{ observation_id: r["0"].id }];
    const localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].observation ) );
  } ).catch( callback );
};

ObservationsController.update = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.update, req ).then( r => {
    const arr = [{ observation_id: r["0"].id }];
    const localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].observation ) );
  } ).catch( callback );
};

ObservationsController.delete = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.delete, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.fave = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.fave, req ).then( ( ) => {
    const arr = [{ observation_id: req.params.id }];
    const localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].observation ) );
  } ).catch( callback );
};

ObservationsController.unfave = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.unfave, req ).then( ( ) => {
    const arr = [{ observation_id: req.params.id }];
    const localeOpts = util.localeOpts( req );
    Observation.preloadInto( arr, localeOpts, ( ) => callback( null, arr[0].observation ) );
  } ).catch( callback );
};

ObservationsController.review = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.review, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.unreview = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.unreview, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.setQualityMetric = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.setQualityMetric, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.deleteQualityMetric = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.deleteQualityMetric, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.subscribe = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.subscribe, req )
    .then( ( ) => callback( null, true ) ).catch( callback );
};

ObservationsController.taxonSummary = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.taxonSummary, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.viewedUpdates = ( req, callback ) => {
  InaturalistAPI.iNatJSWrap( observations.viewedUpdates, req )
    .then( r => callback( null, r ) ).catch( callback );
};

ObservationsController.show = ( req, callback ) => {
  const ids = _.filter( req.params.id.split( "," ), _.identity ).slice( 0, 200 );
  // also preserve the ttl and locale params
  req.query = {
    id: ids,
    ttl: req.query.ttl,
    locale: req.query.locale,
    preferred_place_id: req.query.preferred_place_id,
    include_new_projects: req.query.include_new_projects,
    details: "all",
    per_page: ids.length
  };
  ObservationsController.search( req, callback );
};

ObservationsController.search = ( req, callback ) => {
  if ( req.query.return_bounds === "true" ) {
    req.query.aggs = {
      bbox: {
        geo_bounds: {
          field: "location"
        }
      }
    };
  }
  ObservationsController.resultsForRequest( req, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const localeOpts = util.localeOpts( req );
    let preloadCallback;
    if ( req.query.only_id && req.query.only_id !== "false" ) {
      return void callback( null, data );
    }
    if ( req.query.details === "all" ) {
      preloadCallback = Observation.preloadAllAssociations;
    } else {
      preloadCallback = Observation.preloadMinimal;
    }

    // prepare custom preload function for current session
    const preloadAndReturn = returnData => {
      preloadCallback( returnData.results, localeOpts, errr => {
        if ( errr ) { return void callback( errr ); }
        if ( !( req.query.only_id && req.query.only_id !== "false" ) ) {
          returnData.results = _.map( returnData.results, r => (
            new Observation( r, { userSession: req.userSession } )
          ) );
        }
        callback( null, returnData );
      } );
    };

    // newProjectsContaining
    if ( req.query.include_new_projects ) {
      const projectsPromise = ObservationsController.loadNewProjectsPromise( data.results );
      projectsPromise.then( ( ) => {
        preloadAndReturn( data );
      } );
    } else {
      preloadAndReturn( data );
    }
  } );
};

ObservationsController.loadNewProjectsPromise = obs => (
  // newProjectsContaining
  obs.reduce( ( promiseChain, item ) => (
    promiseChain.then( ( ) => new Promise( resolve => {
      ObservationsController.newProjectsContaining( item, ( err, projectIDs ) => {
        item.non_traditional_projects = _.map( projectIDs, id => ( { project_id: id } ) );
        resolve( );
      } );
    } ) )
  ), Promise.resolve( ) )
);

// this needs to remain a named function
ObservationsController.elasticResults = function observationElasticResults( req, callback ) {
  ObservationsController.reqToElasticQuery( req, ( err, query ) => {
    if ( err ) { return void callback( err ); }
    const opts = { excludes: ["taxon.names", "taxon.photos", "taxon.taxon_photos", "taxon.names_*"] };
    if ( req.query.only_id && req.query.only_id !== "false" ) { opts.includes = ["id"]; }
    ESModel.elasticResults( req, query, "observations", opts, callback );
  } );
};

ObservationsController.reqToElasticQuery = ( req, callback ) => {
  ObservationsController.reqToElasticQueryComponents( req, ( err, components ) => {
    if ( err ) { return void callback( err ); }
    const elasticQuery = {
      where: components.search_wheres,
      filters: components.search_filters,
      inverse_filters: components.inverse_filters,
      grouped_inverse_filters: components.grouped_inverse_filters,
      per_page: InaturalistAPI.perPage( req, { default: 30, max: 200 } ),
      page: req.query.page || 1,
      sort: components.sort
    };
    callback( null, elasticQuery );
  } );
};

ObservationsController.applyProjectRules = ( req, callback ) => {
  let params = _.assignIn( { }, req.query );
  // if given a project whose rules to apply, fetch those
  // rules and call this method again with the merged params
  req.inat.apply_project_rules_for.searchParams( ( err, rules ) => {
    delete params.apply_project_rules_for;
    delete req.inat.apply_project_rules_for;
    params = _.assignIn( { }, params, rules );
    ObservationsController.reqToElasticQueryComponents(
      _.assignIn( { }, req, { query: params } ), callback
    );
  } );
};

ObservationsController.applyInverseProjectRules = ( req, callback ) => {
  let params = _.assignIn( { }, req.query );
  req.inat.not_matching_project_rules_for.searchParams( ( err, r ) => {
    delete params.not_matching_project_rules_for;
    delete req.inat.not_matching_project_rules_for;
    ObservationsController.reqToElasticQueryComponents( _.assignIn( { }, req, { query: r } ),
      ( errr, components ) => {
        if ( errr ) { return void callback( errr ); }
        params = _.assignIn( { }, params, { grouped_inverse_filters: components.search_filters } );
        ObservationsController.reqToElasticQueryComponents(
          _.assignIn( { }, req, { query: params } ), callback
        );
      } );
  } );
};

ObservationsController.applyListTaxaFilters = ( req, callback ) => {
  const params = _.assignIn( { }, req.query );
  // if given a list, fetch its taxon_ids and use those as params
  req.inat.list.taxonIDs( ( err, ids ) => {
    delete params.list_id;
    delete req.inat.list;
    params.taxon_ids = util.paramArray( params.taxon_ids ) || [];
    params.taxon_ids = params.taxon_ids.concat( ids );
    ObservationsController.reqToElasticQueryComponents(
      _.assignIn( { }, req, { query: params } ), callback
    );
  } );
};

ObservationsController.applyNotInListTaxaFilters = ( req, callback ) => {
  const params = _.assignIn( { }, req.query );
  // if given a list, fetch its taxon_ids and use those as without_ params
  req.inat.not_in_list.taxonIDs( ( err, ids ) => {
    delete params.not_in_list_id;
    delete req.inat.not_in_list;
    params.without_taxon_id = util.paramArray( params.without_taxon_id ) || [];
    params.without_taxon_id = params.without_taxon_id.concat( ids );
    ObservationsController.reqToElasticQueryComponents(
      _.assignIn( { }, req, { query: params } ), callback
    );
  } );
};

ObservationsController.applyUnobservedByUserFilters = ( req, callback ) => {
  // if given a list, fetch its taxon_ids and use those as params
  const observedReq = {
    query: {
      user_id: req.inat.unobservedByUser.id,
      hrank: "species",
      per_page: 10000
    }
  };
  // preserve the taxon_id and without_taxon_id for faster queries, and
  // ignore the rest so we have a complete species list for the user
  if ( req.query.taxon_id ) {
    observedReq.query.taxon_id = req.query.taxon_id;
  }
  if ( req.query.without_taxon_id ) {
    observedReq.query.without_taxon_id = req.query.without_taxon_id;
  }
  ObservationsController.leafCounts( observedReq, ( err, taxonCounts ) => {
    if ( err ) { return void callback( err ); }
    let withoutTaxonIDs = _.map( taxonCounts, c => c.taxon_id );
    if ( req.query.without_taxon_id ) {
      // combining with without_taxon_id parameter
      withoutTaxonIDs = withoutTaxonIDs
        .concat( util.paramArray( req.query.without_taxon_id ) );
    }
    const params = _.assignIn( { }, req.query );
    delete params.unobserved_by_user_id;
    delete req.inat.unobservedByUser;
    params.without_taxon_id = withoutTaxonIDs;
    ObservationsController.reqToElasticQueryComponents(
      _.assignIn( { }, req, { query: params } ), callback
    );
  } );
};

ObservationsController.histogram = ( req, callback ) => {
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
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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
    callback( null, {
      total_results: _.size( results[req.query.interval] ),
      page: 1,
      per_page: _.size( results[req.query.interval] ),
      results
    } );
  } );
};

ObservationsController.projectRulesQueryFilters = ( collection, callback ) => {
  const collectParamsHash = {};
  if ( collection.project_type === "umbrella" ) {
    return void callback( null, [{ term: { id: -1 } }] );
  }
  if ( collection.project_type !== "collection" ) {
    return void callback( null, [{ term: { project_ids: collection.id } }] );
  }
  // make an object of all the obs search parameters for this project
  _.each( collection.search_parameters, c => {
    // make sure all values are strings, as they would be in HTTP GET params
    // this will comma-concatenate arrays (e.g. [a,b,c] => "a,b,c")
    collectParamsHash[c.field] = _.toString( c.value );
  } );
  if ( _.isEmpty( collectParamsHash ) ) {
    // The new-style project does not have search parameters.
    // Return an unmatchable filter indicating no obervations in this project
    return void callback( null, [{ term: { id: -1 } }] );
  }
  // turn the HTTP-like params into ES query filters and return

  ObservationsController.reqToElasticQueryComponents( { query: collectParamsHash },
    ( err, params ) => {
      if ( err ) { return void callback( err ); }
      callback( null, params.search_filters, params.inverse_filters );
    } );
};

ObservationsController.projectsQueryFilters = ( projects, callback ) => {
  const queryFilters = [];
  // call the async function projectRulesQueryFilters for all projects
  // return an array of objects with each project and its filters
  const requests = projects.reduce( ( promiseChain, project ) => (
    promiseChain.then( ( ) => new Promise( resolve => {
      ObservationsController.projectRulesQueryFilters( project, ( err, filters, inverse ) => {
        if ( err ) { return void callback( err ); }
        queryFilters.push( { project, filters, inverse_filters: inverse } );
        resolve( );
      } );
    } ) )
  ), Promise.resolve( ) );
  requests.then( ( ) => {
    callback( null, queryFilters );
  } );
};

const removeProjectID = ( ids, project ) => {
  // remove the umbrella ID from the `project_id` param
  _.remove( ids, id => (
    ( Number( id ) && Number( id ) === project.id )
    || ( id === project.slug )
  ) );
};

ObservationsController.applyCollectionProjectRules = ( req, options = { }, callback ) => {
  const { inverse } = options;
  const projects = inverse ? req.inat.not_in_project : req.inat.project;
  if ( inverse ) {
    delete req.inat.not_in_project;
  } else {
    delete req.inat.project;
  }
  const queryProjectIDs = util.paramArray(
    inverse ? req.query.not_in_project : req.query.project_id
  );
  // only look at collection and umbrella projects
  let projectsWithRules = [];
  let containsNewProjects = false;
  _.each( projects, project => {
    if ( req.query.collection_preview ) {
      project.project_type = "collection";
    }
    if ( project.project_type === "umbrella" ) {
      // remove the umbrella ID from the `project_id` param
      removeProjectID( queryProjectIDs, project );
      // use rules from umbrella subprojects
      const subprojects = _.compact( _.map( project.project_observation_rules, "project" ) );
      projectsWithRules = projectsWithRules.concat( subprojects );
      containsNewProjects = true;
    } else if ( project.project_type === "collection" ) {
      // remove the new-style project ID from the `project_id` param
      removeProjectID( queryProjectIDs, project );
      if ( !_.isEmpty( project.search_parameters ) ) {
        projectsWithRules.push( project );
      }
      containsNewProjects = true;
    }
  } );
  if ( _.isEmpty( projectsWithRules ) ) {
    if ( containsNewProjects ) {
      const newQuery = _.assignIn( { }, req.query );
      if ( inverse ) {
        newQuery.not_in_project = queryProjectIDs;
      } else {
        // the user requested to filter by a new-style project, but for some reason
        // none of them have search parameters. Return an unmatchable filter
        // indicating no obervations match the rules of these projects
        newQuery.collectionProjectFilters = [{ term: { id: -1 } }];
        // override the project_id to exclude IDs of new-style projects
        newQuery.project_id = queryProjectIDs;
      }
      ObservationsController.reqToElasticQueryComponents(
        { query: newQuery, inat: req.inat }, callback
      );
    } else {
      // none of the request projects are new-style, so pass through the request
      ObservationsController.reqToElasticQueryComponents( req, callback );
    }
    return;
  }
  ObservationsController.projectsQueryFilters( projectsWithRules, ( err, queryFilters ) => {
    if ( err ) { return void callback( err ); }
    const newQuery = _.assignIn( { }, req.query );
    const shoulds = [];
    // all the project filter must be true
    _.each( queryFilters, q => {
      shoulds.push( {
        bool: {
          must: q.filters,
          must_not: q.inverse_filters
        }
      } );
    } );
    // override the project_id to exclude IDs of new-style projects
    if ( inverse ) {
      newQuery.not_in_project = queryProjectIDs;
      newQuery.collectionProjectInverseFilters = shoulds;
    } else {
      newQuery.project_id = queryProjectIDs;
      newQuery.collectionProjectFilters = shoulds;
    }
    ObservationsController.reqToElasticQueryComponents(
      { query: newQuery, inat: req.inat }, callback
    );
  } );
};

ObservationsController.reqToElasticQueryComponents = ( req, callback ) => {
  if ( req.inat ) {
    if ( req.inat.apply_project_rules_for ) {
      return void ObservationsController.applyProjectRules( req, callback );
    }
    if ( req.inat.not_matching_project_rules_for ) {
      return void ObservationsController.applyInverseProjectRules( req, callback );
    }
    if ( req.inat.list ) {
      return void ObservationsController.applyListTaxaFilters( req, callback );
    }
    if ( req.inat.not_in_list ) {
      return void ObservationsController.applyNotInListTaxaFilters( req, callback );
    }
    if ( req.inat.unobservedByUser ) {
      return void ObservationsController.applyUnobservedByUserFilters( req, callback );
    }
    if ( req.inat.project ) {
      return void ObservationsController.applyCollectionProjectRules( req, { }, callback );
    }
    if ( req.inat.not_in_project ) {
      return void ObservationsController.applyCollectionProjectRules(
        req, { inverse: true }, callback
      );
    }
  }
  // clone the params object
  const params = _.assignIn( { }, req.query );
  let searchFilters = params.filters || [];
  let inverseFilters = params.inverse_filters || [];

  if ( params.has && _.isArray( params.has ) ) {
    _.each( params.has, p => {
      params[p] = "true";
    } );
  }
  if ( params.q ) {
    const searchOn = params.search_on;
    let fields;
    switch ( searchOn ) {
      case "names":
        fields = ElasticsearchTaxonNamesFields;
        break;
      case "tags":
        fields = ["tags"];
        break;
      case "description":
        fields = ["description"];
        break;
      case "place":
        fields = ["place_guess"];
        break;
      default:
        fields = ElasticsearchTaxonNamesFields.concat( [
          "tags", "description", "place_guess"
        ] );
    }
    searchFilters.push( {
      multi_match: {
        query: params.q,
        operator: "and",
        fields
      }
    } );
  }
  if ( params.taxon_name ) {
    searchFilters.push( {
      multi_match: {
        query: params.taxon_name,
        operator: "and",
        fields: ElasticsearchTaxonNamesFields
      }
    } );
  }

  const observedOnParam = params.observed_on || params.on;
  const observedOn = observedOnParam ? moment( observedOnParam ) : null;
  if ( observedOn && observedOn.isValid( ) ) {
    observedOn.parseZone( );
    params.day = params.day || observedOn.date( );
    params.month = params.month || observedOn.month( ) + 1;
    params.year = params.year || observedOn.year( );
  }

  let userIDs = util.paramArray( params.user_id ) || [];
  userIDs = userIDs.concat( util.paramArray( params.user_login ) );
  const stringUserIDs = [];
  const numericUserIDs = [];
  if ( !_.isEmpty( userIDs ) ) {
    _.each( userIDs, userID => {
      if ( Number( userID ) ) {
        numericUserIDs.push( Number( userID ) );
      } else {
        stringUserIDs.push( userID );
      }
    } );
  }
  params.user_id = numericUserIDs.join( "," );
  params.user_login = stringUserIDs.join( "," );

  if ( params.photo_license && !_.isArray( params.photo_license ) ) {
    params.photo_license = params.photo_license.toLowerCase( );
  }
  if ( params.sound_license && !_.isArray( params.sound_license ) ) {
    params.sound_license = params.sound_license.toLowerCase( );
  }
  _.each( [{ http_param: "rank", es_field: "taxon.rank" },
    { http_param: "user_id", es_field: "user.id" },
    { http_param: "user_login", es_field: "user.login" },
    { http_param: "day", es_field: "observed_on_details.day" },
    { http_param: "month", es_field: "observed_on_details.month" },
    { http_param: "year", es_field: "observed_on_details.year" },
    { http_param: "week", es_field: "observed_on_details.week" },
    { http_param: "site_id", es_field: "site_id" },
    { http_param: "id", es_field: "id" },
    { http_param: "license", es_field: "license_code" },
    { http_param: "photo_license", es_field: ["photos.license_code", "photo_licenses"] },
    { http_param: "sound_license", es_field: ["sounds.license_code", "sound_licenses"] },
    { http_param: "oauth_application_id", es_field: "oauth_application_id" }
  ], filter => {
    if ( params[filter.http_param] && params[filter.http_param] !== "any" ) {
      if ( _.isArray( filter.es_field ) ) {
        searchFilters.push( {
          bool: {
            should: _.map( filter.es_field,
              field => esClient.termFilter( field, params[filter.http_param] ) )
          }
        } );
      } else {
        searchFilters.push( esClient.termFilter(
          filter.es_field, params[filter.http_param]
        ) );
      }
    }
  } );

  _.each( [{ http_param: "introduced", es_field: "taxon.introduced" },
    { http_param: "threatened", es_field: "taxon.threatened" },
    { http_param: "native", es_field: "taxon.native" },
    { http_param: "endemic", es_field: "taxon.endemic" },
    { http_param: "id_please", es_field: "id_please" },
    { http_param: "out_of_range", es_field: "out_of_range" },
    { http_param: "mappable", es_field: "mappable" },
    { http_param: "captive", es_field: "captive" },
    { http_param: "taxon_is_active", es_field: "taxon.is_active" }
  ], filter => {
    if ( params[filter.http_param] === "true" ) {
      searchFilters.push( esClient.termFilter( filter.es_field, true ) );
    } else if ( params[filter.http_param] === "false" ) {
      searchFilters.push( esClient.termFilter( filter.es_field, false ) );
    }
  } );

  _.each( [{ http_param: "photos", es_field: ["photos.url", "photos_count"] },
    { http_param: "sounds", es_field: ["sounds", "sounds_count"] },
    { http_param: "geo", es_field: "geojson" },
    { http_param: "identified", es_field: "taxon" },
    { http_param: "acc", es_field: "positional_accuracy" }
  ], filter => {
    let fieldFilter;
    if ( _.isArray( filter.es_field ) ) {
      fieldFilter = {
        bool: {
          should: _.map( filter.es_field, f => ( { exists: { field: f } } ) )
        }
      };
    } else {
      fieldFilter = { exists: { field: filter.es_field } };
    }

    if ( params[filter.http_param] === "true" ) {
      searchFilters.push( fieldFilter );
    } else if ( params[filter.http_param] === "false" ) {
      inverseFilters.push( fieldFilter );
    }
  } );

  // include the taxon plus all of its descendants.
  // Every taxon has its own ID in ancestor_ids
  if ( params.taxon_id || params.taxon_ids ) {
    searchFilters.push( esClient.termFilter(
      "taxon.ancestor_ids", params.taxon_id || params.taxon_ids
    ) );
  }

  if ( params.ident_taxon_id || params.ident_taxon_ids ) {
    searchFilters.push( esClient.termFilter(
      "ident_taxon_ids", params.ident_taxon_id || params.ident_taxon_ids
    ) );
  }

  if ( params.without_taxon_id ) {
    inverseFilters.push( esClient.termFilter(
      "taxon.ancestor_ids", params.without_taxon_id
    ) );
  }

  if ( params.not_id ) {
    inverseFilters.push( {
      terms: { id: util.paramArray( params.not_id ) }
    } );
  }

  if ( params.not_user_id ) {
    inverseFilters.push( {
      terms: { "user.id": util.paramArray( params.not_user_id ) }
    } );
  }

  if ( params.verifiable === "true" ) {
    searchFilters.push(
      esClient.termFilter( "quality_grade", ["needs_id", "research"] )
    );
  } else if ( params.verifiable === "false" ) {
    inverseFilters.push( { terms: { quality_grade: ["needs_id", "research"] } } );
  }

  const createdOn = params.created_on ? moment( params.created_on ) : null;
  if ( createdOn && createdOn.isValid( ) ) {
    createdOn.parseZone( );
    searchFilters.push( esClient.termFilter(
      "created_at_details.day", createdOn.date( )
    ) );
    searchFilters.push( esClient.termFilter(
      "created_at_details.month", createdOn.month( ) + 1
    ) );
    searchFilters.push( esClient.termFilter(
      "created_at_details.year", createdOn.year( )
    ) );
  }

  params.project_id = params.project_id || params.project_ids;
  const originalProjectFilters = [];
  if ( params.project_id
    && !( _.isArray( params.project_id )
    && _.isEmpty( params.project_id ) ) ) {
    originalProjectFilters.push( esClient.termFilter( "project_ids", params.project_id ) );
    if ( params.pcid ) {
      if ( params.pcid === "true" ) {
        originalProjectFilters.push( esClient.termFilter(
          "project_ids_with_curator_id", params.project_id
        ) );
      } else if ( params.pcid === "false" ) {
        originalProjectFilters.push( esClient.termFilter(
          "project_ids_without_curator_id", params.project_id
        ) );
      }
    }
  } else if ( params.pcid ) {
    if ( params.pcid === "true" ) {
      searchFilters.push( {
        exists: {
          field: "project_ids_with_curator_id"
        }
      } );
    } else if ( params.pcid === "false" ) {
      searchFilters.push( {
        exists: {
          field: "project_ids_without_curator_id"
        }
      } );
    }
  }
  // there are filters from new-style projects
  if ( !_.isEmpty( params.collectionProjectFilters ) ) {
    let should = params.collectionProjectFilters;
    // combine them as an OR with existing project params
    if ( !_.isEmpty( originalProjectFilters ) ) {
      should = should.concat( { bool: { must: originalProjectFilters } } );
    }
    searchFilters.push( {
      bool: { should }
    } );
  } else if ( !_.isEmpty( originalProjectFilters ) ) {
    // there are some regular project filters to add
    searchFilters = searchFilters.concat( originalProjectFilters );
  }

  if ( params.collectionProjectInverseFilters ) {
    inverseFilters = inverseFilters.concat( params.collectionProjectInverseFilters );
  }

  if ( params.not_in_project ) {
    inverseFilters.push( esClient.termFilter( "project_ids", params.not_in_project ) );
  }
  if ( params.hrank || params.lrank ) {
    searchFilters.push( {
      range: {
        "taxon.rank_level": {
          gte: Taxon.ranks[params.lrank] || 0,
          lte: Taxon.ranks[params.hrank] || 100
        }
      }
    } );
  }
  if ( params.quality_grade && params.quality_grade !== "any" ) {
    searchFilters.push( esClient.termFilter(
      "quality_grade", params.quality_grade
    ) );
  }
  if ( params.identifications === "most_agree" ) {
    searchFilters.push( esClient.termFilter( "identifications_most_agree", true ) );
  } else if ( params.identifications === "some_agree" ) {
    searchFilters.push( esClient.termFilter( "identifications_some_agree", true ) );
  } else if ( params.identifications === "most_disagree" ) {
    searchFilters.push( esClient.termFilter( "identifications_most_disagree", true ) );
  }

  if ( params.nelat || params.nelng || params.swlat || params.swlng ) {
    searchFilters.push( {
      envelope: {
        geojson: {
          nelat: params.nelat,
          nelng: params.nelng,
          swlat: params.swlat,
          swlng: params.swlng
        }
      }
    } );
  }

  if ( params.lat && params.lng ) {
    searchFilters.push( {
      geo_distance: {
        distance: `${params.radius || 10}km`,
        location: { lat: params.lat, lon: params.lng }
      }
    } );
  }

  if ( params.iconic_taxa ) {
    let includesUnknown = false;
    const names = util.paramArray( params.iconic_taxa );
    const iconicTaxonIDs = _.compact( _.map( names, n => {
      if ( n === "unknown" ) { includesUnknown = true; }
      return Taxon.iconicTaxonID( n );
    } ) );
    if ( includesUnknown ) {
      searchFilters.push( {
        bool: {
          should: [
            { terms: { "taxon.iconic_taxon_id": iconicTaxonIDs } },
            { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" } } } }
          ]
        }
      } );
    } else {
      searchFilters.push( esClient.termFilter(
        "taxon.iconic_taxon_id", iconicTaxonIDs
      ) );
    }
  }

  if ( params.viewer_id ) {
    if ( params.reviewed === "true" ) {
      searchFilters.push( esClient.termFilter(
        "reviewed_by", params.viewer_id
      ) );
    } else if ( params.reviewed === "false" ) {
      inverseFilters.push( { term: { reviewed_by: params.viewer_id } } );
    }
  }

  let dateFilter = util.dateRangeFilter(
    "time_observed_at", params.d1, params.d2, "observed_on_details.date"
  );
  if ( dateFilter ) {
    searchFilters.push( dateFilter );
  }
  dateFilter = util.dateRangeFilter( "created_at", params.created_d1, params.created_d2 );
  if ( dateFilter ) {
    searchFilters.push( dateFilter );
  }

  if ( params.featured_observation_id ) {
    inverseFilters.push( { term: { id: params.featured_observation_id } } );
  }

  if ( params.updated_since ) {
    const parsedDate = moment.utc( Date.parse( params.updated_since ) );
    if ( parsedDate && parsedDate.isValid( ) ) {
      searchFilters.push( {
        range: { updated_at: { gte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } }
      } );
    }
  }

  if ( params.user_before ) {
    let parsedDate = moment( );
    const daysPattern = /^(\d+)d$/;
    const weeksPattern = /^(\d+)w$/;
    const monthsPattern = /^(\d+)m$/;
    if ( params.user_before.match( daysPattern ) ) {
      parsedDate = parsedDate.subtract( params.user_before.match( daysPattern )[1], "days" );
    } else if ( params.user_before.match( /(\d+)w/ ) ) {
      parsedDate = parsedDate.subtract( params.user_before.match( weeksPattern )[1], "weeks" );
    } else if ( params.user_before.match( /(\d+)m/ ) ) {
      parsedDate = parsedDate.subtract( params.user_before.match( monthsPattern )[1], "months" );
    } else {
      parsedDate = moment.utc( Date.parse( params.user_before ) );
    }
    if ( parsedDate && parsedDate.isValid( ) ) {
      searchFilters.push( {
        range: { "user.created_at": { lte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } }
      } );
    }
  }

  if ( params.user_after ) {
    let parsedDate = moment( );
    const daysPattern = /^(\d+)d$/;
    const weeksPattern = /^(\d+)w$/;
    const monthsPattern = /^(\d+)m$/;
    if ( params.user_after.match( daysPattern ) ) {
      parsedDate = parsedDate.subtract( params.user_after.match( daysPattern )[1], "days" );
    } else if ( params.user_after.match( /(\d+)w/ ) ) {
      parsedDate = parsedDate.subtract( params.user_after.match( weeksPattern )[1], "weeks" );
    } else if ( params.user_after.match( /(\d+)m/ ) ) {
      parsedDate = parsedDate.subtract( params.user_after.match( monthsPattern )[1], "months" );
    } else {
      parsedDate = moment.utc( Date.parse( params.user_after ) );
    }
    if ( parsedDate && parsedDate.isValid( ) ) {
      searchFilters.push( {
        range: { "user.created_at": { gte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } }
      } );
    }
  }

  if ( params.observed_before ) {
    const parsedDate = moment.utc( Date.parse( params.observed_before ) );
    if ( parsedDate && parsedDate.isValid( ) ) {
      searchFilters.push( {
        range: { observed_on: { lte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } }
      } );
    }
  }

  if ( params.observed_after ) {
    const parsedDate = moment.utc( Date.parse( params.observed_after ) );
    if ( parsedDate && parsedDate.isValid( ) ) {
      searchFilters.push( {
        range: { observed_on: { gte: parsedDate.format( "YYYY-MM-DDTHH:mm:ssZ" ) } }
      } );
    }
  }

  if ( req.inat && req.inat.ident_users ) {
    const identUserIDs = _.map( req.inat.ident_users, "id" );
    const nestedFilter = esClient.termFilter( "identifications.user.id", identUserIDs );
    searchFilters.push( {
      bool: {
        should: [
          esClient.termFilter( "identifier_user_ids", identUserIDs ),
          {
            nested: {
              path: "identifications",
              query: {
                bool: {
                  filter: nestedFilter
                }
              }
            }
          }
        ]
      }
    } );
  }

  if ( params.term_id ) {
    const initialFilters = [];
    initialFilters.push(
      esClient.termFilter( "annotations.controlled_attribute_id", params.term_id )
    );
    initialFilters.push( { range: { "annotations.vote_score": { gte: 0 } } } );
    const nestedQuery = {
      nested: {
        path: "annotations",
        query: {
          bool: {
            filter: initialFilters
          }
        }
      }
    };
    if ( params.term_value_id ) {
      nestedQuery.nested.query.bool.filter.push(
        esClient.termFilter( "annotations.controlled_value_id", params.term_value_id )
      );
    }
    searchFilters.push( nestedQuery );
    if ( params.without_term_value_id ) {
      const withoutFilters = [];
      withoutFilters.push(
        esClient.termFilter( "annotations.controlled_attribute_id", params.term_id )
      );
      withoutFilters.push(
        esClient.termFilter( "annotations.controlled_value_id", params.without_term_value_id )
      );
      inverseFilters.push( {
        nested: {
          path: "annotations",
          query: {
            bool: {
              filter: withoutFilters
            }
          }
        }
      } );
    }
  } else if ( params.annotation_min_score || params.annotation_min_score === 0 ) {
    const nestedQuery = {
      nested: {
        path: "annotations",
        query: {
          bool: {
            filter: [
              { range: { "annotations.vote_score": { gte: params.annotation_min_score } } }
            ]
          }
        }
      }
    };
    searchFilters.push( nestedQuery );
  } else if ( params.without_term_id ) {
    const nestedQuery = {
      nested: {
        path: "annotations",
        query: {
          bool: {
            filter: [
              { term: { "annotations.controlled_attribute_id": params.without_term_id } }
            ]
          }
        }
      }
    };
    inverseFilters.push( nestedQuery );
  }

  if ( req.userSession
    && req.userSession.blocks
    && !req.params.id
  ) {
    let usersToFilter = req.userSession.blocks.blockedUsers;
    if ( params.user_id ) {
      usersToFilter = _.filter( usersToFilter, u => u.id !== params.user_id );
    }
    if ( params.user_login ) {
      usersToFilter = _.filter( usersToFilter, u => u.login !== params.user_login );
    }
    usersToFilter = usersToFilter.concat( req.userSession.blocks.blockedByUsers );
    inverseFilters.push(
      esClient.termFilter( "user.id", usersToFilter.map( u => u.id ) )
    );
  }

  if ( params.place_id && params.place_id !== "any" ) {
    const publicPlaceFilter = esClient.termFilter( "place_ids", params.place_id );
    if ( req.userSession ) {
      const privatePlaceFilter = esClient.termFilter( "private_place_ids", params.place_id );
      searchFilters.push( {
        bool: {
          should: [
            publicPlaceFilter,
            {
              bool: {
                must: [
                  privatePlaceFilter,
                  { term: { "user.id": req.userSession.user_id } }
                ]
              }
            }
          ]
        }
      } );
    } else {
      searchFilters.push( publicPlaceFilter );
    }
  }

  // the default "extended" qs query parser for express is great
  // for many things, except when there are escaped brackets in
  // params keys (e.g. field:Origin%2B%5BIUCN%2BRed%2BList%5D)
  // using `querystring` here, which is the default express "simple"
  // query parser
  const simpleParsedParams = req._parsedUrl ? querystring.parse( req._parsedUrl.query ) : { };
  _.each( simpleParsedParams, ( v, k ) => {
    // use a nested query to search within a single nested
    // object and not across all nested objects
    const matches = k.match( /^field:(.*)/ );
    if ( _.isEmpty( matches ) ) { return; }
    // this and Rails will turn + and %20 into spaces
    const fieldName = matches[1].replace( /(%20|\+)/g, " " );
    const nestedQuery = {
      nested: {
        path: "ofvs",
        query: {
          bool: {
            filter: [
              {
                match: {
                  "ofvs.name_ci": fieldName
                }
              }
            ]
          }
        }
      }
    };
    if ( v ) {
      nestedQuery.nested.query.bool.filter.push( {
        match: { "ofvs.value_ci": v }
      } );
    }
    searchFilters.push( nestedQuery );
  } );
  // conservation status
  let values;
  if ( params.cs ) {
    values = _.map( util.paramArray( params.cs ), v => v.toLowerCase( ) );
    searchFilters.push( ObservationsController.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if ( params.csi ) {
    values = _.filter( _.map(
      util.paramArray( params.csi ), v => util.iucnValues[v.toLowerCase( )]
    ), _.identity );
    if ( values.length > 0 ) {
      searchFilters.push( ObservationsController.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if ( params.csa ) {
    values = _.map( util.paramArray( params.csa ), v => v.toLowerCase( ) );
    searchFilters.push(
      ObservationsController.conservationCondition( "authority", values, params )
    );
  }

  if ( params.popular === "true" ) {
    searchFilters.push( { range: { faves_count: { gte: 1 } } } );
  } else if ( params.popular === "false" ) {
    searchFilters.push( esClient.termFilter( "faves_count", 0 ) );
  }

  if ( params.id_above ) {
    searchFilters.push( { range: { id: { gt: params.id_above } } } );
  }
  if ( params.id_below ) {
    searchFilters.push( { range: { id: { lt: params.id_below } } } );
  }

  if ( params.acc_above ) {
    searchFilters.push( { range: { positional_accuracy: { gt: params.acc_above } } } );
  }
  if ( params.acc_below ) {
    searchFilters.push( { range: { positional_accuracy: { lt: params.acc_below } } } );
  }

  _.each( ["geoprivacy", "taxon_geoprivacy"], geoprivacyField => {
    if ( params[geoprivacyField] === "open" ) {
      inverseFilters.push( { exists: { field: geoprivacyField } } );
    } else if ( params[geoprivacyField] === "obscured_private" ) {
      searchFilters.push( esClient.termFilter( geoprivacyField, ["obscured", "private"] ) );
    } else if ( params[geoprivacyField] && params[geoprivacyField] !== "any" ) {
      const geoprivacyFieldFilter = esClient.termFilter( geoprivacyField, params[geoprivacyField] );
      if ( geoprivacyFieldFilter.terms[geoprivacyField].indexOf( "open" ) < 0 ) {
        searchFilters.push( geoprivacyFieldFilter );
      } else {
        // Since "open" just means the field isn't there, we need a should to do
        // something like "geoprivacy IS NULL OR geoprivacy IN (x,y,z)"
        geoprivacyFieldFilter.terms[geoprivacyField] = _.filter(
          geoprivacyFieldFilter.terms[geoprivacyField], g => g !== "open"
        );
        searchFilters.push( {
          bool: {
            should: [
              geoprivacyFieldFilter,
              { bool: { must_not: { exists: { field: geoprivacyField } } } }
            ]
          }
        } );
      }
    }
  } );

  if ( params.not_in_place ) {
    inverseFilters.push( {
      terms: {
        place_ids: util.paramArray( params.not_in_place )
      }
    } );
  }

  if ( params.spam === "true" ) {
    searchFilters.push( {
      term: { spam: true }
    } );
  } else if ( params.spam === "false" ) {
    searchFilters.push( {
      term: { spam: false }
    } );
  }

  // sort defaults to created at descending
  if ( params.order !== "asc" ) {
    params.order = "desc";
  }
  const sortOrder = ( params.order || "desc" ).toLowerCase( );
  let sort;
  switch ( params.order_by ) {
    case "observed_on":
      sort = {
        "observed_on_details.date": sortOrder,
        time_observed_at: {
          order: sortOrder,
          missing: ( sortOrder === "desc" ? "_last" : "_first" )
        },
        created_at: sortOrder
      };
      break;
    case "species_guess":
      sort = { species_guess: sortOrder };
      break;
    case "votes":
      sort = { cached_votes_total: sortOrder };
      break;
    case "id":
      sort = { id: sortOrder };
      break;
    case "random":
      sort = "random"; // handle in esClient.searchHash
      break;
    case "updated_at":
      sort = { updated_at: sortOrder };
      break;
    default:
      sort = { created_at: sortOrder };
  }
  callback( null, {
    search_filters: searchFilters,
    inverse_filters: inverseFilters,
    grouped_inverse_filters: params.grouped_inverse_filters || [],
    sort
  } );
};

ObservationsController.prepareElasticDataForReponse = ( data, req, callback ) => {
  const obs = _.map( data.hits.hits, "_source" );
  const response = { total_results: data.hits.total };
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
  callback( null, response );
};

ObservationsController.resultsForRequest = ( req, callback ) => {
  ObservationsController.elasticResults( req, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    ObservationsController.prepareElasticDataForReponse( data, req, callback );
  } );
};

ObservationsController.leafCounts = ( req, callback ) => {
  ESModel.ancestriesSpeciesCounts( req, "taxon.min_species_ancestry",
    ObservationsController.elasticResults, callback );
};

ObservationsController.speciesCounts = ( req, callback ) => {
  ObservationsController.leafCounts( req, ( err, leafCounts ) => {
    if ( err ) { return void callback( err ); }
    TaxaController.speciesCountsResponse( req, leafCounts, { }, callback );
  } );
};

ObservationsController.newProjectsContaining = ( obs, callback ) => {
  const obsSearchParams = { };
  obsSearchParams.user_id = obs.user ? obs.user.id : null;
  obsSearchParams.taxon_id = obs.taxon ? obs.taxon.ancestor_ids : null;
  obsSearchParams.place_id = _.isEmpty( obs.place_ids ) ? null : obs.place_ids;
  obsSearchParams.project_id = _.isEmpty( obs.project_ids ) ? null : obs.project_ids;
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
    esClient.termFilter( "user_ids", obs.user.id ),
    { exists: { field: "search_parameter_fields" } }
  ];
  const inverseFilters = [];
  _.each( obsSearchParams, ( value, field ) => {
    // there is a value that isn't false or an empty array
    if ( value && !( _.isArray( value ) && _.isEmpty( value ) ) ) {
      const shoulds = [];
      if ( field === "date" ) {
        // Essentially this is:
        //   ( (d1 < date || !d1) && (d2 > date || !d2) )
        _.each( ["d1", "d2"], subfield => {
          filters.push( {
            bool: {
              should: [
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
              ]
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
        } else if ( field === "project_id" ) {
          inverseFilters.push( esClient.termFilter( "search_parameter_fields.not_in_project", value ) );
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
    size: 100,
    _source: Project.returnFields
  };
  ESModel.elasticResults( { query: { } }, query, "projects", { }, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const collectionProjectIDs = _.map( data.hits.hits, "_source.id" );
    if ( _.isEmpty( collectionProjectIDs ) ) {
      return void callback( null, collectionProjectIDs );
    }
    const umbrellaProjectsQuery = {
      filters: [
        { term: { project_type: "umbrella" } },
        { terms: { "search_parameter_fields.project_id": collectionProjectIDs } }
      ],
      size: 100,
      _source: Project.returnFields
    };
    ESModel.elasticResults( { query: { } }, umbrellaProjectsQuery, "projects", { },
      ( errr, umbrellaData ) => {
        if ( errr ) { return void callback( errr ); }
        const umbrellaProjectIDs = _.map( umbrellaData.hits.hits, "_source.id" );
        callback( null, collectionProjectIDs.concat( umbrellaProjectIDs ) );
      } );
  } );
};

ObservationsController.treeTaxa = ( req, callback ) => {
  const countQuery = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      ancestries: { terms: { field: "taxon.min_species_ancestry", size: 5000 } }
    }
  } );
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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

    TaxaController.speciesCountsResponse( req, leafCounts, { perPageOverride: leafCounts.length },
      ( errr, r ) => {
        if ( errr ) { return void callback( errr ); }
        _.each( r.results, result => {
          result.isLeaf = _.has( possibleLeaves, result.taxon.id );
          result.taxon = _.pick( result.taxon,
            ["id", "name", "iconic_taxon_id", "preferred_common_name", "rank", "ancestor_ids"] );
        } );
        callback( null, r );
      } );
  } );
};

ObservationsController.iconicTaxaCounts = ( req, callback ) => {
  const countQuery = _.assignIn( { }, req.query );
  countQuery.aggs = {
    iconic_taxa: {
      terms: { field: "taxon.iconic_taxon_id" }
    }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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
    ESModel.fetchBelongsTo( buckets, Taxon, taxonOpts, errr => {
      if ( errr ) { return void callback( errr ); }
      callback( null, {
        total_results: buckets.length,
        page: 1,
        per_page: buckets.length,
        results: _.reverse( _.sortBy( buckets, "count" ) )
      } );
    } );
  } );
};

ObservationsController.iconicTaxaSpeciesCounts = ( req, callback ) => {
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
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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
    ESModel.fetchBelongsTo( iconicTaxonLeafCounts, Taxon, taxonOpts, errr => {
      if ( errr ) { return void callback( errr ); }
      callback( null, {
        total_results: iconicTaxonLeafCounts.length,
        page: 1,
        per_page: iconicTaxonLeafCounts.length,
        results: _.reverse( _.sortBy( iconicTaxonLeafCounts, "count" ) )
      } );
    } );
  } );
};

ObservationsController.qualityGrades = ( req, callback ) => {
  req.query = _.assignIn( { }, req.query, {
    per_page: 0,
    aggs: {
      quality_grade: {
        terms: { field: "quality_grade" }
      }
    }
  } );
  ObservationsController.elasticResults( req, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const { buckets } = data.aggregations.quality_grade;
    callback( null, {
      total_results: buckets.length,
      page: 1,
      per_page: buckets.length,
      results: _.map( buckets, b => ( {
        quality_grade: b.key,
        count: b.doc_count
      } ) )
    } );
  } );
};

ObservationsController.umbrellaSubprojectsAggregation = ( projects, callback ) => {
  const aggs = { umbrellaSubprojects: { filters: { filters: { } } } };
  ObservationsController.projectsQueryFilters( projects, ( err, queryFilters ) => {
    if ( err ) { return void callback( err ); }
    _.each( queryFilters, q => {
      aggs.umbrellaSubprojects.filters.filters[`project_${q.project.id}`] = {
        bool: { must: q.filters }
      };
    } );
    callback( null, aggs );
  } );
};

ObservationsController.umbrellaProjectStats = ( req, callback ) => {
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
    return void InaturalistAPI.basicResponse( null, req, null, callback );
  }
  // create filter aggregations for all subprojects
  ObservationsController.umbrellaSubprojectsAggregation( allSubprojects, ( err, aggs ) => {
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
    ObservationsController.elasticResults( countReq, ( errr, data ) => {
      if ( errr ) { return void callback( errr ); }
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
      ESModel.fetchBelongsTo( results, Project, { source: Project.returnFields }, errrr => {
        if ( errrr ) { return void callback( errrr ); }
        const placeOptions = { source: { excludes: ["geometry_geojson"] } };
        ESModel.fetchBelongsTo( _.map( results, "project" ), Place, placeOptions, errrrr => {
          if ( errrrr ) { return void callback( errrrr ); }
          callback( null, {
            total_results: results.length,
            page: 1,
            per_page: results.length,
            results
          } );
        } );
      } );
    } );
  } );
};

ObservationsController.identifiers = ( req, callback ) => {
  const countQuery = _.assignIn( { }, req.query );
  const paginationOptions = { default: 500, max: 500 };
  const { aggSize } = InaturalistAPI.paginationData( req, paginationOptions );
  // Until all observations have been re-indexed without the identifications nested
  // object, some pre processing needs to be done to combine the counts
  // of obs with nested identifications and obs with non_owner_identifier_user_ids
  countQuery.aggs = {
    new_identifiers: {
      terms: { field: "non_owner_identifier_user_ids", size: 100000 }
    },
    nested: {
      nested: { path: "identifications" },
      aggs: {
        filtered: {
          filter: { term: { "identifications.own_observation": false } },
          aggs: {
            users: {
              terms: { field: "identifications.user.id", size: 100000 }
            }
          }
        }
      }
    }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const identifierCounts = { };
    _.each( data.aggregations.new_identifiers.buckets, b => {
      identifierCounts[b.key] = identifierCounts[b.key] || 0;
      identifierCounts[b.key] += b.doc_count;
    } );
    _.each( data.aggregations.nested.filtered.users.buckets, b => {
      identifierCounts[b.key] = identifierCounts[b.key] || 0;
      identifierCounts[b.key] += b.doc_count;
    } );
    const sortedIdentifierCounts = _.sortBy( _.toPairs( identifierCounts ), 1 ).reverse( );
    const mergedData = {
      aggregations: {
        nested: {
          filtered: {
            total: {
              value: sortedIdentifierCounts.length
            },
            users: {
              buckets: _.map( sortedIdentifierCounts.slice( 0, aggSize ), s => ( {
                key: Number( s[0] ),
                doc_count: s[1]
              } ) )
            }
          }
        }
      }
    };
    ESModel.userAggregationResponse( req, mergedData, { paginationOptions }, callback );
  } );
};

ObservationsController.observers = ( req, callback ) => {
  // depending on the sort order, need to call observers and species
  // counts, since they need separate queries. The second one to be
  // called with add a user_id filter so we can get the corresponding
  // count for all users from the results of the first query.
  if ( req.query.order_by === "species_count" ) {
    ObservationsController.observationsSpeciesObserverCounts( _.cloneDeep( req ),
      ( err, speciesObservers ) => {
        if ( err ) { return void callback( err ); }
        const spQuery = _.assignIn( { }, req.query );
        spQuery.user_id = _.keys( speciesObservers.counts );
        const spReq = _.assignIn( { }, req, { query: spQuery } );
        ObservationsController.observationsObserverCounts( spReq, ( errr, observers ) => {
          if ( errr ) { return void callback( errr ); }
          ObservationsController.observationsObserversResponse(
            req, observers, speciesObservers, callback
          );
        } );
      } );
  } else {
    ObservationsController.observationsObserverCounts( _.cloneDeep( req ), ( err, observers ) => {
      if ( err ) { return void callback( err ); }
      const spQuery = _.assignIn( { }, req.query );
      spQuery.user_id = _.keys( observers.counts );
      const spReq = _.assignIn( { }, req, { query: spQuery } );
      ObservationsController.observationsSpeciesObserverCounts( spReq,
        ( errr, speciesObservers ) => {
          if ( errr ) { return void callback( errr ); }
          ObservationsController.observationsObserversResponse(
            req, observers, speciesObservers, callback
          );
        } );
    } );
  }
};

ObservationsController.observationsObserversResponse = (
  req, observers, speciesObservers, callback
) => {
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
  Observation.preloadUsers( userCounts, err => {
    if ( err ) { return void callback( err ); }
    callback( null, {
      total_results: ( observers.total || speciesObservers.total ) || 0,
      page,
      per_page: perPage,
      results: userCounts
    } );
  } );
};

ObservationsController.observationsObserverCounts = ( req, callback ) => {
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
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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
    callback( null, {
      total: data.aggregations.total_observers ? data.aggregations.total_observers.value : null,
      counts
    } );
  } );
};


ObservationsController.observationsSpeciesObserverCounts = ( req, callback ) => {
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
              field: "taxon.min_species_ancestry"
            }
          }
        }
      }
    };
  }
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
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
    callback( null, {
      counts: userIndexedCounts
    } );
  } );
};

ObservationsController.conservationCondition = ( esField, values, params ) => {
  // use a nested query to search the specified fields
  const filters = [];
  const inverseFilters = [];
  const statusFilter = { terms: { } };
  statusFilter.terms[`taxon.statuses.${esField}`] = values;
  filters.push( statusFilter );
  if ( params.place_id ) {
    // if a place condition is specified, return all results
    // from the place(s) specified, or where place is NULL
    filters.push( {
      bool: {
        should: [
          { terms: { "taxon.statuses.place_id": util.paramArray( params.place_id ) } },
          { bool: { must_not: { exists: { field: "taxon.statuses.place_id" } } } }
        ]
      }
    } );
  } else {
    // no place condition specified, so apply a `place is NULL` condition
    inverseFilters.push( { exists: { field: "taxon.statuses.place_id" } } );
  }
  const statusCondition = {
    nested: {
      path: "taxon.statuses",
      query: {
        bool: {
          filter: filters,
          must_not: inverseFilters
        }
      }
    }
  };
  return statusCondition;
};

// returns unviewed notifications about new IDs and comments
// on the authroized user's observations
ObservationsController.updates = ( req, callback ) => {
  if ( !req.userSession ) {
    return void callback( { error: "Unauthorized", status: 401 } );
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
  esClient.connection.search( {
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
  }, ( err, response ) => {
    if ( err ) { return void callback( err ); }
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
    Comment.preloadInto( hits, localeOpts, ( ) => {
      Identification.preloadInto( hits, localeOpts, ( ) => {
        callback( null, {
          total_results: response.hits.total,
          page: req.query.page || 1,
          per_page: req.query.per_page,
          results: hits
        } );
      } );
    } );
  } );
};

ObservationsController.deleted = ( req, callback ) => {
  req.query.ttl = req.query.ttl || -1;
  if ( !req.userSession ) {
    return void callback( { error: "Unauthorized", status: 401 } );
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
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      callback( null, {
        total_results: result.rows.length,
        page: 1,
        per_page: 500,
        results: _.map( result.rows, "observation_id" )
      } );
    } );
  } else {
    callback( null, {
      total_results: 0,
      page: 1,
      per_page: 500,
      results: []
    } );
  }
};

ObservationsController.popularFieldValues = ( req, callback ) => {
  const countQuery = _.assignIn( { }, req.query, { annotation_min_score: 0 } );
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
                    size: 12
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const resultOptions = { backfill: { min: 1, max: 12 } };
    let results = [];
    const controlledTermsIDs = { };
    _.each( data.aggregations.nested_annotations.attributes.buckets, b => {
      const pieces = b.key.split( "|" );
      controlledTermsIDs[Number( pieces[0] )] = true;
      controlledTermsIDs[Number( pieces[1] )] = true;
      results.push( {
        controlled_attribute_id: pieces[0],
        controlled_value_id: pieces[1],
        count: b.back_to_observation.doc_count,
        month_of_year: util.aggBucketsToHash(
          b.back_to_observation.by_month.buckets, resultOptions
        )
      } );
    } );
    ESModel.fetchInstancesByIDsObject( controlledTermsIDs, ControlledTerm, { }, ( errr, terms ) => {
      if ( errr ) { return void callback( errr ); }
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
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results: _.reverse( _.sortBy( results, "count" ) )
      } );
    } );
  } );
};

ObservationsController.qualityMetrics = ( req, callback ) => {
  const query = squel.select( ).field( "*" )
    .from( "quality_metrics" ).where( "observation_id = ?", req.params.id );
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if ( err ) { return void callback( err ); }
    const results = result.rows;
    ESModel.fetchBelongsTo( results, User, { }, () => {
      callback( null, {
        total_results: results.length,
        page: 1,
        per_page: results.length,
        results
      } );
    } );
  } );
};

ObservationsController.subscriptions = ( req, callback ) => {
  if ( !req.userSession ) {
    return void callback( { error: "Unauthorized", status: 401 } );
  }
  const query = squel.select( ).field( "s.*" )
    .from( "observations o" )
    .join( "subscriptions s", null, `(
      (s.resource_type='Observation' AND s.resource_id=o.id) OR
      (s.resource_type='User' and s.resource_id=o.user_id) )` )
    .where( "o.id = ?", req.params.id )
    .where( "s.user_id = ?", req.userSession.user_id );
  pgClient.connection.query( query.toString( ), ( err, result ) => {
    if ( err ) { return void callback( err ); }
    const results = result.rows;
    callback( null, {
      total_results: results.length,
      page: 1,
      per_page: results.length,
      results
    } );
  } );
};

ObservationsController.identificationCategories = ( req, callback ) => {
  const countQuery = _.assignIn( { }, req.query );
  countQuery.aggs = {
    nested: {
      nested: { path: "identifications" },
      aggs: {
        categories: { terms: { field: "identifications.category", size: 10 } }
      }
    },
    categories: { terms: { field: "identification_categories", size: 10 } }
  };
  countQuery.per_page = 0;
  const countReq = _.assignIn( { }, req, { query: countQuery } );
  ObservationsController.elasticResults( countReq, ( err, data ) => {
    if ( err ) { return void callback( err ); }
    const combinedCategories = { };
    _.each( data.aggregations.nested.categories.buckets, b => {
      combinedCategories[b.key] = combinedCategories[b.key] || 0;
      combinedCategories[b.key] += b.doc_count;
    } );
    _.each( data.aggregations.categories.buckets, b => {
      combinedCategories[b.key] = combinedCategories[b.key] || 0;
      combinedCategories[b.key] += b.doc_count;
    } );
    const buckets = _.map( combinedCategories, ( v, k ) => ( {
      category: k, count: v
    } ) );
    callback( null, {
      total_results: _.size( buckets ),
      page: 1,
      per_page: _.keys( buckets ).length,
      results: _.sortBy( buckets, b => -1 * b.count )
    } );
  } );
};

module.exports = ObservationsController;
