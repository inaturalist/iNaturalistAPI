/* eslint-disable no-underscore-dangle */
const _ = require( "lodash" );


const getType = tests => {
  if ( _.find( tests, { name: "integer" } ) ) {
    return { type: "integer" };
  }
  if ( _.find( tests, { name: "precision" } ) ) {
    return {
      type: "number",
      format: "double"
    };
  }
  return {
    type: "number",
    format: "float"
  };
};

const getMinValue = tests => {
  const min = _.find( tests, { name: "min" } );
  if ( min ) {
    return { minimum: min.arg };
  }
  if ( _.find( tests, { name: "positive" } ) ) {
    return { minimum: 1 };
  }
  return null;
};

const getMaxValue = tests => {
  const max = _.find( tests, { name: "max" } );
  if ( max ) {
    return { maximum: max.arg };
  }
  if ( _.find( tests, { name: "negative" } ) ) {
    return { maximum: -1 };
  }
  return null;
};

const getValidValues = joiSchema => {
  if ( !joiSchema._flags.allowOnly ) {
    return null;
  }
  const validValues = joiSchema._valids.values( ).filter( value => typeof value === "number" );
  if ( validValues.length ) {
    return { enum: validValues };
  }
  return null;
};

const parser = joiSchema => ( {
  ...getType( joiSchema._tests ),
  ...getMinValue( joiSchema._tests ),
  ...getMaxValue( joiSchema._tests ),
  ...getValidValues( joiSchema )
} );

module.exports = parser;
