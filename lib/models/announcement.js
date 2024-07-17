const _ = require( "lodash" );
const squel = require( "safe-squel" );
const moment = require( "moment" );
const Model = require( "./model" );
const pgClient = require( "../pg_client" );

const Announcement = class Announcement extends Model {
  static valueMatchesTargetGroupPartition( value, partition ) {
    if ( partition === "even" ) {
      return value % 2 === 0;
    }
    if ( partition === "odd" ) {
      return value % 2 === 1;
    }
    return false;
  }

  static targetedToRequestor( announcement, req ) {
    // if there are no target groups for the announcement, everyone is targeted
    if ( _.isEmpty( announcement.target_group_type )
      || _.isEmpty( announcement.target_group_partition ) ) {
      return true;
    }
    // only logged-in users can be targeted
    if ( !req.userSession ) {
      return false;
    }

    if ( announcement.target_group_type === "user_id_parity" ) {
      const value = req.userSession.user_id;
      return Announcement.valueMatchesTargetGroupPartition(
        value, announcement.target_group_partition
      );
    }

    if ( announcement.target_group_type === "created_second_parity" ) {
      const value = req.userSession.created_at.unix( );
      return Announcement.valueMatchesTargetGroupPartition(
        value, announcement.target_group_partition
      );
    }

    if ( announcement.target_group_type === "user_id_digit_sum_parity" ) {
      const value = _.sum( req.userSession.user_id.toString( ).split( "" ).map( Number ) );
      return Announcement.valueMatchesTargetGroupPartition(
        value, announcement.target_group_partition
      );
    }
    return false;
  }

  static async requestorMatchesDonationRequirements( announcement, req ) {
    if ( announcement.include_donor_start_date || announcement.include_donor_end_date ) {
      if ( !req.userSession ) {
        return false;
      }
      const excludeDonorQuery = squel.select( )
        .field( "id" )
        .from( "user_donations" )
        .where( "user_id = ?", req.userSession.user_id )
        .where( "donated_at >= ? AND donated_at <= ?",
          announcement.include_donor_start_date || "2018-01-01",
          announcement.include_donor_end_date || moment( ).format( ) );
      const { rows } = await pgClient.replica.query( excludeDonorQuery.toString( ) );
      if ( _.isEmpty( rows ) ) {
        return false;
      }
    }

    if ( ( announcement.exclude_donor_start_date || announcement.exclude_donor_end_date )
      && req.userSession
    ) {
      const excludeDonorQuery = squel.select( )
        .field( "id" )
        .from( "user_donations" )
        .where( "user_id = ?", req.userSession.user_id )
        .where( "donated_at >= ? AND donated_at <= ?",
          announcement.exclude_donor_start_date || "2018-01-01",
          announcement.exclude_donor_end_date || moment( ).format( ) );
      const { rows } = await pgClient.replica.query( excludeDonorQuery.toString( ) );
      if ( !_.isEmpty( rows ) ) {
        return false;
      }
    }
    return true;
  }
};

module.exports = Announcement;
