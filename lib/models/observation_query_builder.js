const _ = require( "lodash" );
const moment = require( "moment" );
const querystring = require( "querystring" );
const squel = require( "safe-squel" );
const Joi = require( "joi" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const ESModel = require( "./es_model" );
const util = require( "../util" );
const ProjectUser = require( "./project_user" );
const Taxon = require( "./taxon" );
const User = require( "./user" );

const ObservationQueryBuilder = { };

ObservationQueryBuilder.applyLookupRules = async req => {
  req.inat = req.inat || { };
  if ( req.inat.apply_project_rules_for ) {
    await ObservationQueryBuilder.applyProjectRules( req );
  }
  if ( req.inat.not_matching_project_rules_for ) {
    await ObservationQueryBuilder.applyInverseProjectRules( req );
  }
  if ( req.inat.list ) {
    await ObservationQueryBuilder.applyListTaxaFilters( req );
  }
  if ( req.inat.not_in_list ) {
    await ObservationQueryBuilder.applyNotInListTaxaFilters( req );
  }
  if ( req.inat.unobservedByUser ) {
    await ObservationQueryBuilder.applyUnobservedByUserFilters( req );
  }
  if ( req.inat.project ) {
    await ObservationQueryBuilder.applyCollectionProjectRules( req );
  }
  if ( req.inat.not_in_project ) {
    await ObservationQueryBuilder.applyCollectionProjectRules( req, { inverse: true } );
  }
  if ( req.inat.members_of_project ) {
    await ObservationQueryBuilder.applyProjectMembershipRules( req );
  }
  if ( req.query.followed_by_user_id ) {
    await ObservationQueryBuilder.applyUserFolloweeFilters( req );
  }
  if ( req.query.subscribed_to_by_user_id ) {
    await ObservationQueryBuilder.applyUserSubscriptionFilters( req );
  }
};

// Builds place filters for an authenticated user that is filtering by place.
// Massive complexity brought to you by trusting collection projects
ObservationQueryBuilder.placeFilterForUser = async ( req, params ) => {
  const publicPlaceFilter = esClient.termFilter( "place_ids.keyword", params.place_id );
  const privatePlaceFilter = esClient.termFilter( "private_place_ids.keyword", params.place_id );
  // Current user should see obs that match the regular place filter OR obs
  // that they created and have private coordinates that fall in the query
  // place
  const placeFilterForUser = {
    bool: {
      should: [
        publicPlaceFilter,
        {
          bool: {
            must: [
              privatePlaceFilter,
              { term: { "user.id.keyword": req.userSession.user_id } }
            ]
          }
        }
      ]
    }
  };
  // req._collectionProject is a special attribute set when we are getting an
  // obs query from collection project search params. See
  // projectRulesQueryFilters
  // If we're not doing complex project logic, just return that relatively
  // simple filter for the signed in user
  if ( !req._collectionProject ) {
    return placeFilterForUser;
  }
  // We are building a query in the context of an umbrella project, but the umbrella
  // hasn't enabled trusting, so skip the complex logic
  if ( req._umbrellaProject && !req._umbrellaProject.prefers_user_trust ) {
    return placeFilterForUser;
  }
  // We are building a query in the context of an collection project, but the collection
  // hasn't enabled trusting, so skip the complex logic
  if ( !req._collectionProject.prefers_user_trust && !req._umbrellaProject ) {
    return placeFilterForUser;
  }
  // If we're filtering for a project, reset to the public filter and grant
  // allowances based on curatorship and trusting member status
  placeFilterForUser.bool.should = [publicPlaceFilter];
  const usersTrustingProjectForAny = await ProjectUser.usersTrustingProjectFor(
    req._collectionProject.id, "any"
  );
  const usersTrustingProjectForTaxon = await ProjectUser.usersTrustingProjectFor(
    req._collectionProject.id, "taxon"
  );
  let usersTrustingForTaxon = usersTrustingProjectForTaxon;
  let usersTrustingForAny = usersTrustingProjectForAny;
  // When we are building a query in the context of an umbrella project, add the
  // users who trust the umbrella. So if I trust Umbrella 1 which contains
  // Collection 1 but I don't trust Collection 1, show my obscured obs in
  // queries for Umbrella 1 for curators of Umbrella 1
  if ( req._umbrellaProject ) {
    const usersTrustingUmbrellaProjectForTaxon = await ProjectUser.usersTrustingProjectFor(
      req._umbrellaProject.id, "taxon"
    );
    usersTrustingForTaxon = usersTrustingProjectForTaxon.concat(
      usersTrustingUmbrellaProjectForTaxon
    );
    const usersTrustingUmbrellaProjectForAny = await ProjectUser.usersTrustingProjectFor(
      req._umbrellaProject.id, "any"
    );
    usersTrustingForAny = usersTrustingProjectForAny.concat(
      usersTrustingUmbrellaProjectForAny
    );
  }
  const viewerCuratesProject = req.userSession.curated_project_ids
    && req.userSession.curated_project_ids.indexOf( req._collectionProject.id ) >= 0;
  const viewerTrustsProjectForAny = usersTrustingForAny.includes(
    req.userSession.user_id
  );
  const viewerTrustsProjectForTaxon = usersTrustingForTaxon.includes(
    req.userSession.user_id
  );
  // The overall intent here is
  // 1. To grant project curators access to obs by trusting users based on private coordinates
  // 2. To allow project members to see which observations are "in" or "out" of the project based
  //   on their trusting status
  // We are trying to avoid a situation where a non-member views a project and
  // sees their own obscured obs included based on the private coordinates,
  // which they might see in an ordinary place search b/c they have permission
  // to see their own private stuff, but might be alarmed to see it in the
  // context of a project they don't trust. We don't want them to think the
  // project curators are seeing that too, b/c they're not.
  if ( usersTrustingForAny.length > 0 ) {
    let userFilterForAny;
    if ( viewerCuratesProject ) {
      // If the current user curates the specified collection project, they
      // should also see observations in that project by all project members who
      // trust the project with all coordinates
      userFilterForAny = { terms: { "user.id.keyword": usersTrustingForAny } };
    } else if ( viewerTrustsProjectForAny ) {
      // If the viewer trusts the project for any, they should see only their
      // own obscured obs in the project
      userFilterForAny = { term: { "user.id.keyword": req.userSession.user_id } };
    }
    if ( userFilterForAny ) {
      placeFilterForUser.bool.should.push( {
        bool: {
          must: [
            privatePlaceFilter,
            userFilterForAny
          ]
        }
      } );
    }
  }
  // Query logic for taxon-only trust is even more complicated...
  if ( usersTrustingForTaxon.length > 0 ) {
    let userFilterForTaxon;
    // Viewer permissions largeley the same as above
    if ( viewerCuratesProject ) {
      userFilterForTaxon = { terms: { "user.id.keyword": usersTrustingForTaxon } };
    } else if ( viewerTrustsProjectForTaxon ) {
      userFilterForTaxon = { term: { "user.id.keyword": req.userSession.user_id } };
    }
    if ( userFilterForTaxon ) {
      placeFilterForUser.bool.should.push( {
        bool: {
          must: [
            privatePlaceFilter,
            // taxon-only means we are focusing only on obs obscured by taxon geoprivacy...
            { terms: { taxon_geoprivacy: ["obscured", "private"] } },
            userFilterForTaxon
          ],
          // ... but not those obscured by personal geoprivacy
          must_not: [
            { exists: { field: "geoprivacy" } }
          ]
        }
      } );
    }
  }
  return placeFilterForUser;
};

ObservationQueryBuilder.reqToElasticQueryComponents = async req => {
  await ObservationQueryBuilder.applyLookupRules( req );
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
    let searchFields;
    let searchTaxa;
    const searchOn = params.search_on;
    switch ( searchOn ) {
      case "names":
        searchTaxa = true;
        break;
      case "tags":
        searchFields = ["tags"];
        break;
      case "description":
        searchFields = ["description"];
        break;
      case "place":
        searchFields = ["place_guess"];
        break;
      case "taxon_page_obs_photos":
        searchTaxa = true;
        searchFields = ["description", "user.login", "field_values.value"];
        break;
      default:
        searchTaxa = true;
        searchFields = ["tags", "description", "place_guess"];
    }
    if ( searchTaxa && !req.inat.searchedTaxaQ ) {
      // user requested to search within taxon names, so do that first
      await ObservationQueryBuilder.applyTaxonSearchFilter( req, params.q, "searchedTaxaQ" );
    }
    let taxonSearchFilter;
    if ( req.inat.searchedTaxaQ && !_.isEmpty( req.inat.searchedTaxaQ ) ) {
      taxonSearchFilter = esClient.termFilter( "taxon.id.keyword", req.inat.searchedTaxaQ );
    }
    let multiMatchFilter;
    if ( searchFields ) {
      multiMatchFilter = {
        multi_match: {
          query: params.q,
          operator: "and",
          fields: searchFields
        }
      };
    }
    if ( taxonSearchFilter && multiMatchFilter ) {
      searchFilters.push( {
        bool: {
          should: [
            taxonSearchFilter,
            multiMatchFilter
          ]
        }
      } );
    } else if ( multiMatchFilter ) {
      searchFilters.push( multiMatchFilter );
    } else if ( searchTaxa ) {
      // if we searched taxa and there is no taxonSearchFilter, there are no matches
      searchFilters.push( taxonSearchFilter || { term: { id: -1 } } );
    }
  }

  if ( params.taxon_name ) {
    if ( !req.inat.searchedTaxaTaxonName ) {
      // user requested to filter by taxon names, so do that search first
      await ObservationQueryBuilder.applyTaxonSearchFilter(
        req, params.taxon_name, "searchedTaxaTaxonName"
      );
    }
    if ( _.isEmpty( req.inat.searchedTaxaTaxonName ) ) {
      searchFilters.push( { term: { id: -1 } } );
    } else {
      searchFilters.push( esClient.termFilter( "taxon.id.keyword", req.inat.searchedTaxaTaxonName ) );
    }
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

  if ( params.license && !_.isArray( params.license ) ) {
    params.license = params.license.toLowerCase( );
  }
  if ( params.photo_license && !_.isArray( params.photo_license ) ) {
    params.photo_license = params.photo_license.toLowerCase( );
  }
  if ( params.sound_license && !_.isArray( params.sound_license ) ) {
    params.sound_license = params.sound_license.toLowerCase( );
  }

  if ( params.licensed === "true" ) {
    searchFilters.push( { exists: { field: "license_code" } } );
  } else if ( params.licensed === "false" ) {
    inverseFilters.push( { exists: { field: "license_code" } } );
  }

  if ( params.photo_licensed === "true" ) {
    searchFilters.push( { exists: { field: "photo_licenses" } } );
  } else if ( params.photo_licensed === "false" ) {
    inverseFilters.push( { exists: { field: "photo_licenses" } } );
  }

  if ( params.without_taxon ) {
    if ( Taxon.life ) {
      searchFilters.push( {
        bool: {
          should: [
            { term: { "taxon.id.keyword": Taxon.life.id } },
            {
              bool: {
                must_not: {
                  exists: { field: "taxon.id" }
                }
              }
            }
          ]
        }
      } );
    } else {
      params.identified = "false";
    }
  }

  // remove months param if it includes all months, filtering nothing out
  if ( params.month && params.month !== "any" ) {
    const monthParams = util.paramArray( params.month );
    if ( _.isEqual(
      _.sortBy( _.map( monthParams, i => i.toString( ) ) ),
      _.sortBy( _.map( _.range( 1, 13 ), i => i.toString( ) ) )
    ) ) {
      delete params.month;
    }
  }

  _.each( [{ http_param: "rank", es_field: "taxon.rank" },
    { http_param: "user_id", es_field: "user.id.keyword" },
    { http_param: "user_login", es_field: "user.login" },
    { http_param: "day", es_field: "observed_on_details.day" },
    { http_param: "month", es_field: "observed_on_details.month" },
    { http_param: "year", es_field: "observed_on_details.year" },
    { http_param: "week", es_field: "observed_on_details.week" },
    { http_param: "site_id", es_field: "site_id.keyword" },
    { http_param: "id", es_field: "id" },
    { http_param: "uuid", es_field: "uuid" },
    { http_param: "license", es_field: "license_code" },
    { http_param: "photo_license", es_field: ["photos.license_code", "photo_licenses"] },
    { http_param: "sound_license", es_field: ["sounds.license_code", "sound_licenses"] },
    { http_param: "oauth_application_id", es_field: "oauth_application_id.keyword" }
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

  _.each( ["photos", "sounds"], param => {
    const paramFilter = { range: { [`${param}_count`]: { gte: 1 } } };
    if ( params[param] === "true" ) {
      searchFilters.push( paramFilter );
    } else if ( params[param] === "false" ) {
      inverseFilters.push( paramFilter );
    }
  } );

  _.each( [
    { http_param: "geo", es_field: "geojson" },
    { http_param: "identified", es_field: "taxon.id" },
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
      "taxon.ancestor_ids.keyword", params.taxon_id || params.taxon_ids
    ) );
  }

  if ( params.exact_taxon_id ) {
    searchFilters.push( esClient.termFilter(
      "taxon.id.keyword", params.exact_taxon_id
    ) );
  }

  if ( params.ident_taxon_id || params.ident_taxon_ids ) {
    searchFilters.push( esClient.termFilter(
      "ident_taxon_ids.keyword", params.ident_taxon_id || params.ident_taxon_ids
    ) );
  }

  if ( params.ident_taxon_id_exclusive ) {
    const identTaxonIDs = util.paramArray( params.ident_taxon_id_exclusive );
    _.each( identTaxonIDs, id => (
      searchFilters.push( esClient.termFilter( "ident_taxon_ids.keyword", id ) )
    ) );
  }

  if ( params.without_taxon_id ) {
    inverseFilters.push( esClient.termFilter(
      "taxon.ancestor_ids.keyword", params.without_taxon_id
    ) );
  }

  if ( params.without_direct_taxon_id ) {
    inverseFilters.push( esClient.termFilter(
      "taxon.id.keyword", params.without_direct_taxon_id
    ) );
  }

  if ( params.not_id ) {
    const notIds = util.paramArray( params.not_id );
    const ids = [];
    const uuids = [];
    _.forEach( notIds, notId => {
      const { error: guidError } = Joi.string( ).guid( ).validate( notId );
      if ( guidError ) {
        ids.push( notId );
      } else {
        uuids.push( notId );
      }
    } );
    if ( ids.length > 0 ) {
      inverseFilters.push( { terms: { id: ids } } );
    }
    if ( uuids.length > 0 ) {
      inverseFilters.push( { terms: { uuid: uuids } } );
    }
  }

  if ( params.not_user_id ) {
    const paramIDs = util.paramArray( params.not_user_id ) || [];
    const stringParamIDs = [];
    const numericParamIDs = [];
    _.each( paramIDs, id => {
      if ( Number( id ) ) numericParamIDs.push( Number( id ) );
      else stringParamIDs.push( id );
    } );
    if ( numericParamIDs.length > 0 ) {
      inverseFilters.push( {
        terms: { "user.id": numericParamIDs }
      } );
    }
    if ( stringParamIDs.length > 0 ) {
      inverseFilters.push( {
        terms: { "user.login": stringParamIDs }
      } );
    }
  }

  if ( params.verifiable === "true" ) {
    inverseFilters.push(
      esClient.termFilter( "quality_grade", ["casual"] )
    );
  } else if ( params.verifiable === "false" ) {
    searchFilters.push(
      esClient.termFilter( "quality_grade", ["casual"] )
    );
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
    originalProjectFilters.push( esClient.termFilter( "project_ids.keyword", params.project_id ) );
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
    let shoulds = params.collectionProjectFilters;
    // combine them as an OR with existing project params
    if ( !_.isEmpty( originalProjectFilters ) ) {
      shoulds = shoulds.concat( { bool: { filter: originalProjectFilters } } );
    }
    // if there's only one set of collection project filters, then apply that
    // projects filters directly to the current query
    if ( shoulds.length === 1 ) {
      if ( !_.isEmpty( shoulds[0].bool.filter ) ) {
        searchFilters = searchFilters.concat( shoulds[0].bool.filter );
      }
      if ( !_.isEmpty( shoulds[0].bool.must_not ) ) {
        inverseFilters = inverseFilters.concat( shoulds[0].bool.must_not );
      }
    } else {
      // if there are multiple sets of collection project filters, then
      // use a bool -> should filter to ensure at least one set of filters matches
      searchFilters.push( {
        bool: { should: shoulds }
      } );
    }
  } else if ( !_.isEmpty( originalProjectFilters ) ) {
    // there are some regular project filters to add
    searchFilters = searchFilters.concat( originalProjectFilters );
  }

  if ( params.collectionProjectInverseFilters ) {
    inverseFilters = inverseFilters.concat( params.collectionProjectInverseFilters );
  }

  if ( params.not_in_project ) {
    inverseFilters.push( esClient.termFilter( "project_ids.keyword", params.not_in_project ) );
  }

  if ( params.coords_viewable_for_proj === "true" ) {
    let projectIds = params.project_id || [];
    if ( !_.isArray( projectIds ) ) {
      projectIds = [projectIds];
    }
    if ( req.inat.project ) {
      projectIds = projectIds.concat( _.map( req.inat.project, "id" ) );
    }
    if ( projectIds.length === 0 ) {
      throw util.httpError( 422, "coords_viewable_for_proj requires a value for project_id" );
    }
    // fetch the user IDs of all users who trust the project
    let trustingUserIds = await ProjectUser.usersTrustingProjectFor( projectIds, "any" );
    // fetch the user IDs of users who trust the viewer
    if ( req.userSession && req.userSession.user_id ) {
      trustingUserIds = trustingUserIds.concat(
        await User.trustingUsers( req.userSession.user_id )
      );
    }
    // add a filter for obs with those user IDs
    const trustingUserFilter = esClient.termFilter( "user.id.keyword", trustingUserIds );
    // construct a filter for unobscured OR in trusting user IDs
    const unobscuredFilter = {
      bool: {
        must_not: [
          { exists: { field: "geoprivacy" } },
          { exists: { field: "taxon_geoprivacy" } }
        ]
      }
    };
    const membersTrustingForTaxa = await ProjectUser.usersTrustingProjectFor( projectIds, "taxon" );
    const membersTrustingForTaxaFilter = {
      bool: {
        filter: [
          esClient.termFilter( "user.id.keyword", membersTrustingForTaxa ),
          esClient.termFilter( "taxon_geoprivacy", ["private", "obscured"] )
        ],
        must_not: { exists: { field: "geoprivacy" } }
      }
    };
    const coordFilter = {
      bool: {
        should: [
          unobscuredFilter,
          trustingUserFilter,
          membersTrustingForTaxaFilter
        ]
      }
    };
    searchFilters.push( coordFilter );
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
    const grades = _.sortBy( util.paramArray( params.quality_grade ) );
    if ( _.size( grades ) === 3 && _.isEqual( grades, ["casual", "needs_id", "research"] ) ) {
      // ignore this filter as it returns all observations, thus does not filter anything
    } else if ( _.size( grades ) === 2 && _.isEqual( grades, ["needs_id", "research"] ) ) {
      // needs_id and research is the same as everything but casual,
      // so use the filter that matches fewer docs
      inverseFilters.push(
        esClient.termFilter( "quality_grade", "casual" )
      );
    } else {
      searchFilters.push( esClient.termFilter(
        "quality_grade", params.quality_grade
      ) );
    }
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
            { terms: { "taxon.iconic_taxon_id.keyword": iconicTaxonIDs } },
            { bool: { must_not: { exists: { field: "taxon.iconic_taxon_id" } } } }
          ]
        }
      } );
    } else {
      searchFilters.push( esClient.termFilter(
        "taxon.iconic_taxon_id.keyword", iconicTaxonIDs
      ) );
    }
  }

  if ( params.viewer_id ) {
    if ( params.reviewed === "true" ) {
      searchFilters.push( esClient.termFilter(
        "reviewed_by", params.viewer_id
      ) );
    } else if ( params.reviewed === "false" ) {
      inverseFilters.push( esClient.termFilter(
        "reviewed_by", params.viewer_id
      ) );
    }
  }

  let dateFilter = util.dateRangeFilter(
    "time_observed_at", params.d1, params.d2, "observed_on_details.date"
  );
  if ( dateFilter ) {
    searchFilters.push( dateFilter );
  }
  dateFilter = util.dateRangeFilter( "created_at", params.created_d1, params.created_d2, "created_at_details.date" );
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

  if ( req.inat.ident_users ) {
    const identUserIDs = _.map( req.inat.ident_users, "id" );
    searchFilters.push( {
      bool: {
        should: [
          esClient.termFilter( "identifier_user_ids.keyword", identUserIDs )
        ]
      }
    } );
  }

  if ( req.inat.without_ident_users ) {
    const withoutIdentUserIDs = _.map( req.inat.without_ident_users, "id" );
    inverseFilters.push( {
      bool: {
        should: [
          esClient.termFilter( "identifier_user_ids.keyword", withoutIdentUserIDs )
        ]
      }
    } );
  }

  if ( params.term_id ) {
    const initialFilters = [];
    initialFilters.push(
      esClient.termFilter( "annotations.controlled_attribute_id.keyword", params.term_id )
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
        esClient.termFilter( "annotations.controlled_value_id.keyword", params.term_value_id )
      );
    }
    searchFilters.push( nestedQuery );
    if ( params.without_term_value_id ) {
      const withoutFilters = [];
      withoutFilters.push(
        esClient.termFilter( "annotations.controlled_attribute_id.keyword", params.term_id )
      );
      withoutFilters.push(
        esClient.termFilter( "annotations.controlled_value_id.keyword", params.without_term_value_id )
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
  }
  if ( params.without_term_id ) {
    const nestedQuery = {
      nested: {
        path: "annotations",
        query: {
          bool: {
            filter: [
              { term: { "annotations.controlled_attribute_id.keyword": params.without_term_id } }
            ]
          }
        }
      }
    };
    inverseFilters.push( nestedQuery );
  }

  if (
    req.userSession
    && req.userSession.blocks
    // Don't filter out obs by blocking users if the viewer is just viewing a
    // single observation.
    && ( !req.query || !req.query.id || req.query.id.length > 1 )
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

  // Set the place filters, which gets REALLY complicated when trying to decide
  // when to search on private places or not
  if ( params.place_id && params.place_id !== "any" ) {
    // This is the basic filter of places everyone should see
    const publicPlaceFilter = esClient.termFilter( "place_ids.keyword", params.place_id );
    if ( req.userSession ) {
      const placeFilterForUser = await ObservationQueryBuilder.placeFilterForUser( req, params );
      if ( !_.isEmpty( placeFilterForUser ) ) {
        searchFilters.push( placeFilterForUser );
      }
    } else {
      searchFilters.push( publicPlaceFilter );
    }
  }

  if ( params.not_in_place ) {
    inverseFilters.push( esClient.termFilter( "place_ids.keyword", params.not_in_place ) );
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

  if ( params.ofv_datatype ) {
    const ofTypes = _.map( util.paramArray( params.ofv_datatype ), v => v.toLowerCase( ) );
    searchFilters.push( {
      nested: {
        path: "ofvs",
        query: {
          bool: {
            filter: [
              {
                terms: { "ofvs.datatype": ofTypes }
              }
            ]
          }
        }
      }
    } );
  }

  // conservation status
  let values;
  if ( params.cs ) {
    values = _.map( util.paramArray( params.cs ), v => v.toLowerCase( ) );
    searchFilters.push( ObservationQueryBuilder.conservationCondition( "status", values, params ) );
  }
  // IUCN conservation status
  if ( params.csi ) {
    values = _.filter( _.map(
      util.paramArray( params.csi ), v => util.iucnValues[v.toLowerCase( )]
    ), _.identity );
    if ( values.length > 0 ) {
      searchFilters.push( ObservationQueryBuilder.conservationCondition( "iucn", values, params ) );
    }
  }
  // conservation status authority
  if ( params.csa ) {
    values = _.map( util.paramArray( params.csa ), v => v.toLowerCase( ) );
    searchFilters.push(
      ObservationQueryBuilder.conservationCondition( "authority", values, params )
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
  if ( params.acc_below_or_unknown ) {
    searchFilters.push( {
      bool: {
        should: [
          {
            range: {
              positional_accuracy: {
                lt: params.acc_below_or_unknown
              }
            }
          },
          {
            bool: {
              must_not: [
                {
                  exists: {
                    field: "positional_accuracy"
                  }
                }
              ]
            }
          }
        ]
      }
    } );
  }

  _.each( ["geoprivacy", "taxon_geoprivacy"], geoprivacyField => {
    if ( params[geoprivacyField] === "obscured_private" ) {
      searchFilters.push( esClient.termFilter( geoprivacyField, ["obscured", "private"] ) );
    } else if ( params[geoprivacyField] && params[geoprivacyField] !== "any" ) {
      const geoprivacyFieldFilter = esClient.termFilter( geoprivacyField, params[geoprivacyField] );
      if ( geoprivacyFieldFilter.terms[geoprivacyField].indexOf( "open" ) < 0 ) {
        searchFilters.push( geoprivacyFieldFilter );
      } else {
        // Since "open" means the field isn't there or is open, we need to do
        // something like "geoprivacy IS NULL OR geoprivacy is open"
        geoprivacyFieldFilter.terms[geoprivacyField] = _.filter(
          geoprivacyFieldFilter.terms[geoprivacyField], g => g === "open"
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
    case "none":
      break;
    default:
      sort = { created_at: sortOrder };
  }
  return {
    search_filters: searchFilters,
    inverse_filters: inverseFilters,
    grouped_inverse_filters: params.grouped_inverse_filters || [],
    sort
  };
};

ObservationQueryBuilder.applyProjectRules = async req => {
  // if given a project whose rules to apply, fetch those
  // rules and call this method again with the merged params
  const rules = await req.inat.apply_project_rules_for.searchParams( );
  delete req.query.apply_project_rules_for;
  delete req.inat.apply_project_rules_for;
  _.assignIn( req.query, rules );
};

ObservationQueryBuilder.applyInverseProjectRules = async req => {
  const rules = await req.inat.not_matching_project_rules_for.searchParams( );
  delete req.query.not_matching_project_rules_for;
  delete req.inat.not_matching_project_rules_for;
  const components = await ObservationQueryBuilder.reqToElasticQueryComponents( { query: rules } );
  _.assignIn( req.query, { grouped_inverse_filters: components.search_filters } );
};

ObservationQueryBuilder.applyListTaxaFilters = async req => {
  // if given a list, fetch its taxon_ids and use those as params
  const listTaxonIDs = await req.inat.list.taxonIDs( );
  delete req.query.list_id;
  delete req.inat.list;
  req.query.taxon_ids = util.paramArray( req.query.taxon_ids ) || [];
  req.query.taxon_ids = req.query.taxon_ids.concat( listTaxonIDs );
};

ObservationQueryBuilder.applyNotInListTaxaFilters = async req => {
  // if given a list, fetch its taxon_ids and use those as without_ params
  const listTaxonIDs = await req.inat.not_in_list.taxonIDs( );
  delete req.query.not_in_list_id;
  delete req.inat.not_in_list;
  req.query.without_taxon_id = util.paramArray( req.query.without_taxon_id ) || [];
  req.query.without_taxon_id = req.query.without_taxon_id.concat( listTaxonIDs );
};

ObservationQueryBuilder.applyUnobservedByUserFilters = async req => {
  if ( req.inat.unobservedByUser ) {
    const observedTaxonIDs = await ESModel.userObservedTaxonIDsCached(
      req.inat.unobservedByUser.id
    );
    if ( !_.isEmpty( observedTaxonIDs ) ) {
      delete req.query.unobserved_by_user_id;
      delete req.inat.unobservedByUser;
      req.query.without_direct_taxon_id = observedTaxonIDs;
    }
  }
};

ObservationQueryBuilder.applyProjectMembershipRules = async req => {
  const userIDs = _.compact( _.uniq( _.flatten( _.map( req.inat.members_of_project, "user_ids" ) ) ) );
  let existingQueryUserIDs;
  let queryUserIDs;
  if ( req.query.user_id ) {
    existingQueryUserIDs = _.isArray( req.query.user_id )
      ? req.query.user_id
      : _.map( req.query.user_id.split( "," ), Number );
  }
  if ( _.isEmpty( existingQueryUserIDs ) ) {
    queryUserIDs = userIDs.join( "," );
  } else {
    queryUserIDs = _.intersection( userIDs, existingQueryUserIDs ).join( "," );
  }
  if ( _.isEmpty( queryUserIDs ) ) {
    queryUserIDs = "-1";
  }
  delete req.query.members_of_project;
  delete req.inat.members_of_project;
  _.assignIn( req.query, { user_id: queryUserIDs } );
};

ObservationQueryBuilder.applyTaxonSearchFilter = async ( req, taxonSearch, reqInatKey ) => {
  const query = {
    filters: [
      esClient.termFilter( "is_active", true ),
      {
        nested: {
          path: "names",
          query: {
            match: {
              "names.name": {
                query: taxonSearch,
                operator: "and"
              }
            }
          }
        }
      }
    ],
    size: 2000,
    _source: ["id"]
  };
  const data = await ESModel.elasticResults( { }, query, "taxa" );
  req.inat[reqInatKey] = _.map( data.hits.hits, h => h._source.id );
};

ObservationQueryBuilder.applyUserFolloweeFilters = async req => {
  const followedByUserID = Number( req.query.followed_by_user_id );
  delete req.query.followed_by_user_id;
  if ( req.query.user_id || !followedByUserID ) {
    return;
  }
  const query = squel.select( ).field( "s.resource_id" )
    .from( "subscriptions s" )
    .where( "s.resource_type = ?", "User" )
    .where( "s.user_id = ?", followedByUserID );
  const { rows } = await pgClient.connection.query( query.toString( ) );
  req.query.user_id = _.isEmpty( rows ) ? "0" : _.map( rows, "resource_id" ).join( "," );
};

ObservationQueryBuilder.applyUserSubscriptionFilters = async req => {
  const subscribedToByUserID = Number( req.query.subscribed_to_by_user_id );
  delete req.query.subscribed_to_by_user_id;
  if ( req.query.user_id || !subscribedToByUserID ) {
    return;
  }
  const query = squel.select( ).field( "s.resource_type, s.resource_id, s.taxon_id" )
    .from( "subscriptions s" )
    .where( "s.resource_type IN ?", ["Place", "Taxon"] )
    .where( "s.user_id = ?", subscribedToByUserID );
  const { rows } = await pgClient.connection.query( query.toString( ) );
  const subscriptionFilters = _.map( rows, r => {
    const filters = [];
    if ( r.resource_type === "Taxon" ) {
      filters.push( { term: { "taxon.ancestor_ids.keyword": r.resource_id } } );
    } else {
      filters.push( { term: { place_ids: r.resource_id } } );
      if ( r.taxon_id ) {
        filters.push( { term: { "taxon.ancestor_ids.keyword": r.taxon_id } } );
      }
    }
    return filters.length === 1 ? filters : {
      bool: {
        must: filters
      }
    };
  } );

  req.query.filters = req.query.filters || [];
  if ( _.isEmpty( subscriptionFilters ) ) {
    // TODO: we could use a standardized "fail" indicator
    req.query.user_id = "-1";
  } else if ( subscriptionFilters.length === 1 ) {
    req.query.filters.push( _.flatten( subscriptionFilters ) );
  } else {
    req.query.filters.push( {
      bool: {
        should: _.flatten( subscriptionFilters )
      }
    } );
  }
};

ObservationQueryBuilder.conservationCondition = ( esField, values, params ) => {
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

const removeProjectID = ( ids, project ) => {
  // remove the umbrella ID from the `project_id` param
  _.remove( ids, id => (
    ( Number( id ) && Number( id ) === project.id )
    || ( id === project.slug )
  ) );
};

ObservationQueryBuilder.applyCollectionProjectRules = async ( req, options = { } ) => {
  const { inverse } = options;
  const projects = inverse ? req.inat.not_in_project : req.inat.project;
  if ( inverse ) {
    delete req.inat.not_in_project;
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
      if ( inverse ) {
        req.query.not_in_project = queryProjectIDs;
      } else {
        // the user requested to filter by a new-style project, but for some reason
        // none of them have search parameters. Return an unmatchable filter
        // indicating no obervations match the rules of these projects
        req.query.collectionProjectFilters = [{ term: { id: -1 } }];
        // override the project_id to exclude IDs of new-style projects
        if ( _.isEmpty( queryProjectIDs ) ) {
          delete req.query.project_id;
        } else {
          req.query.project_id = queryProjectIDs;
        }
      }
    }
    return;
  }
  const singleUmbrella = projects.length === 1 && projects[0].project_type === "umbrella"
    ? projects[0]
    : null;
  const queryFilters = await ObservationQueryBuilder.projectsQueryFilters( projectsWithRules, {
    userSession: req.userSession,
    // We will need this in placeFilterForUser when the observer trusts the
    // umbrella but not any projects in that umbrella
    umbrella: singleUmbrella
  } );
  const shoulds = [];
  // all the project filter must be true
  _.each( queryFilters, q => {
    shoulds.push( {
      bool: {
        filter: q.filters,
        must_not: q.inverse_filters
      }
    } );
  } );
  // override the project_id to exclude IDs of new-style projects
  if ( inverse ) {
    req.query.not_in_project = queryProjectIDs;
    req.query.collectionProjectInverseFilters = shoulds;
  } else {
    if ( _.isEmpty( queryProjectIDs ) ) {
      delete req.query.project_id;
    } else {
      req.query.project_id = queryProjectIDs;
    }
    req.query.collectionProjectFilters = shoulds;
  }
};

ObservationQueryBuilder.projectsQueryFilters = async ( projects, options = {} ) => {
  const queryFilters = await Promise.all(
    _.map( projects, p => ObservationQueryBuilder.projectRulesQueryFilters( p, options ) )
  );
  return _.map( projects, ( p, index ) => ( {
    project: p,
    filters: queryFilters[index].searchFilters,
    inverse_filters: queryFilters[index].inverseFilters
  } ) );
};

ObservationQueryBuilder.projectRulesQueryFilters = async ( collection, options = {} ) => {
  let collectParamsHash = {};
  if ( collection.project_type === "umbrella" ) {
    return { searchFilters: [{ term: { id: -1 } }] };
  }
  if ( collection.project_type !== "collection" ) {
    return { searchFilters: [{ term: { "project_ids.keyword": collection.id } }] };
  }
  // make an object of all the obs search parameters for this project
  let membersOnly;
  _.each( collection.search_parameters, p => {
    // make sure all values are strings, as they would be in HTTP GET params
    // this will comma-concatenate arrays (e.g. [a,b,c] => "a,b,c")
    if ( p.field === "members_only" ) {
      if ( p.value === true ) {
        membersOnly = true;
      }
    } else {
      collectParamsHash[p.field] = _.toString( p.value );
    }
  } );
  if ( !collectParamsHash.taxon_id
    && !collectParamsHash.place_id
    && !collectParamsHash.term_id
    && !collectParamsHash.d1
    && !collectParamsHash.month
    && !collectParamsHash.observed_on
    && _.isEmpty( collection.project_observation_rules )
    && !membersOnly ) {
    // The new-style project does not have any major search parameters.
    // Return an unmatchable filter indicating no obervations in this project
    collectParamsHash = { id: "-1" };
  }
  if ( membersOnly ) {
    if ( collectParamsHash.user_id ) {
      collectParamsHash.user_id = _.intersection(
        collection.user_ids, _.map( collectParamsHash.user_id.split( "," ), Number )
      ).join( "," );
      if ( _.isEmpty( collectParamsHash.user_id ) ) {
        collectParamsHash.user_id = "-1";
      }
    } else {
      collectParamsHash.user_id = collection.user_ids.join( "," );
    }
  }
  if ( _.isEmpty( collectParamsHash ) ) {
    // The new-style project does not have search parameters.
    // Return an unmatchable filter indicating no obervations in this project
    return { searchFilters: [{ term: { id: -1 } }] };
  }
  // turn the HTTP-like params into ES query filters and return
  const params = await ObservationQueryBuilder.reqToElasticQueryComponents( {
    query: collectParamsHash,
    // not using inat.project to avoid an infinite loop
    _collectionProject: collection,
    _umbrellaProject: options.umbrella,
    userSession: options.userSession
  } );
  return {
    searchFilters: params.search_filters,
    inverseFilters: params.inverse_filters
  };
};

module.exports = ObservationQueryBuilder;
