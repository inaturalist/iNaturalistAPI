const getType = flags => {
  if ( flags.timestamp ) {
    return { type: "integer" };
  }
  return {
    type: "string",
    format: "date-time"
  };
};

const parser = joiSchema => ( {
  ...getType( joiSchema._flags )
} );

module.exports = parser;
