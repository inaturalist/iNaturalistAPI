const _ = require( "lodash" );
const ctrlv1 = require( "../v1/saved_locations_controller" );

const search = async req => {
  const response = await ctrlv1.search( req );
  response.results = _.map( response.results, r => {
    if ( _.isEmpty( r.geoprivacy ) ) {
      r.geoprivacy = null;
    }
    return r;
  } );
  return response;
};

const create = async req => {
  const savedLocation = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [savedLocation]
  };
};

module.exports = {
  search,
  create,
  delete: ctrlv1.delete
};
