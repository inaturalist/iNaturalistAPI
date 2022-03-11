const { users } = require( "inaturalistjs" );
const User = require( "../../models/user" );
const InaturalistAPI = require( "../../inaturalist_api" );
const ctrlv1 = require( "../v1/taxa_controller" );
const { httpError } = require( "../../util" );

const updateSession = async req => {
  await InaturalistAPI.iNatJSWrap( users.update_session, req );
};

const show = async req => {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  const user = await User.find( req.params.id, {
    fields: [
      "created_at",
      "description",
      "icon",
      "id",
      "identifications_count",
      "journal_posts_count",
      "login",
      "monthly_supporter",
      "name",
      "observations_count",
      "orcid",
      "roles",
      "site",
      "spam",
      "species_count",
      "suspended",
      "updated_at",
      "uuid"
    ]
  } );
  if ( !user ) {
    throw httpError( 404, "User does not exist" );
  }
  return InaturalistAPI.resultsHash( {
    total: 1,
    per_page: req.query.per_page,
    page: req.query.page,
    results: [user]
  } );
};

module.exports = {
  show,
  update: ctrlv1.update,
  updateSession
};
