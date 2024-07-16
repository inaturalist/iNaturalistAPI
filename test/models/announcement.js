const { expect } = require( "chai" );
const moment = require( "moment" );
const Announcement = require( "../../lib/models/announcement" );

describe( "Announcement", ( ) => {
  describe( "valueMatchesTargetGroupPartition", ( ) => {
    it( "returns recognized even and odd", ( ) => {
      expect( Announcement.valueMatchesTargetGroupPartition( 1, "odd" ) ).to.be.true;
      expect( Announcement.valueMatchesTargetGroupPartition( 1, "even" ) ).to.be.false;

      expect( Announcement.valueMatchesTargetGroupPartition( 2, "even" ) ).to.be.true;
      expect( Announcement.valueMatchesTargetGroupPartition( 2, "odd" ) ).to.be.false;
    } );

    it( "returns false for all other partitions", ( ) => {
      expect( Announcement.valueMatchesTargetGroupPartition( 1, null ) ).to.be.false;
      expect( Announcement.valueMatchesTargetGroupPartition( 1, true ) ).to.be.false;
      expect( Announcement.valueMatchesTargetGroupPartition( 1, "oddd" ) ).to.be.false;
      expect( Announcement.valueMatchesTargetGroupPartition( 1, "anything else" ) ).to.be.false;
    } );
  } );

  describe( "targetedToRequestor", ( ) => {
    it( "returns true if there is no target", ( ) => {
      expect( Announcement.targetedToRequestor( {}, {} ) ).to.be.true;
    } );

    it( "returns true if there is no partition", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity"
      }, {} ) ).to.be.true;
    } );

    it( "returns false if there is a partition but no user", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity",
        target_group_partition: "even"
      }, {} ) ).to.be.false;
    } );

    it( "returns true if there is a partition with matching user for user_id_parity", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          user_id: 1
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          user_id: 2
        }
      } ) ).to.be.false;

      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          user_id: 2
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          user_id: 1
        }
      } ) ).to.be.false;
    } );

    it( "returns true if there is a partition with matching user for created_second_parity", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "created_second_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          created_at: moment( "2024-01-01 00:00:01" )
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "created_second_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          created_at: moment( "2024-01-01 00:00:00" )
        }
      } ) ).to.be.false;

      expect( Announcement.targetedToRequestor( {
        target_group_type: "created_second_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          created_at: moment( "2024-01-01 00:00:00" )
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "created_second_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          created_at: moment( "2024-01-01 00:00:01" )
        }
      } ) ).to.be.false;
    } );

    it( "returns true if there is a partition with matching user for user_id_digit_sum_parity", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_digit_sum_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          user_id: 100
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_digit_sum_parity",
        target_group_partition: "odd"
      }, {
        userSession: {
          user_id: 101
        }
      } ) ).to.be.false;

      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_digit_sum_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          user_id: 101
        }
      } ) ).to.be.true;
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_digit_sum_parity",
        target_group_partition: "even"
      }, {
        userSession: {
          user_id: 100
        }
      } ) ).to.be.false;
    } );

    it( "returns false if there is an unhandled group", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "new_group_type",
        target_group_partition: "even"
      }, {
        userSession: {
          user_id: 100
        }
      } ) ).to.be.false;
    } );

    it( "returns false if there is an unhandled partition", ( ) => {
      expect( Announcement.targetedToRequestor( {
        target_group_type: "user_id_digit_sum_parity",
        target_group_partition: "new_partition"
      }, {
        userSession: {
          user_id: 100
        }
      } ) ).to.be.false;
    } );
  } );
} );
