const _ = require( "lodash" );
const squel = require( "safe-squel" );
const { announcements } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const pgClient = require( "../../pg_client" );
const Site = require( "../../models/site" );

const AnnouncementsController = class AnnouncementsController {
  static async search( req ) {
    let query = squel.select( )
      .field( "announcements.id, body, placement, dismissible, locales, platforms, start, \"end\"" )
      .from( "announcements" )
      .where( "NOW() at time zone 'utc' between start and \"end\"" )
      .order( "announcements.id" );

    // placement filter
    if ( req.query.placement ) {
      let placementClause = squel.expr( );
      _.each( req.query.placement.split( "," ), placement => {
        switch ( placement ) {
          case "mobile":
            placementClause = placementClause.or( "placement LIKE 'mobile%'" );
            break;
          default:
            placementClause = placementClause.or( "placement = ?", placement );
            break;
        }
      } );
      query = query.where( placementClause );
    }

    if ( req.query.platform ) {
      // given a platform parameter, return only announcements that include that platform,
      // or announcements with no platform specified
      query = query.where( "? = ANY( platforms ) OR platforms IS NULL OR platforms = '{}'", req.query.platform );
    } else {
      // if there is no platform parameter, return only announcements with no platform specified
      query = query.where( "platforms IS NULL OR platforms = '{}'" );
    }

    // site_id filter
    if ( req.userSession ) {
      // authenticated requests include announcements targeted at the users site,
      // or that have no site affiliation
      query = query.left_join( "announcements_sites", null, "announcements.id = announcements_sites.announcement_id" )
        .where( "announcements_sites.site_id IS NULL OR announcements_sites.site_id = ?",
          req.userSession?.site_id || Site.defaultID );
    } else {
      // unauthenticated requests exclude announcements associated with sites
      query = query.left_join( "announcements_sites", null, "announcements.id = announcements_sites.announcement_id" )
        .where( "announcements_sites.site_id IS NULL" );
    }

    // exclude announcements the authenticated user has dismissed
    if ( req.userSession ) {
      query = query.where( "NOT ( ? = ANY( dismiss_user_ids ) )", req.userSession.user_id );
    }

    // when request is unauthenticated, or authenticated user has confirmed their email,
    // exclude announcements that are targeting users with unconfirmed emails
    if ( !req.userSession || ( req.userSession && req.userSession.emailConfirmed ) ) {
      query = query.left_join( "preferences prefs_unconfirmed", null, "announcements.id = prefs_unconfirmed.owner_id AND"
        + " prefs_unconfirmed.owner_type = 'Announcement' AND prefs_unconfirmed.name = 'target_unconfirmed_users'"
        + " AND prefs_unconfirmed.value='t'" )
        .where( "prefs_unconfirmed.id IS NULL" );
    }

    // when request is unauthenticated, or authenticated is not staff,
    // exclude announcements that are targeting staff
    if ( !req.userSession || ( req.userSession && !req.userSession.isAdmin ) ) {
      query = query.left_join( "preferences prefs_staff", null, "announcements.id = prefs_staff.owner_id AND"
        + " prefs_staff.owner_type = 'Announcement' AND prefs_staff.name = 'target_staff'"
        + " AND prefs_staff.value='t'" )
        .where( "prefs_staff.id IS NULL" );
    }

    let announcementRows;
    const queryLocale = req.query.locale || req.userSession?.locale;
    // locale filter
    if ( queryLocale ) {
      // first attempt to fetch announcements with an exact match for locale
      const exactLocaleQuery = query.clone( ).where( "? = ANY( locales )", queryLocale );
      ( { rows: announcementRows } = await pgClient.query( exactLocaleQuery.toString( ) ) );
      // if none exist and the locale is hyphenated, fetch announcements with the base locale
      if ( _.isEmpty( announcementRows ) && queryLocale.match( "-" ) ) {
        const baseLocaleQuery = query.clone( ).where( "? = ANY( locales )", queryLocale.split( "-" )[0] );
        ( { rows: announcementRows } = await pgClient.query( baseLocaleQuery.toString( ) ) );
      }
      // if none exist for either version of the locale, fetch announcements with no locale
      if ( _.isEmpty( announcementRows ) ) {
        const noLocaleQuery = query.clone( ).where( "locales IS NULL OR locales = '{}'" );
        ( { rows: announcementRows } = await pgClient.query( noLocaleQuery.toString( ) ) );
      }
    } else {
      // if no locale filter was requested, fetch announcements with the already applied filters
      ( { rows: announcementRows } = await pgClient.query( query.toString( ) ) );
    }
    return {
      total_results: announcementRows.length,
      page: 1,
      per_page: announcementRows.length,
      results: announcementRows
    };
  }

  static async dismiss( req ) {
    return InaturalistAPI.iNatJSWrap( announcements.dismiss, req );
  }
};

module.exports = AnnouncementsController;
