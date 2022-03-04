// eslint-disable-next-line camelcase
const { authorized_applications } = require( "inaturalistjs" );
const squel = require( "safe-squel" );
const InaturalistAPI = require( "../../inaturalist_api" );
const pgClient = require( "../../pg_client" );

const AuthorizedApplicationsController = class AuthorizedApplicationsController {
  static async index( req ) {
    if ( !req.userSession ) {
      throw new Error( 401 );
    }
    const { page, perPage, offset } = InaturalistAPI.paginationData( req );
    const query = squel.select( )
      .field( "MAX(oauth_access_tokens.created_at)", "created_at" )
      .field( "MAX(oauth_access_tokens.scopes)", "scopes" )
      .field( "oauth_applications.id", "application_id" )
      .field( "oauth_applications.name", "application_name" )
      .field( "BOOL_AND(oauth_applications.official)", "official" )
      .field( "COUNT(*) OVER()", "total_count" )
      .from( "oauth_access_tokens" )
      .join( "oauth_applications", null, "oauth_applications.id = oauth_access_tokens.application_id" )
      .where( "oauth_access_tokens.resource_owner_id = ?", req.userSession.user_id )
      .where( "oauth_access_tokens.revoked_at IS NULL" )
      .group( "oauth_applications.id, oauth_applications.name" )
      .offset( offset )
      .limit( perPage )
      .order( "oauth_applications.id" );
    const sql = query.toString( );
    const { rows } = await pgClient.connection.query( sql );
    return {
      total_results: rows.length === 0 ? 0 : parseInt( rows[0].total_count, 0 ),
      page,
      per_page: perPage,
      results: rows.map( row => ( {
        created_at: row.created_at,
        scopes: row.scopes.split( " " ).sort( ),
        application: {
          id: row.application_id,
          name: row.application_name,
          official: row.official
        }
      } ) )
    };
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( authorized_applications.delete, req );
  }
};

module.exports = AuthorizedApplicationsController;
