const _ = require( "lodash" );
const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );

const Relationship = class Relationship extends Model {
  static async preloadInto( relationships ) {
    await ESModel.fetchBelongsTo( relationships, User, {
      idFields: { friend_id: "friend_user" }
    } );
    const friendIds = _.compact( _.uniq( relationships.map( r => r.friend_id ) ) );
    const userIds = _.compact( _.uniq( relationships.map( r => r.user_id ) ) );
    let reciprocalTrustRows;
    if ( friendIds.length > 0 && userIds.length > 0 ) {
      const query = squel.select( )
        .field( "user_id" )
        .field( "friend_id" )
        .from( Relationship.tableName )
        .where( "trust" )
        .where( "user_id IN ?", friendIds )
        .where( "friend_id IN ?", userIds );
      const sql = query.toString( );
      ( { rows: reciprocalTrustRows } = await pgClient.connection.query( sql ) );
    }
    _.forEach( relationships, relat => {
      const recipRelat = _.find(
        reciprocalTrustRows,
        row => row.friend_id === relat.user_id && row.user_id === relat.friend_id
      );
      relat.reciprocal_trust = reciprocalTrustRows && recipRelat !== undefined;
      delete relat.friend_id;
      delete relat.user_id;
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
