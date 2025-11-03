const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );

const TABLE = "id_summary_dqas";

const returnFields = [
  "id",
  "id_summary_id",
  "user_id",
  "metric",
  "agree",
  "created_at",
  "updated_at"
];

function coerce( row ) {
  if ( !row ) { return row; }
  if ( row.id != null ) { row.id = Number( row.id ); }
  if ( row.id_summary_id != null ) { row.id_summary_id = Number( row.id_summary_id ); }
  if ( row.user_id != null ) { row.user_id = Number( row.user_id ); }
  return row;
}

async function listForSummary( summaryId ) {
  const query = squel.select( )
    .from( TABLE )
    .fields( returnFields )
    .where( "id_summary_id = ?", summaryId )
    .order( "id" );
  const { rows } = await pgClient.query( query.toString( ) );
  return rows.map( coerce );
}

async function upsertVote( summaryId, userId, metric, agree ) {
  const existingQuery = squel.select( )
    .field( "id" )
    .from( TABLE )
    .where( "id_summary_id = ?", summaryId )
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
      id_summary_id: summaryId,
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

async function deleteVote( summaryId, userId, metric ) {
  const deleteQuery = squel.delete( )
    .from( TABLE )
    .where( "id_summary_id = ?", summaryId )
    .where( "user_id = ?", userId )
    .where( "metric = ?", metric );
  const result = await pgClient.query( deleteQuery.toString( ) );
  return result.rowCount || 0;
}

module.exports = {
  TABLE,
  returnFields,
  coerce,
  listForSummary,
  upsertVote,
  deleteVote
};
