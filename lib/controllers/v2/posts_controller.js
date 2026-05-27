const ctrlv1 = require( "../v1/posts_controller" );
const ESModel = require( "../../models/es_model" );
const User = require( "../../models/user" );

const forUser = async req => {
  const posts = await ctrlv1.for_user( req, { responseHeaders: true } );
  await ESModel.fetchBelongsTo( posts, User );
  return {
    total_results: Number( posts.headers["x-total-entries"] ),
    page: req.query.page,
    per_page: req.query.per_page,
    results: posts
  };
};

module.exports = {
  forUser
};
