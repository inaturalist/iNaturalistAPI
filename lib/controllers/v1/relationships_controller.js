const { relationships } = require( "inaturalistjs" );
const squel = require( "safe-squel" );
const pgClient = require( "../../pg_client" );
const Relationship = require( "../../models/relationship" );
const InaturalistAPI = require( "../../inaturalist_api" );

const RelationshipsController = class RelationshipsController {
  static async index( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const { page, perPage, offset } = InaturalistAPI.paginationData( req );
    const order = req.query.order === "asc" ? "asc" : "desc";
    const orderBy = req.query.order_by ? "friendships.id" : "users.login";
    let query = squel.select( )
      .field( "friendships.id" )
      .field( "friendships.user_id" )
      .field( "friend_id" )
      .field( "trust" )
      .field( "following" )
      .field( "friendships.created_at" )
      .field( "friendships.updated_at" )
      .field( "COUNT(*) OVER()", "total_count" )
      .from( "friendships" )
      .join( "users", null, "users.id = friendships.friend_id" )
      .where( "user_id = ?", req.userSession.user_id )
      .order( orderBy, order )
      .offset( offset )
      .limit( perPage );
    if ( req.query.q ) {
      query = query.where( "users.login ilike ?", `%${req.query.q}%` );
    }
    if ( req.query.trusted === "yes" ) {
      query = query.where( "trust" );
    } else if ( req.query.trusted === "no" ) {
      query = query.where( "NOT trust" );
    }
    if ( req.query.following === "yes" ) {
      query = query.where( "following" );
    } else if ( req.query.following === "no" ) {
      query = query.where( "NOT following" );
    }
    const sql = query.toString( );
    const { rows } = await pgClient.connection.query( sql );
    const total = rows.length > 0 ? parseInt( rows[0].total_count, 0 ) : 0;
    await Relationship.preloadInto( rows );
    return InaturalistAPI.resultsHash( {
      total,
      per_page: perPage,
      page,
      results: rows.map( r => {
        delete r.total_count;
        return r;
      } )
    } );
  }

  static async create( req ) {
    const response = await InaturalistAPI.iNatJSWrap( relationships.create, req );
    const arr = [response];
    await Relationship.preloadInto( arr );
    return arr[0];
  }

  static async update( req ) {
    const response = await InaturalistAPI.iNatJSWrap( relationships.update, req );
    const arr = [response];
    await Relationship.preloadInto( arr );
    return arr[0];
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( relationships.delete, req );
  }
};

module.exports = RelationshipsController;
