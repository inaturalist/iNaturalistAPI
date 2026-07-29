const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "../../../../joi_to_openapi_parameter" );
const UsersController = require( "../../../../../lib/controllers/v1/users_controller" );
const usersProjectsSchema = require( "../../../../schema/request/users_projects" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await UsersController.projects( req );
    sendWrapper( req, res, null, results );
  }

  const parameters = [
    transform(
      Joi.number( ).integer( )
        .label( "id" )
        .meta( { in: "path" } )
        .required( )
        .description( "A single project ID" )
    )
  ].concat(
    _.map( usersProjectsSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) )
  );
  parameters.push(
    transform( Joi.string( ).label( "X-HTTP-Method-Override" ).meta( { in: "header" } ) )
  );

  GET.apiDoc = {
    tags: ["Users"],
    summary: "Return projects as user has joined / followed.",
    security: [{
      userJwtOptional: []
    }],
    parameters,
    responses: {
      200: {
        description: "An array of projects.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsProjects"
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
