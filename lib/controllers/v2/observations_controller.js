const ctrlv1 = require( "../v1/observations_controller" );

const show = req => {
  const uuids = req.params.uuid.slice( 0, 200 );
  req.query = Object.assign( req.query, {
    uuid: uuids,
    details: "all",
    per_page: uuids.length
  } );
  return ctrlv1.searchCacheWrapper( req );
};

const create = ( req, callback ) => {
  ctrlv1.create( req, ( err, observation ) => {
    if ( err ) return void callback( err );
    callback( null, {
      page: 1,
      per_page: 1,
      total_results: 1,
      results: [observation]
    } );
  } );
};

module.exports = {
  show,
  search: ctrlv1.search,
  create
};
