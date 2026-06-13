const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const PostsController = require( "../../../../lib/controllers/v2/posts_controller" );
const postsForUserSchema = require( "../../../schema/request/posts_for_user" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await PostsController.forUser( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = _.map(
    postsForUserSchema.$_terms.keys,
    child => transform( child.schema.label( child.key ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Posts"],
    summary: "Fetch posts",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of posts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsPosts"
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
