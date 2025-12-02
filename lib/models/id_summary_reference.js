const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );

const IdSummaryReference = {
  tableName: "id_summary_references",
  returnFields: [
    "id",
    "id_summary_id",
    "reference_uuid",
    "reference_source",
    "reference_observation_id",
    "reference_date",
    "reference_content",
    "user_id",
    "user_login",
    "created_at",
    "updated_at"
  ]
};

function coerce( r ) {
  if ( r == null ) return r;
  if ( r.id != null ) r.id = Number( r.id );
  if ( r.id_summary_id != null ) r.id_summary_id = Number( r.id_summary_id );
  if ( r.user_id != null ) r.user_id = Number( r.user_id );
  if ( r.reference_date != null ) {
    if ( r.reference_date instanceof Date ) {
      r.reference_date = r.reference_date.toISOString( );
    } else {
      r.reference_date = String( r.reference_date );
    }
  }
  return r;
}

async function findByIdSummaryIds( ids = [] ) {
  if ( !Array.isArray( ids ) || ids.length === 0 ) return {};
  const q = squel.select( )
    .from( IdSummaryReference.tableName )
    .fields( IdSummaryReference.returnFields )
    .where( "id_summary_id IN ?", ids );
  const { rows } = await pgClient.replica.query( q.toString( ) );
  const out = {};
  rows.map( coerce ).forEach( row => {
    const sid = row.id_summary_id;
    if ( !out[sid] ) out[sid] = [];
    out[sid].push( row );
  } );
  return out;
}

module.exports = { IdSummaryReference, findByIdSummaryIds };
