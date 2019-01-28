const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const Site = class Site extends Model {
  static loadDefaultSite( ) {
    const query = squel.select( )
      .field( "id" )
      .from( "sites" )
      .order( "id" )
      .limit( 1 );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( result.rows.length > 0 ) {
        Site.defaultID = result.rows[0].id;
      }
    } );
  }

  static dbAttributes( siteIDs = null ) {
    return new Promise( ( resolve, reject ) => {
      let query = squel.select( )
        .field( "sites.id, sites.name, sites.url, sites.place_id, lp.value as locale, snp.value as site_name_short" )
        .from( "sites" )
        .left_join( "preferences lp", null,
          "sites.id=lp.owner_id AND lp.owner_type='Site' AND lp.name='locale'" )
        .left_join( "preferences snp", null,
          "sites.id=snp.owner_id AND snp.owner_type='Site' AND snp.name='site_name_short'" );
      if ( !_.isEmpty( siteIDs ) ) {
        query = query.where( "sites.id = ?", siteIDs );
      } else {
        query = query.where( "sites.draft = ?", "f" );
      }
      query = query.order( "id" );
      pgClient.connection.query( query.toString( ), ( err, result ) => {
        if ( err ) { return void reject( err ); }
        resolve( _.map( result.rows, row => (
          _.mapValues( row, v => v || null )
        ) ) );
      } );
    } );
  }
};

Site.defaultID = 1;

module.exports = Site;
