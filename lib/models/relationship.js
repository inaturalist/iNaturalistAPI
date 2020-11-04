const _ = require( "lodash" );
const Model = require( "./model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Relationship = class Relationship extends Model {
  static async preloadInto( relationships ) {
    await ESModel.fetchBelongsTo( relationships, User, {
      idFields: { friend_id: "friend_user" }
    } );
    _.forEach( relationships, r => {
      delete r.friend_id;
    } );
  }
};

Relationship.modelName = "relationship";
Relationship.tableName = "friendships";
Relationship.returnFields = [
  "id",
  "friend_id",
  "created_at",
  "updated_at",
  "trust",
  "following"
];

module.exports = Relationship;
