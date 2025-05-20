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
        // Note that array values will get appended here and may not actually
        // validate properly, b/c if there is an attribute like
        // user.some_array, it will get declared here as user
        // [some_array], but when submitted as a multipart request, each
        // value will be user[some_array][0] (or another index), and openapi
        // raise an error due to an unknown key. We are currently handling
        // that by allowing unknown attributes in multipart requests that
        // support array values, with the caveat that these values will not
        // be properly validated.
        multipartRequest = multipartRequest.append( { [thisKey]: attr.schema } );
      }
    } );
    return multipartRequest;
  }
};

module.exports = openapiUtil;
