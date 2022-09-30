const _ = require( "lodash" );
const Joi = require( "joi" );

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
};

module.exports = openapiUtil;
