const _ = require( "lodash" );
const squel = require( "safe-squel" ).useFlavour( "postgres" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );
const ESModel = require( "./es_model" );

const Place = class Place extends Model {
  static async findByID( id, options = {} ) {
    if ( !Number( id ) ) {
      throw new Error( "invalid place_id" );
    }
    const getResponse = await ESModel.mget( [id], "places", {
      source: { _source: options.fields || ["id", "name", "display_name", "place_type", "ancestor_place_ids"] }
    } );
    return _.isEmpty( getResponse ) || _.isEmpty( getResponse.docs ) || !getResponse.docs[0]._source
      ? null : getResponse.docs[0]._source;
  }

  static async findByLocaleString( locale ) {
    let localeObj;
    try {
      localeObj = new Intl.Locale( locale );
    } catch ( err ) {
      // continue if locale is invalid
      return null;
    }
    const localeRegionCode = localeObj.region;
    if ( !localeRegionCode ) {
      return null;
    }
    // lookup the place by code and admin-level = country
    return Place.findByLocaleCode( localeRegionCode );
  }

  static async findByLocaleCode( code ) {
    const query = squel.select( )
      .field( "id, name, ancestry" )
      .from( "places" )
      .where( "UPPER(code) = ?", code )
      .where( "admin_level = 0" );
    const { rows } = await pgClient.connection.query( query.toString( ) );
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
    const query = squel.select( )
      .field( "id, name, display_name, ancestry" )
      .from( "places" )
      .where( "id IN ?", ids );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    _.each( rows, r => {
      object[r.id] = r;
    } );
  }
};

Place.modelName = "place";
Place.indexName = "places";
Place.tableName = "places";

module.exports = Place;
