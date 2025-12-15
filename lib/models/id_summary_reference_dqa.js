const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );

const TABLE = "id_summary_reference_dqas";

const returnFields = [
  "id",
  "id_summary_reference_id",
  "user_id",
  "metric",
  "agree",
  "created_at",
  "updated_at"
];

function coerce( row ) {
  if ( !row ) { return row; }
  if ( row.id != null ) { row.id = Number( row.id ); }
  if ( row.id_summary_reference_id != null ) {
    row.id_summary_reference_id = Number( row.id_summary_reference_id );
  }
  if ( row.user_id != null ) { row.user_id = Number( row.user_id ); }
  return row;
}

async function listForReference( referenceId ) {
  const query = squel.select( )
    .from( TABLE )
    .fields( returnFields )
    .where( "id_summary_reference_id = ?", referenceId )
    .order( "id" );
  const { rows } = await pgClient.query( query.toString( ) );
  return rows.map( coerce );
}

async function upsertVote( referenceId, userId, metric, agree ) {
  const existingQuery = squel.select( )
    .field( "id" )
    .from( TABLE )
    .where( "id_summary_reference_id = ?", referenceId )
    .where( "user_id = ?", userId )
    .where( "metric = ?", metric )
    .limit( 1 );
  const { rows: existingRows } = await pgClient.query( existingQuery.toString( ) );
  if ( existingRows.length > 0 ) {
    const updateQuery = squel.update( )
      .table( TABLE )
      .set( "agree", agree )
      .set( "updated_at", squel.rstr( "NOW()" ) )
      .where( "id = ?", existingRows[0].id );
    await pgClient.query( updateQuery.toString( ) );
    return existingRows[0].id;
  }
  const insertQuery = squel.insert( )
    .into( TABLE )
    .setFields( {
      id_summary_reference_id: referenceId,
      user_id: userId,
      metric,
      agree
    } )
    .set( "created_at", squel.rstr( "NOW()" ) )
    .set( "updated_at", squel.rstr( "NOW()" ) );
  const insertSQL = `${insertQuery.toString( )} RETURNING id`;
  const { rows } = await pgClient.query( insertSQL );
  return rows[0] ? rows[0].id : null;
}

async function deleteVote( referenceId, userId, metric ) {
  const deleteQuery = squel.delete( )
    .from( TABLE )
    .where( "id_summary_reference_id = ?", referenceId )
    .where( "user_id = ?", userId )
    .where( "metric = ?", metric );
  const result = await pgClient.query( deleteQuery.toString( ) );
  return result.rowCount || 0;
}

module.exports = {
  TABLE,
  returnFields,
  coerce,
  listForReference,
  upsertVote,
  deleteVote
};
