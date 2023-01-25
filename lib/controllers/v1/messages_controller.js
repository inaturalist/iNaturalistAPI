const { messages } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ESModel = require( "../../models/es_model" );
const Message = require( "../../models/message" );
const User = require( "../../models/user" );

const MessagesController = class MessagesController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( messages.create, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( messages.delete, req );
  }

  static async index( req ) {
    const r = await InaturalistAPI.iNatJSWrap( messages.search, req );
    await Message.preloadInto( req, r.results );
    return r;
  }

  static async show( req ) {
    const r = await InaturalistAPI.iNatJSWrap( messages.fetch, req );
    await Message.preloadInto( req, r.results, { } );
    await ESModel.fetchBelongsTo( [r], User, {
      idFields: { reply_to_user_id: "reply_to_user" }
    } );
    delete r.reply_to_user_id;
    return r;
  }

  static async unread( req ) {
    return InaturalistAPI.iNatJSWrap( messages.unread, req );
  }
};

module.exports = MessagesController;
