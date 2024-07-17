const { expect } = require( "chai" );
const _ = require( "lodash" );
const moment = require( "moment" );
const fs = require( "fs" );
const Announcement = require( "../../lib/models/announcement" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

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

  describe( "targetedToRequestor", ( ) => {
    it( "returns false if there are include_donor dates and no requestor", async ( ) => {
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_start_date: "2024-01-01"
      }, { } ) ).to.be.false;
    } );

    it( "returns true by default", async ( ) => {
      expect( await Announcement.requestorMatchesDonationRequirements( { }, { } ) ).to.be.true;
    } );

    it( "returns true if requestor donated after start date", async ( ) => {
      const donor2024 = _.find( fixtures.postgresql.users, u => u.name?.match( /2024 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_start_date: "2024-01-01"
      }, {
        userSession: {
          user_id: donor2024.id
        }
      } ) ).to.be.true;
    } );

    it( "returns true if requestor donated before end date", async ( ) => {
      const donor2024 = _.find( fixtures.postgresql.users, u => u.name?.match( /2024 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_end_date: "2025-01-01"
      }, {
        userSession: {
          user_id: donor2024.id
        }
      } ) ).to.be.true;
    } );

    it( "returns true if requestor donated between start and end date", async ( ) => {
      const donor2024 = _.find( fixtures.postgresql.users, u => u.name?.match( /2024 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_start_date: "2024-03-01",
        include_donor_end_date: "2024-05-01"
      }, {
        userSession: {
          user_id: donor2024.id
        }
      } ) ).to.be.true;
    } );

    it( "returns false if requestor donated outside start and end date", async ( ) => {
      const donor2023 = _.find( fixtures.postgresql.users, u => u.name?.match( /2023 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_start_date: "2024-03-01",
        include_donor_end_date: "2024-05-01"
      }, {
        userSession: {
          user_id: donor2023.id
        }
      } ) ).to.be.false;
    } );

    it( "returns false if announcement has include donor dates and requstor did not donate", async ( ) => {
      expect( await Announcement.requestorMatchesDonationRequirements( {
        include_donor_start_date: "2024-03-01",
        include_donor_end_date: "2024-05-01"
      }, {
        userSession: {
          user_id: 1
        }
      } ) ).to.be.false;
    } );

    it( "returns true if requestor donated before exclude start date", async ( ) => {
      const donor2023 = _.find( fixtures.postgresql.users, u => u.name?.match( /2023 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        exclude_donor_start_date: "2024-01-01"
      }, {
        userSession: {
          user_id: donor2023.id
        }
      } ) ).to.be.true;
    } );

    it( "returns true if requestor donated after exclude end date", async ( ) => {
      const donor2023 = _.find( fixtures.postgresql.users, u => u.name?.match( /2023 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        exclude_donor_end_date: "2022-01-01"
      }, {
        userSession: {
          user_id: donor2023.id
        }
      } ) ).to.be.true;
    } );

    it( "returns true if requestor donated outside exclude dates", async ( ) => {
      const donor2023 = _.find( fixtures.postgresql.users, u => u.name?.match( /2023 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        exclude_donor_start_date: "2024-01-01",
        exclude_donor_end_date: "2024-07-01"
      }, {
        userSession: {
          user_id: donor2023.id
        }
      } ) ).to.be.true;
    } );

    it( "returns false if requestor donated inside exclude dates", async ( ) => {
      const donor2023 = _.find( fixtures.postgresql.users, u => u.name?.match( /2023 donation/ ) );
      expect( await Announcement.requestorMatchesDonationRequirements( {
        exclude_donor_start_date: "2023-04-01",
        exclude_donor_end_date: "2023-06-01"
      }, {
        userSession: {
          user_id: donor2023.id
        }
      } ) ).to.be.false;
    } );

    it( "returns true if there are exclude dates and no user", async ( ) => {
      expect( await Announcement.requestorMatchesDonationRequirements( {
        exclude_donor_start_date: "2023-04-01",
        exclude_donor_end_date: "2023-06-01"
      }, { } ) ).to.be.true;
    } );
  } );
} );
