const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );

const IdSummary = {
  tableName: "id_summaries",
  returnFields: [
    "id",
    "taxon_id_summary_id",
    "summary",
    "photo_tip",
    "visual_key_group",
    "score",
    "created_at",
    "updated_at"
  ]
};

function coerce( r ) {
  if ( r == null ) return r;
  if ( r.id != null ) r.id = Number( r.id );
  if ( r.taxon_id_summary_id != null ) r.taxon_id_summary_id = Number( r.taxon_id_summary_id );
  if ( r.score != null ) r.score = Number( r.score );
  return r;
}

async function findByTaxonSummaryIds( parentIds = [] ) {
  if ( !Array.isArray( parentIds ) || parentIds.length === 0 ) return {};
  const q = squel.select( )
    .from( IdSummary.tableName )
    .fields( IdSummary.returnFields )
    .where( "taxon_id_summary_id IN ?", parentIds );
  const { rows } = await pgClient.replica.query( q.toString( ) );
  const out = {};
  rows.map( coerce ).forEach( row => {
    const pid = row.taxon_id_summary_id;
    if ( !out[pid] ) out[pid] = [];
    out[pid].push( row );
  } );
  return out;
}

module.exports = { IdSummary, findByTaxonSummaryIds };
