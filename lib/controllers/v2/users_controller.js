const _ = require( "lodash" );
const { users } = require( "inaturalistjs" );
const pgClient = require( "../../pg_client" );
const esClient = require( "../../es_client" );
const User = require( "../../models/user" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/taxa_controller" );
const { httpError } = require( "../../util" );

const updateSession = async req => {
  await InaturalistAPI.iNatJSWrap( users.update_session, req );
};

const show = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  const user = await User.find( req.params.id, {
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
  if ( !user ) {
    throw httpError( 404, "User does not exist" );
  }
  return InaturalistAPI.resultsHash( {
    total: 1,
    per_page: req.query.per_page,
    page: req.query.page,
    results: [user]
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
    const { rows: followers } = await pgClient.connection.query(
      `SELECT user_id FROM friendships WHERE friend_id = ${followingUser.id}`
    );
    filters.push( esClient.termFilter( "id", _.map( followers, f => f.user_id ) ) );
  }
  if ( req.query.followed_by ) {
    const followedByUser = await User.findByLoginOrID( req.query.followed_by );
    if ( !followedByUser ) {
      throw httpError( 422, `User ${req.query.followed_by} does not exist` );
    }
    const { rows: followees } = await pgClient.connection.query(
      `SELECT friend_id FROM friendships WHERE user_id = ${followedByUser.id}`
    );
    filters.push( esClient.termFilter( "id", _.map( followees, f => f.friend_id ) ) );
  }
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index: `${process.env.NODE_ENV || global.config.environment}_users`,
    body: {
      query: {
        bool: {
          filter: filters
        }
      },
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

module.exports = {
  index,
  show,
  update: ctrlv1.update,
  updateSession
};
