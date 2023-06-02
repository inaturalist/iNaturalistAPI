const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../joi_to_openapi_parameter" );
const announcementsController = require( "../../../lib/controllers/v1/announcements_controller" );
const announcementsSearchSchema = require( "../../schema/request/announcements_search" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await announcementsController.search( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    announcementsSearchSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Announcements"],
    summary: "Search announcements",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of announcements",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsAnnouncements"
            }
          }
        }
      }
    }
  };

  return {
    GET
  };
};
