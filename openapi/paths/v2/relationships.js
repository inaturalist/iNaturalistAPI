const _ = require( "lodash" );
const j2s = require( "joi-to-swagger" );
const relationshipsSearchSchema = require( "../../schema/request/relationships_search" );
const transform = require( "../../joi_to_openapi_parameter" );
const relationshipsController = require( "../../../lib/controllers/v2/relationships_controller" );
const relationshipsCreateSchema = require( "../../schema/request/relationships_create" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await relationshipsController.index( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Relationships"],
    summary: "Search relationships for the authenticated user",
    security: [{
      userJwtRequired: []
    }],
    parameters: [
      {
        in: "header",
        name: "X-HTTP-Method-Override",
        schema: {
          type: "string"
        }
      }
    ].concat( _.map( relationshipsSearchSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "A list of relationships",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsRelationships"
            }
          }
        }
      }
    }
  };

  async function POST( req, res ) {
    const results = await relationshipsController.create( req );
    sendWrapper( req, res, null, results );
  }

  POST.apiDoc = {
    tags: ["Relationships"],
    summary: "Create a relationship for the authenticated user",
    security: [{
      userJwtRequired: []
    }],
    requestBody: {
      content: {
        "application/json": {
          schema: j2s( relationshipsCreateSchema ).swagger
        }
      }
    },
    responses: {
      200: {
        description: "A list of relationships",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsRelationships"
            }
          }
        }
      }
    }
  };

  return {
    GET,
    POST
  };
};
