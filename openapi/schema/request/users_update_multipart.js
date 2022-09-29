const Joi = require( "joi" );
const usersUpdate = require( "./users_update" );
const openapiUtil = require( "../../openapi_util" );

module.exports = openapiUtil.applicationJsonToMultipart( usersUpdate ).append( {
  "user[icon]": Joi.binary( )
} );
