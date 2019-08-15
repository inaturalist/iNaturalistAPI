const _ = require( "lodash" );

const getChild = ( child, convert ) => {
  if ( !child ) {
    return null;
  }
  const properties = {};
  _.each( child, children => {
    properties[children.key] = convert( children.schema );
  } );
  return { properties };
};

const getRequiredFields = child => {
  if ( !child ) {
    return null;
  }
  const required = [];
  _.each( child, children => {
    if ( children.schema._flags.presence === "required" ) {
      required.push( children.key );
    }
  } );
  return required.length ? { required } : null;
};


const parser = ( joiSchema, convert ) => ( {
  type: "object",
  ...getChild( joiSchema._inner.children, convert ),
  ...getRequiredFields( joiSchema._inner.children, convert )
} );

module.exports = parser;
