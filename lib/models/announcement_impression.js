const _ = require( "lodash" );
const squel = require( "safe-squel" );
const Model = require( "./model" );
const pgClient = require( "../pg_client" );
const Logstasher = require( "../logstasher" );

const AnnouncementImpression = class AnnouncementImpression extends Model {
  static async createAnnouncementImpressions( req, announcements ) {
    if ( _.isEmpty( announcements ) ) {
      return;
    }

    await Promise.all( announcements.map( async announcement => {
      Logstasher.writeAnnouncementImpressionLog( req, announcement.id );
      await AnnouncementImpression.createDatabaseAnnouncementImpression( req, announcement );
    } ) );
  }

  static async createDatabaseAnnouncementImpression( req, announcement ) {
    if ( _.isEmpty( announcement ) ) {
      return;
    }

    const requestIP = Logstasher.ipFromRequest( req );
    let queryClauses = squel.expr( )
      .and( "announcement_id = ?", announcement.id )
      .and( "platform_type = ?", "mobile" );
    if ( req.userSession ) {
      queryClauses = queryClauses
        .and( "user_id = ?", req.userSession.user_id );
      const existingImpression = await AnnouncementImpression
        .fetchFirstAnnouncemenImpressiontMatchingQuery( queryClauses );
      if ( existingImpression ) {
        const updateQuery = squel.update( )
          .table( "announcement_impressions" )
          .set( "impressions_count", existingImpression.impressions_count + 1 )
          .set( "request_ip", requestIP )
          .set( "updated_at", squel.str( "NOW()" ) )
          .where( "id = ?", existingImpression.id );
        await pgClient.query( updateQuery.toString( ) );
        return;
      }
      const insertQuery = squel.insert()
        .into( "announcement_impressions" )
        .set( "announcement_id", announcement.id )
        .set( "platform_type", "mobile" )
        .set( "user_id", req.userSession.user_id )
        .set( "request_ip", requestIP )
        .set( "impressions_count", 1 )
        .set( "created_at", squel.str( "NOW()" ) )
        .set( "updated_at", squel.str( "NOW()" ) );
      await pgClient.query( insertQuery.toString( ) );
      return;
    }

    queryClauses = queryClauses
      .and( "request_ip = ?", requestIP );
    const existingImpression = await AnnouncementImpression
      .fetchFirstAnnouncemenImpressiontMatchingQuery( queryClauses );
    if ( existingImpression ) {
      const updateQuery = squel.update( )
        .table( "announcement_impressions" )
        .set( "impressions_count", existingImpression.impressions_count + 1 )
        .set( "updated_at", squel.str( "NOW()" ) )
        .where( "id = ?", existingImpression.id );
      await pgClient.query( updateQuery.toString( ) );
      return;
    }
    const insertQuery = squel.insert()
      .into( "announcement_impressions" )
      .set( "announcement_id", announcement.id )
      .set( "platform_type", "mobile" )
      .set( "request_ip", requestIP )
      .set( "impressions_count", 1 )
      .set( "created_at", squel.str( "NOW()" ) )
      .set( "updated_at", squel.str( "NOW()" ) );
    await pgClient.query( insertQuery.toString( ) );
  }

  static async fetchFirstAnnouncemenImpressiontMatchingQuery( queryClauses ) {
    const existingImpressionQuery = squel.select( )
      .field( "*" )
      .from( "announcement_impressions" )
      .where( queryClauses );
    const { rows } = await pgClient.query( existingImpressionQuery.toString( ) );
    if ( _.isEmpty( rows ) ) {
      return null;
    }
    return rows[0];
  }
};

module.exports = AnnouncementImpression;
