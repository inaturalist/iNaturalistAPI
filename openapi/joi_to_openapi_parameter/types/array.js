const _ = require( "lodash" );

const getChild = ( items, convert ) => {
  if ( items.length === 1 ) {
    return { items: convert( items[0] ).schema };
  }
  return { items: { anyOf: _.map( items, i => ( { type: i._type } ) ) } };
};

const getLength = tests => {
  const length = _.find( tests, { name: "length" } );
  return length ? { minItems: length.arg, maxItems: length.arg } : null;
};

const getMinItems = tests => {
  const min = _.find( tests, { name: "min" } );
  return min ? { minItems: min.arg } : null;
};

const getMaxItems = tests => {
  const max = _.find( tests, { name: "max" } );
  return max ? { maxItems: max.arg } : null;
};

const parser = ( joiSchema, convert ) => ( {
  type: "array",
  ...getChild( joiSchema._inner.items, convert ),
  ...getMaxItems( joiSchema._tests ),
  ...getMinItems( joiSchema._tests ),
  ...getLength( joiSchema._tests )
} );

module.exports = parser;
