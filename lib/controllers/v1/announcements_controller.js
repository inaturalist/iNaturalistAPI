const { announcements } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const AnnouncementsController = class AnnouncementsController {
  static async search( req ) {
    const anncs = await InaturalistAPI.iNatJSWrap( announcements.search, req );
    return {
      total_results: anncs.length,
      page: 1,
      per_page: anncs.length,
      results: anncs
    };
  }

  static async dismiss( req ) {
    return InaturalistAPI.iNatJSWrap( announcements.dismiss, req );
  }
};

module.exports = AnnouncementsController;
