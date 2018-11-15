const _ = require( "lodash" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const Place = class Place extends Model {
  static findByID( id, callback ) {
    if ( !Number( id ) ) {
      return void callback( { messsage: "invalid place_id", status: 422 } );
    }
    esClient.search( "places", {
      body: {
        query: { term: { id } },
        _source: ["id", "name", "ancestor_place_ids"]
      }
    }, ( err, results ) => {
      if ( err ) { return void callback( err ); }
      const place = results.hits.hits[0] ? results.hits.hits[0]._source : false;
      callback( null, place );
    } );
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
