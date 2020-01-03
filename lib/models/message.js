const Model = require( "./model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Message = class Message extends Model {
  static preloadInto( arr, localeOpts, callback ) {
    ESModel.fetchBelongsTo( arr, User, {
      idFields: { to_user_id: "to_user", from_user_id: "from_user" }
    }, fetchUsersErr => {
      if ( fetchUsersErr ) { return void callback( fetchUsersErr ); }
      arr.forEach( m => {
        delete m.from_user_id;
        delete m.to_user_id;
      } );
      callback( null, arr );
    } );
  }
};

module.exports = Message;
