/* eslint-disable no-underscore-dangle */
const _ = require( "lodash" );
const { getLength, getMinLength, getMaxLength } = require( "./_string" );

const getFormat = tests => {
  if ( _.find( tests, { name: "guid" } ) ) {
    return { format: "uuid" };
  }

  if ( _.find( tests, { name: "email" } ) ) {
    return { format: "email" };
  }

  if ( _.find( tests, { name: "uri" } ) ) {
    return { format: "uri" };
  }

  if ( _.find( tests, { name: "isoDate" } ) ) {
    return { format: "date-time" };
  }
  return null;
};

const alphanumPattern = tests => {
  if ( _.find( tests, { name: "alphanum" } ) ) {
    return { pattern: "^[a-zA-z0-9]+$" };
  }
  return null;
};

const parser = joiSchema => ( {
  type: "string",
  ...getFormat( joiSchema._tests ),
  ...getMaxLength( joiSchema._tests ),
  ...getMinLength( joiSchema._tests ),
  ...getLength( joiSchema._tests ),
  ...alphanumPattern( joiSchema._tests )
} );

module.exports = parser;
