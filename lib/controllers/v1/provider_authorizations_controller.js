const _ = require( "lodash" );
// eslint-disable-next-line camelcase
const { provider_authorizations } = require( "inaturalistjs" );
const squel = require( "safe-squel" );
const InaturalistAPI = require( "../../inaturalist_api" );
const pgClient = require( "../../pg_client" );

const ProviderAuthorizationsController = class ProviderAuthorizationsController {
  static async index( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const { page, perPage, offset } = InaturalistAPI.paginationData( req );
    const query = squel.select( )
      .field( "id" )
      .field( "provider_name" )
      .field( "provider_uid" )
      .field( "user_id" )
      .field( "created_at" )
      .field( "updated_at" )
      .field( "scope" )
      .field( "COUNT(*) OVER()", "total_count" )
      .from( "provider_authorizations" )
      .where( "provider_authorizations.user_id = ?", req.userSession.user_id )
      .offset( offset )
      .limit( perPage )
      .order( "provider_authorizations.id" );
    const sql = query.toString( );
    const { rows } = await pgClient.connection.query( sql );
    return {
      total_results: rows.length === 0 ? 0 : parseInt( rows[0].total_count, 0 ),
      page,
      per_page: perPage,
      results: _.map( rows, row => _.pick( row, [
        "id",
        "provider_name",
        "provider_uid",
        "user_id",
        "created_at",
        "updated_at",
        "scope"
      ] ) )
    };
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( provider_authorizations.delete, req );
  }
};

module.exports = ProviderAuthorizationsController;
