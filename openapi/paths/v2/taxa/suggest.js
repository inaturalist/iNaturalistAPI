const _ = require( "lodash" );
const j2s = require( "joi-to-swagger" );
const Joi = require( "joi" );
// const nodeUtil = require( "util" );
const taxaSuggestSchema = require( "../../../schema/request/taxa_suggest" );
const transform = require( "../../../joi_to_openapi_parameter" );
const TaxaController = require( "../../../../lib/controllers/v2/taxa_controller" );

module.exports = sendWrapper => {
  async function GET( req, res ) {
    const results = await TaxaController.suggest( req );
    sendWrapper( req, res, null, results );
  }

  GET.apiDoc = {
    tags: ["Taxa"],
    summary: "Suggest taxa for identifications given conditions",
    description: "Retrieve automated identification suggestions for an observation or a set of filters like taxon and place",
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
      },
      transform(
        Joi.string( )
          .label( "image_url" )
          .uri( )
          .description( "URL for image to use when `source` is `visual`" )
      )
    ].concat( _.map( taxaSuggestSchema.$_terms.keys, child => (
      transform( child.schema.label( child.key ) )
    ) ) ),
    responses: {
      200: {
        description: "An array of suggestions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ResultsTaxaSuggest"
            }
          }
        }
      }
    }
  };

  async function POST( req, res ) {
    return GET( req, res );
  }

  POST.apiDoc = Object.assign( {}, GET.apiDoc, {
    summary: "Suggest taxa for identifications given conditions and an image",
    description: "Just like its GET counterpart except it accepts an `image` parameter in a multipart POST request",
    parameters: [],
    requestBody: {
      content: {
        "multipart/form-data": {
          schema: j2s(
            taxaSuggestSchema.keys( {
              image: Joi.binary( )
                .description( "Image to use when `source` is `visual`" )
            } )
          ).swagger
        }
      }
    }
  } );

  return {
    GET,
    POST
  };
};
