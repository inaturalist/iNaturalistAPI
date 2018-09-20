"use strict";
const squel = require( "squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const Site = class Site extends Model {

  static loadDefaultSite( ) {
    const query = squel.select( ).field( "id" ).from( "sites" ).order( "id" ).limit( 1 );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( result.rows.length > 0 ) {
        Site.defaultID = result.rows[0].id;
      }
    } );
  }

};

Site.defaultID = 1;

module.exports = Site;
