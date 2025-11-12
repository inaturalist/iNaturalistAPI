const squel = require( "safe-squel" );
const pgClient = require( "../pg_client" );
const DBModel = require( "./db_model" );

const TaxonIdSummary = {
  tableName: "taxon_id_summaries",
  returnFields: [
    "id",
    "uuid",
    "active",
    "taxon_id",
    "taxon_name",
    "taxon_common_name",
    "taxon_photo_id",
    "taxon_group",
    "run_name",
    "run_generated_at",
    "run_description",
    "created_at",
    "updated_at"
  ]
};

function coerce( r ) {
  if ( r == null ) return r;
  if ( r.id != null ) r.id = Number( r.id );
  if ( r.taxon_id != null ) r.taxon_id = Number( r.taxon_id );
  if ( r.taxon_photo_id != null ) r.taxon_photo_id = Number( r.taxon_photo_id );
  return r;
}

const SORT_COLUMNS = new Set( ["run_generated_at", "created_at", "updated_at", "taxon_id"] );

function parseBoolean( val ) {
  if ( val == null || val === "" ) return null;
  const s = String( val ).toLowerCase( );
  if ( ["true", "t", "1", "yes", "y"].includes( s ) ) return true;
  if ( ["false", "f", "0", "no", "n"].includes( s ) ) return false;
  return null;
}

function toArray( v ) {
  if ( !v ) return [];
  if ( Array.isArray( v ) ) return v.filter( Boolean );
  return String( v ).split( "," ).map( s => s.trim( ) ).filter( Boolean );
}

function dayRangeUTC( dateStr ) {
  const d = new Date( dateStr );
  const start = new Date(
    Date.UTC( d.getUTCFullYear( ), d.getUTCMonth( ), d.getUTCDate( ), 0, 0, 0, 0 )
  ).toISOString( );
  const end = new Date(
    Date.UTC( d.getUTCFullYear( ), d.getUTCMonth( ), d.getUTCDate( ), 23, 59, 59, 999 )
  ).toISOString( );
  return [start, end];
}

function likeNeedle( s ) {
  // escape % and _ for ILIKE; keep ESCAPE '\\'
  return `%${String( s ).replace( /[%_]/g, m => `\\${m}` )}%`;
}

async function search( q = { } ) {
  const active = parseBoolean( q.active );
  const groups = toArray( q.taxon_group );
  const runName = ( q.run_name || "" ).trim( );
  const runNameExact = parseBoolean( q.run_name_exact );

  const page = Math.max( parseInt( q.page || "1", 10 ), 1 );
  const perPage = Math.min( Math.max( parseInt( q.per_page || "30", 10 ), 1 ), 200 );
  const orderBy = SORT_COLUMNS.has( ( q.order_by || "" ).toLowerCase( ) )
    ? q.order_by.toLowerCase( ) : "updated_at";
  const order = ( q.order || "desc" ).toLowerCase( ) === "asc" ? "asc" : "desc";

  // base SELECT
  let dataQ = squel.select( )
    .from( TaxonIdSummary.tableName )
    .fields( TaxonIdSummary.returnFields );

  // filters
  if ( active !== null ) dataQ = dataQ.where( "active = ?", active );
  if ( groups.length ) {
    const lowered = groups.map( g => g.toLowerCase( ) );
    dataQ = dataQ.where( "LOWER(taxon_group) IN ?", lowered );
  }
  if ( runName ) {
    if ( runNameExact === true ) {
      dataQ = dataQ.where( "run_name = ?", runName );
    } else {
      dataQ = dataQ.where( "run_name ILIKE ? ESCAPE '\\\\'", likeNeedle( runName ) );
    }
  }
  if ( q.taxon_id ) {
    const ids = toArray( q.taxon_id ).map( n => Number( n ) ).filter( Number.isInteger );
    if ( ids.length ) dataQ = dataQ.where( "taxon_id IN ?", ids );
  }
  if ( q.taxon_name ) dataQ = dataQ.where( "taxon_name ILIKE ? ESCAPE '\\\\'", likeNeedle( q.taxon_name ) );

  // date helpers
  function applyDate( field, prefix ) {
    if ( q[`${prefix}_on`] ) {
      const [s, e] = dayRangeUTC( q[`${prefix}_on`] );
      dataQ = dataQ.where( `${field} >= ?`, s ).where( `${field} <= ?`, e );
      return;
    }
    if ( q[`${prefix}_d1`] ) dataQ = dataQ.where( `${field} >= ?`, new Date( q[`${prefix}_d1`] ).toISOString( ) );
    if ( q[`${prefix}_d2`] ) dataQ = dataQ.where( `${field} <= ?`, new Date( q[`${prefix}_d2`] ).toISOString( ) );
  }
  applyDate( "run_generated_at", "run_generated" );
  applyDate( "created_at", "created" );
  applyDate( "updated_at", "updated" );

  // count query clones where clause
  let countQ = squel.select( ).from( TaxonIdSummary.tableName ).field( "COUNT(*)::int", "count" );
  countQ = countQ.where( dataQ.toString( ).match( /WHERE (.*)/s ) ? dataQ.toString( ).split( "WHERE " )[1] : "" );

  // sort + paginate
  dataQ = dataQ.order( orderBy, order === "asc" ).limit( perPage ).offset( ( page - 1 ) * perPage );

  const { rows: countRows } = await pgClient.replica.query( countQ.toString( ) );
  const { rows } = await pgClient.replica.query( dataQ.toString( ) );

  const total = countRows[0] ? countRows[0].count : 0;
  return {
    results: rows.map( coerce ), total, page, perPage
  };
}

async function findByUUIDs( uuids ) {
  // reuse generic helper then coerce each row
  const byUuid = await DBModel.findByUuids(
    uuids, TaxonIdSummary, { returnFields: TaxonIdSummary.returnFields }
  );
  // coerce in-place
  Object.keys( byUuid ).forEach( k => { byUuid[k] = coerce( byUuid[k] ); } );
  return byUuid;
}

module.exports = {
  TaxonIdSummary,
  search,
  findByUUIDs
};
