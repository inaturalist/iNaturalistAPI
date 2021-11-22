/*
 * Converts a Joi schema to an OpenAPI request parameter (*not* a response field)
 */

const _ = require( "lodash" );
const j2s = require( "joi-to-swagger" );

const arrayDecorator = joiSchema => (
  // force multi-valued request parameters to be comma-delmited and
  // not with separate parameters for each array item
  joiSchema.type === "array" ? {
    explode: false
  } : null
);

const universalDecoratorJ2s = joiSchema => {
  const j2sDefinition = j2s( joiSchema );
  // omit a few attributes from the schema that parameters expect to be defined outside the schema
  const j2sCandidate = {
    schema: _.omit( j2sDefinition.swagger, "title", "description", "example", "examples" )
  };
  // parameter names use the swagger title
  if ( j2sDefinition.swagger.title ) {
    j2sCandidate.name = j2sDefinition.swagger.title;
  }
  // parameter descriptions are defined *outside* the schema
  if ( j2sDefinition.swagger.description ) {
    j2sCandidate.description = j2sDefinition.swagger.description;
  }
  // examples in OpenAPI parameters are defined *outside* the schema
  if ( j2sDefinition.swagger.example ) {
    j2sCandidate.example = j2sDefinition.swagger.example;
  }
  if ( j2sDefinition.swagger.examples ) {
    j2sCandidate.examples = j2sDefinition.swagger.examples;
  }
  // joi-to-swagger doesn't handle this format yet
  if ( joiSchema.type === "string" ) {
    if ( _.find( joiSchema._rules, { name: "uri" } ) ) {
      j2sCandidate.schema.format = "uri";
    }
  }
  // parameters can be required, defined differently than in responses
  if ( joiSchema._flags.presence === "required" ) {
    j2sCandidate.required = true;
  }
  return j2sCandidate;
};

const convert = joiSchema => {
  if ( !joiSchema ) throw new Error( "No schema was passed." );

  const metaIns = _.compact( _.map( _.get( joiSchema, "$_terms.metas" ), m => m.in ) );
  let metaIn = "query";
  if ( metaIns.indexOf( "path" ) >= 0 ) {
    metaIn = "path";
  } else if ( metaIns.indexOf( "header" ) >= 0 ) {
    metaIn = "header";
  }

  const baseDefinition = {
    in: metaIn,
    ...universalDecoratorJ2s( joiSchema ),
    ...arrayDecorator( joiSchema )
  };
  if ( _.find( joiSchema.$_terms.metas, m => m.deprecated ) ) {
    baseDefinition.deprecated = true;
  }
  // Remove empty values from valids. This means that if a parameter has a set
  // of allowed values, we do not allow a blank, e.g. if param can be yes or no,
  // we allow param=no, but not param=
  if ( joiSchema._valids && _.size( joiSchema._valids.values( ) ) > 0 ) {
    const validValues = joiSchema._valids.values( );
    const notEmptyValues = validValues.filter( value => value !== null && value !== "" );
    if ( notEmptyValues.length ) {
      baseDefinition.schema.enum = notEmptyValues;
    }
  }
  // treat booleans as an array of strings that can be "true" or "false"
  if ( baseDefinition.schema.type === "boolean" ) {
    baseDefinition.schema = { enum: ["true", "false"] };
    delete baseDefinition.schema.type;
  }
  return baseDefinition;
};

module.exports = convert;
