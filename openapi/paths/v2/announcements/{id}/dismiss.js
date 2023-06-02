const AnnouncementsController = require( "../../../../../lib/controllers/v1/announcements_controller" );

module.exports = sendWrapper => {
  async function PUT( req, res ) {
    await AnnouncementsController.dismiss( req );
    sendWrapper( req, res.status( 204 ) );
  }

  PUT.apiDoc = {
    tags: ["Announcements"],
    summary: "Dismiss an announcement",
    security: [{
      userJwtRequired: []
    }],
    responses: {
      204: {
        description: "No response body; success implies dismissal"
      }
    }
  };

  return {
    PUT
  };
};
