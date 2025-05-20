const Joi = require( "joi" );
const usersUpdate = require( "./users_update" );
const openapiUtil = require( "../../openapi_util" );

// Convert the JSON schema to equivalent FormData keys, e.g. user[description]
module.exports = openapiUtil.applicationJsonToMultipart( usersUpdate )
  .append( { "user[icon]": Joi.binary( ) } )
  // Unfortunately, array items will be submitted in FormData as
  // user[some_array_attr][0], and we don't know of a way to specify
  // wildcards in keys
  .unknown( true );
