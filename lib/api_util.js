/* eslint no-console: 0 */
const _ = require( "lodash" );
const List = require( "./models/list" );
const Place = require( "./models/place" );
const Project = require( "./models/project" );
const Taxon = require( "./models/taxon" );
const User = require( "./models/user" );
const util = require( "./util" );

const apiUtil = class apiUtil {
  static async lookupInstancesMiddleware( req ) {
    req.inat = req.inat || { };
    const lookupPromises = [];
    const singleInstancesToLookup = [
      ["taxon_id", "taxon", Taxon.findByID],
      ["place_id", "place", Place.findByID],
      ["user_id", "user", User.findByLoginOrID],
      ["preferred_place_id", "preferredPlace", Place.findByID],
      ["unobserved_by_user_id", "unobservedByUser", User.findByLoginOrID],
      ["observed_by_user_id", "observedByUser", User.findByLoginOrID],
      ["apply_project_rules_for", "apply_project_rules_for", Project.findByID],
      ["not_matching_project_rules_for", "not_matching_project_rules_for", Project.findByID],
      ["list_id", "list", List.findByID],
      ["not_in_list_id", "not_in_list", List.findByID]
    ];
    _.each( singleInstancesToLookup, lookupMapping => {
      const [paramKey, objectKey, lookupMethod] = lookupMapping;
      lookupPromises.push(
        apiUtil.lookupInstance( req, paramKey, lookupMethod, objectKey )
      );
    } );

    const arrayInstancesToLookup = [
      ["project_id", "project", Project.findAllByIDElastic],
      ["not_in_project", "not_in_project", Project.findAllByIDElastic],
      ["members_of_project", "members_of_project", Project.findAllByIDElastic],
      ["ident_user_id", "ident_users", User.findAllByLoginOrID],
      ["without_ident_user_id", "without_ident_users", User.findAllByLoginOrID]
    ];
    _.each( arrayInstancesToLookup, lookupMapping => {
      const [paramKey, objectKey, lookupMethod] = lookupMapping;
      lookupPromises.push(
        apiUtil.lookupInstances( req, paramKey, lookupMethod, objectKey )
      );
    } );
    return Promise.all( lookupPromises );
  }

  static async lookupInstance( req, paramKey, method, objectKey ) {
    if ( !req.query[paramKey] ) { return null; }
    // the value could be a comma-delimited list of IDs
    const ids = util.paramArray( req.query[paramKey] );
    if ( ids.length !== 1 ) { return null; }
    if ( ids[0] === "any" ) { return null; }
    // lookup the instance by ID
    const obj = await method( ids[0] );
    if ( !obj ) {
      const e = new Error( 422 );
      e.custom_message = `Unknown ${paramKey} ${req.query[paramKey]}`;
      e.status = 422;
      throw e;
    }
    req.inat[objectKey] = obj;
    req.query[paramKey] = obj.id;
    return obj;
  }

  static async lookupInstances( req, paramKey, method, objectKey ) {
    if ( !req.query[paramKey] ) { return null; }
    // the value could be a comma-delimited list of IDs
    const ids = util.paramArray( req.query[paramKey] );
    if ( ids.length === 0 ) { return null; }
    if ( ids[0] === "any" ) { return null; }
    // lookup the instances by ID
    const objs = await method( ids );
    // throw an error if NONE of the instances exist
    // otherwise the param would not be included at all, and thus
    // the request could return many more results than expected
    if ( _.isEmpty( objs ) ) {
      const e = new Error( 422 );
      e.custom_message = `Unknown ${paramKey}: [${req.query[paramKey]}]`;
      e.status = 422;
      throw e;
    }
    req.inat[objectKey] = objs;
    req.query[paramKey] = _.map( objs, "id" );
    return objs;
  }
};

module.exports = apiUtil;
