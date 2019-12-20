const { messages } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const Message = require( "../../models/message" );
const User = require( "../../models/user" );

const MessagesController = class MessagesController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( messages.create, req )
      .then( r => callback( null, r ) )
      .catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( messages.delete, req )
      .then( r => callback( null, r ) )
      .catch( callback );
  }

  static index( req, callback ) {
    InaturalistAPI.iNatJSWrap( messages.search, req )
      .then( r => {
        Message.preloadInto( r.results, {}, msgPreloadErr => {
          if ( msgPreloadErr ) { return void callback( msgPreloadErr ); }
          callback( null, r );
        } );
      } )
      .catch( callback );
  }

  static show( req, callback ) {
    InaturalistAPI.iNatJSWrap( messages.fetch, req )
      .then( r => {
        Message.preloadInto( r.results, {}, msgPreloadErr => {
          if ( msgPreloadErr ) { return void callback( msgPreloadErr ); }
          ESModel.fetchBelongsTo( [r], User, {
            idFields: { reply_to_user_id: "reply_to_user" }
          }, fetchUsersErr => {
            if ( fetchUsersErr ) { return void callback( fetchUsersErr ); }
            delete r.reply_to_user_id;
            callback( null, r );
          } );
        } );
      } )
      .catch( callback );
  }

  static unread( req, callback ) {
    InaturalistAPI.iNatJSWrap( messages.unread, req )
      .then( r => callback( null, r ) )
      .catch( callback );
  }
};

module.exports = MessagesController;
