const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const PostsController = require( "../../../../lib/controllers/v2/posts_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await PostsController.show( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Posts"],
    summary: "Fetch a single published post",
    security: [{
      userJwtOptional: []
    }],
    parameters: [
      transform(
        Joi.string( )
          .pattern( /^\d+(-[\w-]*)?$/ )
          .label( "id" )
          .meta( { in: "path" } )
          .required( )
          .description( "ID of the record, optionally followed by a slug, e.g. 123-some-title" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) ),
      transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
    ],
    responses: {
      200: {
        description: "A results object containing the post.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPosts"
            }
          }
        }
      },
      default: {
        $ref: "#/components/responses/Error"
      }
    }
  };

  return {
    GET
  };
};
