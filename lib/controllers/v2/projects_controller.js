const ctrlv1 = require( "../v1/projects_controller" );

const show = async req => {
  if ( req.params.id && typeof ( req.params.id ) !== "string" ) {
    req.params.id = req.params.id.join( "," );
  }
  return ctrlv1.show( req );
};

module.exports = {
  join: ctrlv1.join,
  leave: ctrlv1.leave,
  search: ctrlv1.search,
  show,
  membership: ctrlv1.membership
};
