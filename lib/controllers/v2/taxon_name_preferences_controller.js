// eslint-disable-next-line camelcase
const { taxon_name_preferences } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/taxon_name_preferences_controller" );

const create = async req => {
  // eslint-disable-next-line camelcase
  const taxonNamePreference = await InaturalistAPI.iNatJSWrap( taxon_name_preferences.create, req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [taxonNamePreference]
  };
};

module.exports = {
  create,
  delete: ctrlv1.delete
};
