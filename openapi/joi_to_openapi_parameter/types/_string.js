const _ = require( "lodash" );

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

module.exports = {
  getLength,
  getMinLength,
  getMaxLength
};
