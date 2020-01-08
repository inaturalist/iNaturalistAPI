const ctrlv1 = require( "../v1/observations_controller" );

const show = ( req, callback ) => {
  const uuids = req.params.id.slice( 0, 200 );
  req.query = Object.assign( req.query, {
    uuid: uuids,
    details: "all",
    per_page: uuids.length
  } );
  ctrlv1.searchCacheWrapper( req, callback );
};

module.exports = {
  show,
  search: ctrlv1.search
};
