const _ = require( "lodash" );
const User = require( "./models/user" );

const UserSession = class UserSession {
  constructor( attrs ) {
    Object.assign( this, attrs );
  }

  extend( object = { } ) {
    _.each( object, ( value, key ) => {
      this[key] = value;
    } );
  }

  async getBlocks( ) {
    if ( !_.isUndefined( this.blocks ) ) {
      return this.blocks;
    }
    this.blocks = await User.blocks( this.user_id );
    return this.blocks;
  }

  async getCuratedProjectsIDs( ) {
    if ( !_.isUndefined( this.curatedProjectsIDs ) ) {
      return this.curatedProjectsIDs;
    }
    this.curatedProjectsIDs = await User.projectsCurated( this.user_id );
    return this.curatedProjectsIDs;
  }

  async getTrustingUserIDs( ) {
    if ( !_.isUndefined( this.trustingUserIDs ) ) {
      return this.trustingUserIDs;
    }
    this.trustingUserIDs = await User.trustingUsers( this.user_id );
    return this.trustingUserIDs;
  }

  async getSiteID( ) {
    if ( !_.isUndefined( this.siteID ) ) {
      return this.siteID;
    }
    this.siteID = await User.siteID( this.user_id );
    return this.siteID;
  }
};

module.exports = UserSession;
