// Note: I think this creates a valid OpenAPI schema, but it doesn't work with
// object coersion, which seems to expect an explicitly typed definition
// ~~kueda 2020-01-09
module.exports = ( joiSchema, convert ) => ( {
  anyOf: joiSchema._inner.matches.map( match => convert( match.schema ).schema )
} );
