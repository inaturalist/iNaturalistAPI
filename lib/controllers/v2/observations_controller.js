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

module.exports = {
  show,
  search: ctrlv1.search
};
