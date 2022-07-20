const _ = require( "lodash" );
const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );
const config = require( "../../config" );

const Site = class Site extends Model {
  static async loadDefaultSite( ) {
    const query = squel.select( )
      .field( "id" )
      .from( "sites" )
      .order( "id" )
      .limit( 1 );
    const result = await pgClient.query( query.toString( ) );
    if ( result.rows.length > 0 ) {
      Site.defaultID = result.rows[0].id;
    }
  }

  static async dbAttributes( siteIDs = null ) {
    let query = squel.select( )
      .field( "sites.id" )
      .field( "sites.name" )
      .field( "sites.url" )
      .field( "sites.place_id" )
      .field( "lp.value", "locale" )
      .field( "snp.value", "site_name_short" )
      .field( "sites.logo_square_file_name" )
      .from( "sites" )
      .left_join( "preferences lp", null,
        "sites.id=lp.owner_id AND lp.owner_type='Site' AND lp.name='locale'" )
      .left_join( "preferences snp", null,
        "sites.id=snp.owner_id AND snp.owner_type='Site' AND snp.name='site_name_short'" );
    if ( !_.isEmpty( siteIDs ) ) {
      query = query.where( "sites.id IN ?", siteIDs );
    } else {
      query = query.where( "sites.draft = ?", "f" );
    }
    query = query.order( "id" );
    const result = await pgClient.query( query.toString( ) );
    return _.map( result.rows, row => {
      const attrs = _.mapValues( row, v => v || null );
      if ( config.staticImagePrefix && attrs.logo_square_file_name ) {
        attrs.icon_url = `${config.staticImagePrefix}sites/${attrs.id}-logo_square.${attrs.logo_square_file_name.split( "." )[1]}`;
      } else {
        attrs.icon_url = `${config.apiURL}/assets/bird.png`;
      }
      delete attrs.logo_square_file_name;
      return attrs;
    } );
  }
};

Site.defaultID = 1;

module.exports = Site;
