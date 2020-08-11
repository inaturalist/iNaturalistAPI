/* eslint-disable no-underscore-dangle */
const _ = require( "lodash" );

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

const getLength = tests => {
  const length = _.find( tests, { name: "length" } );
  return length ? { length: length.arg } : null;
};

const getMinLength = tests => {
  const min = _.find( tests, { name: "min" } );
  return min ? { minLength: min.arg } : null;
};

const getMaxLength = tests => {
  const max = _.find( tests, { name: "max" } );
  return max ? { maxLength: max.arg } : null;
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
