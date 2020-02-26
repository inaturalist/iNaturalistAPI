const _ = require( "lodash" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Site = require( "../../models/site" );

const SitesController = class SitesController {
  static async index( ) {
    const siteDBAttrs = await Site.dbAttributes( );
    return InaturalistAPI.resultsHash( {
      total: _.size( siteDBAttrs ),
      per_page: _.size( siteDBAttrs ),
      page: 1,
      results: siteDBAttrs
    } );
  }
};

module.exports = SitesController;
