const _ = require( "lodash" );
const squel = require( "safe-squel" );
const { announcements } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const pgClient = require( "../../pg_client" );
const Announcement = require( "../../models/announcement" );
const AnnouncementImpression = require( "../../models/announcement_impression" );
const Site = require( "../../models/site" );
const util = require( "../../util" );

const AnnouncementsController = class AnnouncementsController {
  static async search( req ) {
    let query = squel.select( )
      .field( "announcements.id" )
      .field( "body" )
      .field( "placement" )
      .field( "dismissible" )
      .field( "locales" )
      .field( "clients" )
      .field( "start" )
      .field( "\"end\"" )
      .field( "target_group_type" )
      .field( "target_group_partition" )
      .field( "to_char( include_donor_start_date, 'YYYY-MM-DD') AS include_donor_start_date" )
      .field( "to_char( include_donor_end_date, 'YYYY-MM-DD') AS include_donor_end_date" )
      .field( "to_char( exclude_donor_start_date, 'YYYY-MM-DD') AS exclude_donor_start_date" )
      .field( "to_char( exclude_donor_end_date, 'YYYY-MM-DD') AS exclude_donor_end_date" )
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

    const userAgentClient = util.userAgentClient( req );
    if ( req.query.client || userAgentClient ) {
      // given a client parameter, return only announcements that include that client,
      // or announcements with no client specified
      query = query.where( "? = ANY( clients ) OR clients IS NULL OR clients = '{}'",
        req.query.client || userAgentClient );
    } else {
      // if there is no client parameter, return only announcements with no client specified
      query = query.where( "clients IS NULL OR clients = '{}'" );
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

    // when request is authenticated and the authenticated user is a montly supporter,
    // exclude announcements that prefer to exclude monthly supporters
    if ( req.userSession?.isMonthlySupporter ) {
      query = query.left_join(
        "preferences prefs_exclude_supporters",
        null,
        "announcements.id = prefs_exclude_supporters.owner_id AND"
        + " prefs_exclude_supporters.owner_type = 'Announcement' AND"
        + " prefs_exclude_supporters.name = 'exclude_monthly_supporters' AND"
        + " prefs_exclude_supporters.value='t'"
      ).where( "prefs_exclude_supporters.id IS NULL" );
    }

    let announcementRows;
    const queryLocale = req.query.locale || req.userSession?.locale;
    // locale filter
    if ( queryLocale ) {
      // first attempt to fetch announcements with an exact match for locale
      const exactLocaleQuery = query.clone( ).where( "? = ANY( locales )", queryLocale );
      ( { rows: announcementRows } = await pgClient.replica.query( exactLocaleQuery.toString( ) ) );
      // if none exist and the locale is hyphenated, fetch announcements with the base locale
      if ( _.isEmpty( announcementRows ) && queryLocale.match( "-" ) ) {
        const baseLocaleQuery = query.clone( ).where( "? = ANY( locales )", queryLocale.split( "-" )[0] );
        ( { rows: announcementRows } = await pgClient.replica.query(
          baseLocaleQuery.toString( )
        ) );
      }
      // if none exist for either version of the locale, fetch announcements with no locale
      if ( _.isEmpty( announcementRows ) ) {
        const noLocaleQuery = query.clone( ).where( "locales IS NULL OR locales = '{}'" );
        ( { rows: announcementRows } = await pgClient.replica.query( noLocaleQuery.toString( ) ) );
      }
    } else {
      // if no locale filter was requested, fetch announcements with the already applied filters
      ( { rows: announcementRows } = await pgClient.replica.query( query.toString( ) ) );
    }

    // filter announcements using async functions
    const filterPromises = _.map( announcementRows, async announcement => (
      Announcement.targetedToRequestor( announcement, req )
       && Announcement.requestorMatchesDonationRequirements( announcement, req )
    ) );
    const filterPromiseResults = await Promise.all( filterPromises );
    announcementRows = _.filter( announcementRows,
      ( announcement, index ) => filterPromiseResults[index] );

    // remove columns fetched for filtering that should not be in the final response
    announcementRows = _.map( announcementRows, announcement => (
      _.omit( announcement, [
        "target_group_type",
        "target_group_partition",
        "include_donor_start_date",
        "include_donor_end_date",
        "exclude_donor_start_date",
        "exclude_donor_end_date"
      ] )
    ) );

    await AnnouncementImpression.createAnnouncementImpressions( req, announcementRows );
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
