const _ = require( "lodash" );
const squel = require( "squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const List = class List extends Model {
  taxonIDs( callback ) {
    if ( !_.isUndefined( this.taxon_ids ) ) {
      return void callback( null, this.taxon_ids );
    }
    this.taxon_ids = [];
    const query = squel.select( ).field( "taxon_id" ).distinct( )
      .from( "listed_taxa" )
      .where( "list_id = ?", this.id );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      this.taxon_ids = _.map( result.rows, "taxon_id" );
      callback( null, this.taxon_ids );
    } );
  }

  static findByID( id, callback ) {
    const query = squel.select( ).field( "*" ).from( "lists" )
      .where( "id = ?", id );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const list = result.rows[0] ? new List( result.rows[0] ) : false;
      callback( null, list );
    } );
  }
};

List.modelName = "list";
List.tableName = "lists";
List.returnFields = [];

module.exports = List;
