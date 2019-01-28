const _ = require( "lodash" );
const InaturalistAPI = require( "../../inaturalist_api" );
const Site = require( "../../models/site" );

const SitesController = class SitesController {
  static index( req, callback ) {
    Site.dbAttributes( ).then( siteDBAttrs => {
      InaturalistAPI.resultsHash( {
        total: _.size( siteDBAttrs ),
        per_page: _.size( siteDBAttrs ),
        page: 1,
        results: siteDBAttrs
      }, callback );
    } ).catch( callback );
  }
};

module.exports = SitesController;
