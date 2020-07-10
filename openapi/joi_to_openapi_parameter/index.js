const _ = require( "lodash" );
const numberParser = require( "./types/number" );
const stringParser = require( "./types/string" );
const booleanParser = require( "./types/boolean" );
const arrayParser = require( "./types/array" );
const dateParser = require( "./types/date" );
const objectParser = require( "./types/object" );
const alternativesParser = require( "./types/alternatives" );

const universalDecorator = joiSchema => {
  const universalParams = { };

  if ( joiSchema._flags.label ) {
    universalParams.name = joiSchema._flags.label;
  }

  if ( joiSchema._valids && joiSchema._valids.has( null ) ) {
    universalParams.nullable = true;
  }

  if ( joiSchema._description ) {
    universalParams.description = joiSchema._description;
  }

  if ( joiSchema._flags.default ) {
    universalParams.default = joiSchema._flags.default;
  }

  if ( joiSchema._flags.presence === "required" ) {
    universalParams.required = true;
  }

  const metaExamples = _.find( joiSchema._meta, m => m.examples );
  if ( metaExamples ) {
    universalParams.examples = metaExamples.examples;
  } else if ( joiSchema._examples && joiSchema._examples.length === 1 ) {
    universalParams.example = joiSchema._examples[0].value;
  }

  return universalParams;
};

const arrayDecorator = joiSchema => (
  joiSchema._type === "array" ? {
    explode: false
  } : null
);

const convert = joiSchema => {
  if ( !joiSchema ) throw new Error( "No schema was passed." );

  if ( !joiSchema.isJoi ) throw new TypeError( "Passed schema does not appear to be a joi schema." );

  // if ( !joiSchema._flags.label ) {
  //   throw new Error( "Must include a label" );
  // }

  const type = joiSchema._type;
  let schema;
  switch ( type ) {
    case "number":
      schema = numberParser( joiSchema );
      break;
    case "string":
      schema = stringParser( joiSchema );
      break;
    case "boolean":
      schema = booleanParser( joiSchema );
      break;
    // case "binary":
    //   swaggerSchema = binaryParser( joiSchema );
    //   break;
    // case "alternatives":
    //   schema = alternativesParser( joiSchema, convert );
    //   break;
    case "object":
      schema = objectParser( joiSchema, convert );
      break;
    case "array":
      schema = arrayParser( joiSchema, convert );
      break;
    case "date":
      schema = dateParser( joiSchema );
      break;
    case "any":
      schema = { };
      break;
    default:
      throw new TypeError( `${type} is not a Joi type recognized by parameterize.` );
  }

  const metaIns = _.compact( _.map( joiSchema._meta, m => m.in ) );
  let metaIn = "query";
  if ( metaIns.indexOf( "path" ) >= 0 ) {
    metaIn = "path";
  } else if ( metaIns.indexOf( "header" ) >= 0 ) {
    metaIn = "header";
  }
  const baseDefinition = {
    in: metaIn,
    schema,
    ...universalDecorator( joiSchema ),
    ...arrayDecorator( joiSchema )
  };
  if ( _.find( joiSchema._meta, m => m.in && m.deprecated ) ) {
    baseDefinition.deprecated = true;
  }
  if ( joiSchema._valids && joiSchema._valids._set.size ) {
    const validValues = Array.from( joiSchema._valids._set );
    const notEmptyValues = validValues.filter( value => value !== null && value !== "" );
    if ( notEmptyValues.length ) {
      baseDefinition.schema.enum = notEmptyValues;
    }
  }
  return baseDefinition;
};

module.exports = convert;
