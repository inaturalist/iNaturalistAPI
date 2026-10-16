const { posts: inatjsPosts } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/posts_controller" );
const ESModel = require( "../../models/es_model" );
const User = require( "../../models/user" );

const forUser = async req => {
  const posts = await ctrlv1.for_user( req, { responseHeaders: true } );
  await ESModel.fetchBelongsTo( posts, User );
  return {
    total_results: Number( posts?.headers?.["x-total-entries"] || posts.length ),
    page: req.query.page,
    per_page: req.query.per_page,
    results: posts
  };
};

const show = async req => {
  const post = await InaturalistAPI.iNatJSWrap( inatjsPosts.fetch, req );
  await ESModel.fetchBelongsTo( [post], User );
  return {
    total_results: 1,
    page: 1,
    per_page: 1,
    results: [post]
  };
};

module.exports = {
  forUser,
  show
};
