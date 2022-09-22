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
  members: ctrlv1.members,
  membership: ctrlv1.membership,
  posts: ctrlv1.posts,
  search: ctrlv1.search,
  show
};
