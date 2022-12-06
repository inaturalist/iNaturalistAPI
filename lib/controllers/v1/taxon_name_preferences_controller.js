const { taxon_name_preferences } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const TaxonNamePreferencesController = class TaxonNamePreferencesController {
  static async create( req ) {
    // eslint-disable-next-line camelcase
    return InaturalistAPI.iNatJSWrap( taxon_name_preferences.create, req );
  }

  static async delete( req ) {
    // eslint-disable-next-line camelcase
    return InaturalistAPI.iNatJSWrap( taxon_name_preferences.delete, req );
  }
};

module.exports = TaxonNamePreferencesController;
