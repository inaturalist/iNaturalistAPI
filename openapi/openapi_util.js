const _ = require( "lodash" );
const Joi = require( "joi" );
const resultsArray = require( "./schema/response/results_array" );

const openapiUtil = class openapiUtil {
  static applicationJsonToMultipart( jsonJoi, parentKey = null ) {
    let multipartRequest = Joi.object( );
    _.each( jsonJoi.$_terms.keys, attr => {
      const thisKey = parentKey ? `${parentKey}[${attr.key}]` : attr.key;
      if ( attr.schema.type === "object" ) {
        multipartRequest = multipartRequest.concat(
          openapiUtil.applicationJsonToMultipart( attr.schema, thisKey )
        );
      } else {
        multipartRequest = multipartRequest.append( { [thisKey]: attr.schema } );
      }
    } );
    return multipartRequest;
  }

  static basicResultsArray( model ) {
    return resultsArray.keys( {
      results: Joi.array( ).items( model ).required( )
    } );
  }

  static getParameters( schemaName, options = { } ) {
    // eslint-disable-next-line
    const schema = require( `./schema/request/${schemaName}` );
    const prefix = _.upperFirst( _.camelCase( schemaName ) );
    const getParameters = [];
    _.each( schema.$_terms.keys, child => {
      if ( !( options.except && _.includes( options.except, child.key ) ) ) {
        if ( child.schema._valids && !_.isEmpty( child.schema._valids._refs ) ) {
          const refPath = Array.from( child.schema._valids._refs )[0].path[0];
          getParameters.push( { $ref: `#${refPath}` } );
        } else {
          getParameters.push( { $ref: `#/components/parameters/${prefix}_${child.key}` } );
        }
      }
    } );
    if ( !( options.except && _.includes( options.except, "X-HTTP-Method-Override" ) ) ) {
      // add the X-HTTP-Method-Override header parameter for GET requests
      getParameters.push( { $ref: "#/components/parameters/Common_X-HTTP-Method-Override" } );
    }
    return getParameters;
  }

  static referenceGetParameters( referenceSchemaName, options = { } ) {
    // eslint-disable-next-line
    const referenceSchema = require( `./schema/request/${referenceSchemaName}` );
    const referencePrefix = _.upperFirst( _.camelCase( referenceSchemaName ) );
    let schema = Joi.object( );
    _.each( referenceSchema.$_terms.keys, child => {
      if ( !( options.except && _.includes( options.except, child.key ) ) ) {
        if ( child.schema._valids && !_.isEmpty( child.schema._valids._refs ) ) {
          const refPath = Array.from( child.schema._valids._refs )[0].path[0];
          schema = schema.keys( { [child.key]: Joi.ref( `#${refPath}` ) } );
        } else {
          schema = schema.keys( { [child.key]: Joi.ref( `#/components/parameters/${referencePrefix}_${child.key}` ) } );
        }
      }
    } );
    return schema;
  }
};

module.exports = openapiUtil;
