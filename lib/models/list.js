const _ = require( "lodash" );
const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const Model = require( "./model" );

const List = class List extends Model {
  async taxonIDs( ) {
    if ( !_.isUndefined( this.taxon_ids ) ) {
      return this.taxon_ids;
    }
    this.taxon_ids = [];
    const query = squel.select( ).field( "taxon_id" ).distinct( )
      .from( "listed_taxa" )
      .where( "list_id = ?", this.id );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    this.taxon_ids = _.map( rows, "taxon_id" );
    return this.taxon_ids;
  }

  static async findByID( id ) {
    const query = squel.select( ).field( "*" ).from( "lists" )
      .where( "id = ?", id );
    const { rows } = await pgClient.connection.query( query.toString( ) );
    return rows[0] ? new List( rows[0] ) : false;
  }
};

List.modelName = "list";
List.tableName = "lists";
List.returnFields = [];

module.exports = List;
