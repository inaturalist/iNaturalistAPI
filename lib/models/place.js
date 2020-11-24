const _ = require( "lodash" );
const esClient = require( "../es_client" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const Place = class Place extends Model {
  static async findByID( id ) {
    if ( !Number( id ) ) {
      throw new Error( "invalid place_id" );
    }
    const response = await esClient.search( "places", {
      body: {
        query: { term: { id } },
        _source: ["id", "name", "ancestor_place_ids"]
      }
    } );
    return response.hits.hits[0] ? response.hits.hits[0]._source : null;
  }

  static async findByLocaleCode( code ) {
    const { rows } = await pgClient.connection.query( "SELECT id, name, ancestry FROM "
      + "places WHERE UPPER(code) = $1 AND admin_level = 0", [code] );
    if ( !rows.length ) {
      return null;
    }
    const result = rows[0];
    // transform ancestry field to ancestor_place_ids
    let ancestorPlaceIds = null;
    if ( result.ancestry ) {
      ancestorPlaceIds = result.ancestry ? result.ancestry.split( "/" ).map( str => parseInt( str, 10 ) ) : [];
      ancestorPlaceIds.push( result.id );
    }
    const response = { id: result.id, name: result.name, ancestor_place_ids: ancestorPlaceIds };
    return response;
  }

  static async assignToObject( object ) {
    const ids = _.keys( object );
    if ( ids.length === 0 ) { return; }
    // TODO: turn this into squel?
    const { rows } = await pgClient.connection.query( "SELECT id, name, display_name, ancestry FROM "
      + `places WHERE id IN (${ids.join( "," )})` );
    _.each( rows, r => {
      object[r.id] = r;
    } );
  }
};

Place.modelName = "place";
Place.indexName = "places";
Place.tableName = "places";

module.exports = Place;
