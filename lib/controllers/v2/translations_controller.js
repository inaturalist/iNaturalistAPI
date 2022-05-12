const _ = require( "lodash" );
const { translations } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const locales = async req => {
  const localesResults = await InaturalistAPI.iNatJSWrap( translations.locales, req );
  return {
    total_results: _.size( localesResults ),
    per_page: _.size( localesResults ),
    page: 1,
    results: _.map( localesResults, ( languageInLocale, locale ) => ( {
      locale, language_in_locale: languageInLocale
    } ) )
  };
};

module.exports = {
  locales
};
