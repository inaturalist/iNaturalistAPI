const _ = require( "lodash" );
const Model = require( "./model" );

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
};

module.exports = Announcement;
