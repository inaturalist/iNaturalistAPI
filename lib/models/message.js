const Model = require( "./model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Message = class Message extends Model {
  static async preloadInto( arr ) {
    await ESModel.fetchBelongsToAsync( arr, User, {
      idFields: { to_user_id: "to_user", from_user_id: "from_user" }
    } );
    arr.forEach( m => {
      delete m.from_user_id;
      delete m.to_user_id;
    } );
    return arr;
  }
};

module.exports = Message;
