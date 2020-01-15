const Joi = require( "@hapi/joi" );
const transform = require( "../../../joi_to_openapi_parameter" );
const observationsController = require( "../../../../lib/controllers/v2/observations_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    observationsController.show( req, ( err, results ) => {
      sendWrapper( req, res, err, results );
    } );
  }

  GET.apiDoc = {
    tags: ["Observations"],
    summary: "Fetch observations.",
    security: [{
      jwtOptional: []
    }],
    parameters: [
      transform(
        Joi.array( )
          .items( Joi.string( ).guid( ) )
          .label( "uuid" )
          .meta( { in: "path" } )
          .required( )
          .description( "A single UUID or a comma-separated list of them" )
      ),
      transform( Joi.string( ).label( "fields" ).meta( { in: "query" } ) )
    ],
    responses: {
      200: {
        description: "An array of observations.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsObservations"
            }
          }
        }
      }
    }
  };

  // async function PUT( req, res ) {
  //   observationsController.update( req, ( err, results ) => {
  //     sendWrapper( req, res, err, results );
  //   } );
  // }

  // PUT.apiDoc = {
  //   tags: ["Observations"],
  //   summary: "Update an observation",
  //   security: [{
  //     jwtRequired: []
  //   }],
  //   parameters: [
  //     transform(
  //       Joi.string( ).guid( )
  //         .label( "uuid" )
  //         .meta( { in: "path" } )
  //         .required( )
  //         .description( "UUID of the observation to update" )
  //     )
  //   ]
  // }

  return {
    GET
    // PUT
  };
};
