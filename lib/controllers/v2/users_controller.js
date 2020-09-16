const { users } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const updateSession = async req => {
  await InaturalistAPI.iNatJSWrap( users.update_session, req );
};

module.exports = {
  updateSession
};
