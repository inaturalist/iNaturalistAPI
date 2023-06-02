const { taxon_name_priorities } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const TaxonNamePrioritiesController = class TaxonNamePrioritiesController {
  static async create( req ) {
    // eslint-disable-next-line camelcase
    return InaturalistAPI.iNatJSWrap( taxon_name_priorities.create, req );
  }

  static async update( req ) {
    // eslint-disable-next-line camelcase
    return InaturalistAPI.iNatJSWrap( taxon_name_priorities.update, req );
  }

  static async delete( req ) {
    // eslint-disable-next-line camelcase
    return InaturalistAPI.iNatJSWrap( taxon_name_priorities.delete, req );
  }
};

module.exports = TaxonNamePrioritiesController;
