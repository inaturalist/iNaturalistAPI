const _ = require( "lodash" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const Place = class Place extends Model {

  static async findByID( id ) {
    if ( !Number( id ) ) {
      throw new Error( "invalid place_id" );
    }
    const response = await esClient.searchAsync( "places", {
      body: {
        query: { term: { id } },
        _source: ["id", "name", "ancestor_place_ids"]
      }
    } );
    return response.hits.hits[0] ? response.hits.hits[0]._source : null;
  }

  static assignToObject( object, callback ) {
    const ids = _.keys( object );
    if ( ids.length === 0 ) { return void callback( null, object ); }
    // TODO: turn this into squel?
    pgClient.connection.query( "SELECT id, name, display_name, ancestry FROM "
      + `places WHERE id IN (${ids.join( "," )})`, ( err, result ) => {
      if ( err ) { return void callback( err ); }
      _.each( result.rows, r => {
        object[r.id] = r;
      } );
      callback( null, object );
    } );
  }
};

Place.modelName = "place";
Place.indexName = "places";
Place.tableName = "places";

module.exports = Place;
