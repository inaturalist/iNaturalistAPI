// In OpenAPI 3.0, binary data is represented as a string in "binary" or "byte"
// format (https://swagger.io/docs/specification/data-models/data-types/#file),
// so we're borrowing some of the mapping from the string type.

const _ = require( "lodash" );
const { getLength, getMinLength, getMaxLength } = require( "./_string" );

const getFormat = tests => {
  const encodingTest = _.find( tests, { name: "encoding" } );
  if ( encodingTest && encodingTest.arg === "base64" ) {
    return { format: "byte" };
  }
  return { format: "binary" };
};

const parser = joiSchema => ( {
  type: "string",
  ...getFormat( joiSchema._tests ),
  ...getMaxLength( joiSchema._tests ),
  ...getMinLength( joiSchema._tests ),
  ...getLength( joiSchema._tests )
} );

module.exports = parser;
