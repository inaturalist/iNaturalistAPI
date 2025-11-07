const _ = require( "lodash" );
const squel = require( "safe-squel" );
const taxonIdSummaryModel = require( "../../models/taxon_id_summary" );
const { findByTaxonSummaryIds } = require( "../../models/id_summary" );
const { findByIdSummaryIds } = require( "../../models/id_summary_reference" );
const pgClient = require( "../../pg_client" );
const util = require( "../../util" );

const UNKNOWN_ATTRIBUTION_NAME = "Unknown";

function formatAttribution( row ) {
  if ( !row ) { return null; }
  const name = row.native_realname
    || row.native_username
    || row.user_name
    || row.user_login
    || UNKNOWN_ATTRIBUTION_NAME;
  const parsedLicense = Number.parseInt( row.license, 10 );
  const licenseID = Number.isInteger( parsedLicense ) ? parsedLicense : 0;
  const licenseInfo = util.licenseInfo[licenseID] || util.licenseInfo[0];
  const prefix = licenseInfo.code === "cc0" || licenseInfo.code === "pd"
    ? name
    : `© ${name}`;
  let rights;
  if ( licenseInfo.code === "pd" ) {
    rights = "no known copyright restrictions (public domain)";
  } else if ( licenseInfo.code === "cc0" ) {
    rights = "no rights reserved (CC0)";
  } else if ( licenseInfo.code && licenseInfo.code.match( /^cc-/ ) ) {
    rights = `some rights reserved (${licenseInfo.short})`;
  } else {
    rights = "all rights reserved";
  }
  return `${prefix} – ${rights}`;
}

async function assignTaxonPhotoDetails( summaries ) {
  const taxonPhotoIDs = _( summaries )
    .map( "taxon_photo_id" )
    .filter( id => !_.isNil( id ) )
    .map( id => Number( id ) )
    .uniq( )
    .value( );
  if ( _.isEmpty( taxonPhotoIDs ) ) {
    return;
  }

  const taxonPhotosQuery = squel.select( )
    .field( "tp.id", "taxon_photo_id" )
    .field( "tp.photo_id", "photo_id" )
    .from( "taxon_photos tp" )
    .where( "tp.id IN ?", taxonPhotoIDs );
  const { rows: taxonPhotoRows } = await pgClient.replica.query( taxonPhotosQuery.toString( ) );

  const taxonPhotoToPhoto = { };
  const photoIDs = [];
  _.each( taxonPhotoRows, row => {
    const taxonPhotoID = Number( row.taxon_photo_id );
    const photoID = row.photo_id != null ? Number( row.photo_id ) : null;
    if ( taxonPhotoID && photoID ) {
      taxonPhotoToPhoto[taxonPhotoID] = photoID;
      photoIDs.push( photoID );
    }
  } );
  const fallbackPhotoIDs = _.filter(
    taxonPhotoIDs,
    taxonPhotoID => _.isNil( taxonPhotoToPhoto[taxonPhotoID] )
  );
  const uniquePhotoIDs = _.uniq( photoIDs.concat( fallbackPhotoIDs ) );
  if ( _.isEmpty( uniquePhotoIDs ) ) {
    return;
  }

  const observationPhotosQuery = squel.select( )
    .field( "op.photo_id", "photo_id" )
    .field( "op.observation_id", "observation_id" )
    .from( "observation_photos op" )
    .where( "op.photo_id IN ?", uniquePhotoIDs );
  const { rows: observationPhotoRows } = await pgClient.replica.query(
    observationPhotosQuery.toString( )
  );

  const photoToObservation = { };
  _.each( _.reverse( _.sortBy( observationPhotoRows, row => Number( row.observation_id ) ) ), row => {
    const photoID = Number( row.photo_id );
    if ( _.isNil( photoToObservation[photoID] ) ) {
      photoToObservation[photoID] = Number( row.observation_id );
    }
  } );

  let attributionByPhotoId = { };
  if ( uniquePhotoIDs.length ) {
    const photosQuery = squel.select( )
      .from( "photos p" )
      .field( "p.id", "photo_id" )
      .field( "p.license" )
      .field( "p.native_realname" )
      .field( "p.native_username" )
      .field( "u.login", "user_login" )
      .field( "u.name", "user_name" )
      .left_join( "users u", null, "u.id = p.user_id" )
      .where( "p.id IN ?", uniquePhotoIDs );
    const { rows: photoRows } = await pgClient.replica.query( photosQuery.toString( ) );
    attributionByPhotoId = _.reduce( photoRows, ( acc, row ) => {
      const id = Number( row.photo_id );
      if ( !id ) {
        return acc;
      }
      acc[id] = formatAttribution( row );
      return acc;
    }, { } );
  }

  _.each( summaries, summary => {
    if ( _.isNil( summary.taxon_photo_id ) ) {
      return;
    }
    const taxonPhotoID = Number( summary.taxon_photo_id );
    const photoID = !_.isNil( taxonPhotoToPhoto[taxonPhotoID] )
      ? taxonPhotoToPhoto[taxonPhotoID]
      : taxonPhotoID;
    const observationID = photoToObservation[photoID];
    if ( observationID ) {
      summary.taxon_photo_observation_id = observationID;
    }
    if ( _.has( attributionByPhotoId, photoID ) ) {
      summary.taxon_photo_attribution = attributionByPhotoId[photoID] || null;
    }
  } );
}

const search = async req => {
  const {
    results, total, page, perPage
  } = await taxonIdSummaryModel.search( req.query || { } );
  await assignTaxonPhotoDetails( results );
  return {
    page, per_page: perPage, total_results: total, results
  };
};

const show = async req => {
  const raw = req.params && req.params.uuid ? String( req.params.uuid ) : "";
  const uuids = _( raw.split( "," ) ).map( s => s.trim( ) ).filter( Boolean ).slice( 0, 200 )
    .value( );
  if ( uuids.length === 0 ) {
    return {
      page: 1, per_page: 0, total_results: 0, results: []
    };
  }

  const rowsByUuid = await taxonIdSummaryModel.findByUUIDs( uuids );
  const rows = uuids.map( u => rowsByUuid[u] ).filter( Boolean );

  const parentIds = rows.map( r => r.id );
  const summariesByParent = await findByTaxonSummaryIds( parentIds );
  const allSummaryIds = _.flatten( Object.values( summariesByParent ) ).map( s => s.id );
  const refsBySummary = await findByIdSummaryIds( allSummaryIds );
  parentIds.forEach( pid => {
    const summaries = summariesByParent[pid] || [];
    summaries.forEach( summary => {
      summary.references = refsBySummary[summary.id] || [];
    } );
    const parent = rows.find( r => r.id === pid );
    if ( parent ) {
      parent.id_summaries = summaries;
    }
  } );

  await assignTaxonPhotoDetails( rows );
  return {
    page: 1, per_page: rows.length, total_results: rows.length, results: rows
  };
};

module.exports = { search, show };
