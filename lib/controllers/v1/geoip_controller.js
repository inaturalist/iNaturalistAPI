const geoip = require( "geoip-lite" );
const util = require( "../../util" );

const GeoipController = class FlagsController {
  static async lookup( req ) {
    if ( !req.userSession && !req.applicationSession ) {
      throw util.httpError( 401, "Unauthorized" );
    }
    let results = { };
    if ( req.query.ip ) {
      results = geoip.lookup( req.query.ip );
    }
    return { results };
  }
};

module.exports = GeoipController;
