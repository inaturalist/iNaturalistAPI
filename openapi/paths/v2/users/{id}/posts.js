const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../../lib/controllers/v1/users_controller" );
const modelPostsSchema = require( "../../../../schema/request/model_posts" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.posts( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = [
    transform(
      Joi.array( )
        .items( Joi.string( ) )
        .label( "id" )
        .meta( { in: "path" } )
        .required( )
        .description( "A single ID or a comma-separated list of them" )
    )
  ].concat(
    _.map( modelPostsSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Fetch user posts",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of user posts.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsModelPosts"
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
