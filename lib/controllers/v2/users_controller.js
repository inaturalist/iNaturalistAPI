const _ = require( "lodash" );
const { users } = require( "inaturalistjs" );
const config = require( "../../../config" );
const pgClient = require( "../../pg_client" );
const esClient = require( "../../es_client" );
const User = require( "../../models/user" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/users_controller" );
const { httpError } = require( "../../util" );

const updateSession = async req => {
  await InaturalistAPI.iNatJSWrap( users.update_session, req );
};

const show = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  // lookup the user with the given ID parameter which may be a login string or integer ID
  const user = await User.findByLoginOrID( req.params.id );
  if ( !user ) {
    throw httpError( 404, "User does not exist" );
  }
  // fetch the user record with additional columns to return
  const userDetails = await User.find( user.id, {
    fields: [
      "created_at",
      "description",
      "icon",
      "id",
      "identifications_count",
      "journal_posts_count",
      "last_active",
      "login",
      "monthly_supporter",
      "name",
      "observations_count",
      "orcid",
      "roles",
      "site",
      "spam",
      "species_count",
      "suspended",
      "updated_at",
      "uuid"
    ]
  } );
  if ( !userDetails ) {
    throw httpError( 404, "User does not exist" );
  }
  return InaturalistAPI.resultsHash( {
    total: 1,
    per_page: req.query.per_page,
    page: req.query.page,
    results: [userDetails]
  } );
};

const index = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  const filters = [];
  if ( req.query.following ) {
    const followingUser = await User.findByLoginOrID( req.query.following );
    if ( !followingUser ) {
      throw httpError( 422, `User ${req.query.following} does not exist` );
    }
    const { rows: followers } = await pgClient.replica.query(
      `SELECT user_id FROM friendships WHERE friend_id = ${followingUser.id}`
    );
    filters.push( esClient.termFilter( "id", _.map( followers, f => f.user_id ) ) );
  }
  if ( req.query.followed_by ) {
    const followedByUser = await User.findByLoginOrID( req.query.followed_by );
    if ( !followedByUser ) {
      throw httpError( 422, `User ${req.query.followed_by} does not exist` );
    }
    const { rows: followees } = await pgClient.replica.query(
      `SELECT friend_id FROM friendships WHERE user_id = ${followedByUser.id}`
    );
    filters.push( esClient.termFilter( "id", _.map( followees, f => f.friend_id ) ) );
  }
  if ( req.query.orcid ) {
    filters.push( esClient.termFilter( "orcid", req.query.orcid ) );
  }

  const response = await esClient.search( "users", {
    body: {
      query: {
        bool: {
          filter: filters
        }
      },
      _source: { excludes: User.elasticExcludeFields },
      sort: { id: "asc" },
      size: req.query.per_page
    }
  } );

  return InaturalistAPI.resultsHash( {
    total: response.hits.total.value,
    per_page: req.query.per_page,
    page: Number( req.query.page ),
    results: _.map( response.hits.hits, h => new User( h._source ) )
  } );
};

const update = async req => {
  const user = await ctrlv1.update( req );
  // removing fields from the v1 response that do not belong in the v2 response
  delete user.login_autocomplete;
  delete user.login_exact;
  delete user.name_autocomplete;
  delete user.activity_count;
  delete user.universal_search_rank;
  delete user.icon_url;
  return user;
};

const resetPassword = async req => {
  const requestAbortController = new AbortController( );
  const requestTimeout = setTimeout( ( ) => {
    requestAbortController.abort( );
  }, 10000 );
  try {
    const response = await fetch( `${config.apiURL}/users/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: `user[email]=${encodeURIComponent( req.body.user.email )}`,
      signal: requestAbortController.signal
    } );
    if ( !response.ok ) {
      throw httpError( 500, "Password reset failed" );
    }
  } catch ( error ) {
    throw httpError( 500, "Password reset failed" );
  } finally {
    clearTimeout( requestTimeout );
  }
};

module.exports = {
  index,
  show,
  update,
  updateSession,
  mute: ctrlv1.mute,
  unmute: ctrlv1.unmute,
  block: ctrlv1.block,
  unblock: ctrlv1.unblock,
  resetPassword
};
