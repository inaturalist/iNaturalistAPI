const _ = require( "lodash" );
const { initialize } = require( "express-openapi" );
const swaggerUi = require( "swagger-ui-express" );
const fs = require( "fs" );
const multer = require( "multer" );
const crypto = require( "crypto" );
const jwt = require( "jsonwebtoken" );
const openapiCoercer = require( "openapi-request-coercer" );
const rison = require( "rison-node" );
const config = require( "../config" );
const v2ApiDoc = require( "../openapi/doc" );
const util = require( "./util" );
const apiUtil = require( "./api_util" );
const User = require( "./models/user" );
const UserSession = require( "./user_session" );

// TODO: how to get applyMethodOverrideMiddleware to work properly without
// some persistent variable like this. The route in the override middleware
// needs to be defined BEFORE the openapi app is initialized and defines it
// own routes, but the middleware also needs to know which paths can be
// overridden, which it can't know until the app is initialized
let initializedOpenapi = null;

const JWT_MISSING_OR_INVALID_ERROR = new Error( "JWT is missing or invalid" );
JWT_MISSING_OR_INVALID_ERROR.status = 401;

const InaturalistAPIV2 = class InaturalistAPIV2 {
  // this needs all 4 parameters even if next is not used
  /* eslint-disable-next-line no-unused-vars */
  static errorMiddleware( err, req, res, next ) {
    let status = err.status || ( err.response && err.response.status );

    // detect openapi-request-validator errors, which have `status` and `errors` attributes,
    // and return a 422 if there are any validation errors
    if ( err.status && !_.isEmpty( err.errors ) ) {
      let validationError = false;
      err.errors = _.map( err.errors, e => {
        if ( e.errorCode && e.errorCode.match( /\.openapi\.requestValidation$/ ) ) {
          validationError = true;
        }
        delete e.errorCode;
        delete e.location;
        return e;
      } );
      if ( validationError ) {
        err.status = 422;
        status = 422;
      }
    }

    console.log( "errorMiddleware trace:" );
    console.trace( err );
    console.log( ":end trace" );
    // Confusingly, the response object we get here has not already had its CORS
    // access control headers set, even though that middleware should be set in
    // inaturalist_api.js. Without this, clients like Chrome will simply bail
    // b/c of the missing Access Control header and not return a useful error
    // message. Ideally we would be able to ensure that that middleware runs
    // *before* any kind of validation middleware, but I don't see how to do
    // that. ~~ kueda 20200904
    util.accessControlHeaders( req, res, ( ) => {} );
    if ( err.errorCode === "authentication.openapi.security" ) {
      res.status( status || 401 ).json( {
        status: ( status || 401 ).toString( ),
        errors: [{
          errorCode: ( status || 401 ).toString( ),
          message: "Unauthorized"
        }]
      } );
      return;
    }
    // Rails will often return errors with a json body
    if ( err.response ) {
      err.response.json( ).then( json => {
        res.status( status || 500 ).jsonp( {
          status: ( status || 500 ).toString( ),
          errors: [{
            errorCode: ( status || 500 ).toString( ),
            message: JSON.stringify( json ),
            from: "externalAPI"
          }]
        } );
      } ).catch( ( ) => InaturalistAPIV2.renderDefaultError( res, err, status ) );
      return;
    }
    InaturalistAPIV2.renderDefaultError( res, err, status );
  }

  static renderDefaultError( res, err, status ) {
    res.status( status || 500 ).jsonp( err instanceof Error
      ? {
        status: ( status || 500 ).toString( ),
        errors: [{
          errorCode: ( status || 500 ).toString( ),
          message: err.custom_message || err.message
        }]
      } : err );
  }

  static isFetchRequest( req ) {
    // return true if this is a GET (or POST override of a GET for a method that allows it),
    // and the path includes and end with an ID or UUID, not subpaths e.g. /{id}/wanted
    const openapiPath = InaturalistAPIV2.detectOpenAPIPathFromRequestPath( req );
    if ( openapiPath && openapiPath.get && (
      req.method === "GET"
        || ( req.method === "POST"
          && req.header( "X-HTTP-Method-Override" )
          && _.find( openapiPath.get.parameters, p => (
            p.name === "X-HTTP-Method-Override" && p.in === "header"
          ) )
        )
    ) ) {
      return _.find( req.operationDoc.parameters, p => (
        p.in === "path"
          && p.required
          && _.includes( ["id", "uuid"], p.name )
          && openapiPath.path.match( new RegExp( `{${p.name}}$` ) )
      ) );
    }
    return false;
  }

  static setCacheControlHeaders( req, res ) {
    if ( req.method === "GET" && res.statusCode === 200 ) {
      let { ttl } = req.query;
      if ( !ttl && ttl !== 0 ) {
        ttl = req.operationDoc["x-default-ttl"];
      }
      if ( _.isString( ttl ) ) {
        ttl = Number( ttl );
      }
      if ( _.isNumber( ttl ) && !_.isNaN( ttl ) ) {
        if ( ttl === -1 ) {
          res.setHeader( "Cache-Control",
            "private, no-cache, no-store, must-revalidate" );
          res.setHeader( "Expires", "-1" );
          res.setHeader( "Pragma", "no-cache" );
        } else {
          res.setHeader( "Cache-Control", `public, max-age=${ttl}` );
        }
      }
    }
  }

  // this will be shared as a `dependency` with all openapi `path` endpoints
  // to be used as a consistent way to throw errors and return JSON to render
  static sendWrapper( req, res, err, returnData ) {
    if ( err ) { return void InaturalistAPIV2.errorMiddleware( err, null, res, null ); }

    // if there are no results in the response and this is a fetch request,
    // render a 404 indicating no records were found
    if ( returnData
      && _.isEmpty( returnData.results )
      && req.operationDoc
      && req.operationDoc.parameters
      && InaturalistAPIV2.isFetchRequest( req )
    ) {
      res.status( 404 );
    }

    if ( !res.status ) {
      res.status( 200 );
    }

    InaturalistAPIV2.setCacheControlHeaders( req, res );

    if ( req.operationDoc.responses?.["200"]?.content?.["image/png"] ) {
      return;
    }

    res.header( "Content-Type", "application/json" ).jsonp( returnData );
  }

  // set up multer to handle multipart file uploads
  static uploadHandler( ) {
    const storage = multer.diskStorage( {
      destination: ( req, file, callback ) => {
        crypto.pseudoRandomBytes( 16, ( err, raw ) => {
          const time = Date.now( );
          const hash = raw.toString( "hex" );
          // create a directory in which to store the upload
          const uploadDir = `openapi/uploads/tmp_${time}_${hash}`;
          if ( !fs.existsSync( uploadDir ) ) {
            fs.mkdirSync( uploadDir );
          }
          callback( null, uploadDir );
        } );
      },
      filename: ( req, file, callback ) => callback( null, file.originalname )
    } );
    return multer( { storage } );
  }

  static multipartMiddleware( req, res, next ) {
    // this middleware will be used for any endpoint that defines a
    // `multipart/form-data` request, regardless of wether or not this request
    // actually is a miltipart request. So skip this unless it is multipart
    if ( !req.is( "multipart/form-data" ) ) {
      next( );
      return;
    }
    const knownUploadFields = [];
    const { properties } = InaturalistAPIV2.resolveSchema(
      req.operationDoc.requestBody.content["multipart/form-data"].schema
    );
    // determine fields for which this method allows uploads
    _.each( properties, ( schema, name ) => {
      if ( schema.type === "string" && schema.format === "binary" ) {
        knownUploadFields.push( name );
      }
    } );
    const parameters = _.map( _.keys( properties ), k => ( {
      in: req.headers["content-type"] === "application/json" ? "body" : "formData",
      name: k,
      schema: properties[k]
    } ) );
    // TODO - explain: I think express-openapi wasn't automatically using the coercer on multipart
    // requests and this section is making that happen. We often accept uploads with other formData
    // parameters and we want the non-binary parameters to be coerced.

    // 2022-09-27 update
    // I think the coercer is only looking at response types of `x-www-form-urlencoded`, see:
    // https://github.com/kogosoftwarellc/open-api/blob/b4579b59556a4af1a11b61d00aa16cee486a7f1e/packages/openapi-request-coercer/index.ts#L124
    // Also, it may be an undocumented feature that $refs in request bodies are only resolved
    // if they exist within path '#/components/requestBodies', see
    // https://github.com/kogosoftwarellc/open-api/blob/b4579b59556a4af1a11b61d00aa16cee486a7f1e/packages/openapi-framework/src/util.ts#L328'
    const coercer = new openapiCoercer.default( { // eslint-disable-line
      extensionBase: "x-express-openapi-coercion",
      loggingKey: "express-openapi-coercion",
      parameters,
      enableObjectCoercion: true
    } );
    const uploadHandler = InaturalistAPIV2.uploadHandler( );
    const uploadMiddleware = uploadHandler.fields(
      _.map( knownUploadFields, f => ( { name: f } ) )
    );
    uploadMiddleware( req, res, ( ) => {
      const body = InaturalistAPIV2.flattenMultipartParams( _.cloneDeep( req.body ) );
      // multer puts files in a `files` attribute, but we need them in the body
      if ( req.files ) {
        _.each( knownUploadFields, f => {
          if ( req.files[f] ) {
            body[f] = req.files[f];
          }
        } );
      }
      // reset the body to include files and remove empty fields
      req.body = body;
      // run the coercer now that the body is complete with multipart parameters
      coercer.coerce( req );
      next( );
    } );
  }

  static flattenMultipartParams( params, keyPrefix ) {
    if ( params === null ) { return params; }
    if ( typeof params === "object" ) {
      if ( !params.constructor || params.constructor.name === "Object" ) {
        const flattenedParams = { };
        Object.keys( params ).forEach( k => {
          const newPrefix = keyPrefix ? `${keyPrefix}[${k}]` : k;
          Object.assign( flattenedParams,
            InaturalistAPIV2.flattenMultipartParams( params[k], newPrefix ) );
        } );
        return flattenedParams;
      }
      if ( params.constructor.name === "Array" ) {
        const flattenedParams = { };
        params.forEach( ( value, index ) => {
          const newPrefix = `${keyPrefix}[${index}]`;
          Object.assign( flattenedParams,
            InaturalistAPIV2.flattenMultipartParams( params[index], newPrefix ) );
        } );
        return flattenedParams;
      }
    }
    return { [keyPrefix]: params };
  }

  // given a request, use the request path to lookup the OpenAPI path configuration
  static detectOpenAPIPathFromRequestPath = req => {
    const basePathRegex = new RegExp( "^/v2" );
    const apiPath = req.path.replace( basePathRegex, "" );
    if ( initializedOpenapi.apiDoc.paths[apiPath] ) {
      return {
        ...initializedOpenapi.apiDoc.paths[apiPath],
        path: apiPath
      };
    }
    const paths = _.keys( initializedOpenapi.apiDoc.paths );
    let openapiPath;
    _.each( paths, knownPath => {
      // This is admittedly crude: assumes the URL exactly matches the route pattern
      const pathRegex = new RegExp( `^${knownPath.replace( /\{.+?\}/, ".+?" )}$` );
      if ( !openapiPath && pathRegex.test( apiPath ) ) {
        openapiPath = {
          ...initializedOpenapi.apiDoc.paths[knownPath],
          path: knownPath
        };
      }
    } );
    return openapiPath;
  };

  // Middleware to detect to X-HTTP-Method-Override header. We use this header
  // to support long, complex retrieval requests at POST endpoints as well as
  // the more traditional creation requests to the same POST endpoints. For
  // example, under normal circumstances you might POST /observations to create
  // an observation, but if you set the X-HTTP-Method-Override to GET and POST
  // to /observations, you could instead send a complicated query object to
  // retrieve records (see requestFields below)
  //
  // Note that this requires that a GET or a POST definition for an endpoint
  // defines a X-HTTP-Method-Override param in the header.
  //
  // When you POST, the presumption is that the URL has no query and will match
  // the URL pattern exactly
  static applyMethodOverrideMiddleware( inaturalistAPIExpressApp ) {
    inaturalistAPIExpressApp.use( ( req, res, next ) => {
      const methodOverride = req.header( "X-HTTP-Method-Override" );
      if ( req.method === "POST" && methodOverride === "GET" && initializedOpenapi ) {
        const openapiPath = InaturalistAPIV2.detectOpenAPIPathFromRequestPath( req );
        if ( openapiPath && openapiPath.get ) {
          const allowsOverride = _.find(
            InaturalistAPIV2.resolveParameters( openapiPath.get.parameters ), p => (
              p.name === "X-HTTP-Method-Override" && p.in === "header"
            )
          );
          if ( allowsOverride ) {
            if ( _.isEmpty( req.body ) ) {
              const err = new Error( "X-HTTP-Method-Override requires a request body. For requests with no parameters, use GET" );
              err.status = 422;
              return void initializedOpenapi.args.errorMiddleware( err, null, res, null );
            }
            req.originalMethod = req.originalMethod || req.method;
            req.method = "GET";
            // Since this is supposed to behave like a GET request, put all the
            // body params into the query so controller methods expecting query
            // content will get it. Note that this seems to cause a bug with
            // coersion when the values are numbers, hence the stringification.
            // I imagine that might eventually cause other problems, though.
            req.query = Object.assign( req.query, util.stringifyValues( req.body ) );
          }
        }
      }
      next( );
    } );
  }

  // If a schema looks like one of our custom schemas, return the custom schema.
  // Otherwise return the schema that was passed in
  static resolveSchema( schema ) {
    const schemaRef = schema.$ref;
    if ( schemaRef ) {
      if ( schemaRef.match( /#\/components\/schemas\// ) ) {
        const schemaName = schemaRef.replace( "#/components/schemas/", "" );
        return initializedOpenapi.apiDoc.components.schemas[schemaName];
      }
      if ( schemaRef.match( /#\/components\/parameters\// ) ) {
        const schemaName = schemaRef.replace( "#/components/parameters/", "" );
        return initializedOpenapi.apiDoc.components.parameters[schemaName];
      }
    }
    return schema;
  }

  static resolveParameters( parameters ) {
    return _.map( parameters, p => InaturalistAPIV2.resolveSchema( p ) );
  }

  // Extract the requested response fields
  static requestFields( req ) {
    const fields = req.body.fields || req.query.fields;
    // fields may already be an object, if so return
    if ( _.isObject( fields ) ) {
      return fields;
    }
    if ( !_.isEmpty( fields ) ) {
      try {
        const fieldsJson = JSON.parse( fields );
        // fields may be valid JSON, if so turn into an object and return
        return fieldsJson;
      } catch ( e ) {
        // ignore parse failures
      }
      const fieldsStringMatch = fields.match( /^[a-z_.]+(,[a-z_.]+)*$/ );
      if ( fieldsStringMatch ) {
        const fieldsObject = { };
        // fields might be a comma-delimited string
        _.each( fields.split( "," ), field => {
          // some fields contain nested object references with dot notation
          if ( _.includes( field, "." ) ) {
            _.set( fieldsObject, field, true );
          } else {
            fieldsObject[field] = true;
          }
        } );
        return fieldsObject;
      }
      // rison-encoded objects will be strings starting with `(`
      if ( fields.length > 0 && fields[0] === "(" ) {
        try {
          const fieldsJson = rison.decode( fields );
          return fieldsJson;
        } catch ( e ) {
          // ignore parse failures
        }
      }
      return false;
    }
    return null;
  }

  static responseItemSchema( req ) {
    if ( req.operationDoc
      && req.operationDoc.responses["200"]
      && req.operationDoc.responses["200"].content
      && req.operationDoc.responses["200"].content["application/json"]
      && req.operationDoc.responses["200"].content["application/json"].schema
    ) {
      const responseSchema = InaturalistAPIV2.resolveSchema(
        req.operationDoc.responses["200"].content["application/json"].schema
      );
      if ( responseSchema.properties
        && responseSchema.properties.results
        && responseSchema.properties.results.items
      ) {
        return InaturalistAPIV2.resolveSchema( responseSchema.properties.results );
      }
    }
    return null;
  }

  // These methods take the requested fields, select the ones that match the
  // schema definition for the endpoint that was hit, and return only those
  // fields.
  static applyFieldSelectionToObject( req, item, fieldsRequested, itemSchema ) {
    let fieldsToReturn = { };
    // Make sure we always return required fields
    _.each( itemSchema.required, k => {
      // If there were requested fields, use those
      fieldsToReturn[k] = ( fieldsRequested && fieldsRequested[k] ) || true;
    } );
    // Requested fields might be specified as a string, e.g. "date", an array,
    // e.g. ["date"], or an object, e.g. {date: true} or {date: "date"}. Here
    // we're normalizing them into an object
    if ( _.isArray( fieldsRequested ) ) {
      fieldsToReturn = Object.assign( fieldsToReturn, _.keyBy( fieldsRequested, r => r ) );
    } else if ( _.isString( fieldsRequested ) ) {
      fieldsToReturn = Object.assign( fieldsToReturn, _.keyBy( [fieldsRequested], r => r ) );
    } else {
      fieldsToReturn = Object.assign( fieldsToReturn, fieldsRequested );
    }
    const prunedItem = { };
    if ( fieldsToReturn.all ) {
      _.each( itemSchema.properties, ( v, k ) => {
        const propertySchema = InaturalistAPIV2.resolveSchema( v );
        prunedItem[k] = InaturalistAPIV2.applyFieldSelectionToItem(
          req,
          item[k],
          { all: true },
          propertySchema
        );
      } );
    } else {
      // loop through the requested fields
      _.each( fieldsToReturn, ( v, k ) => {
        // the root item has the field, and is in the root item definition
        const fieldSchema = itemSchema.properties[k];
        if ( item[k] !== undefined && fieldSchema ) {
          const propertySchema = InaturalistAPIV2.resolveSchema( fieldSchema );
          prunedItem[k] = InaturalistAPIV2.applyFieldSelectionToItem(
            req,
            item[k],
            v,
            propertySchema
          );
        }
      } );
    }
    return prunedItem;
  }

  static applyFieldSelectionToItem( req, item, fields, itemSchema ) {
    if ( itemSchema.type === "array" && _.isArray( item ) ) {
      item = _.map( item, i => InaturalistAPIV2.applyFieldSelectionToItem(
        req, i, fields, InaturalistAPIV2.resolveSchema( itemSchema.items )
      ) );
    } else if ( itemSchema.type === "object" && _.isObject( item ) ) {
      item = InaturalistAPIV2.applyFieldSelectionToObject( req, item, fields, itemSchema );
    }
    return item;
  }

  static validationOverrideForExpressMethod( req, res, method ) {
    const strictValidation = !!req.apiDoc["x-express-openapi-validation-strict"];
    const pureExpressMethod = res[method];
    res[method] = ( ...args ) => {
      const onlyWarn = !strictValidation;
      if ( res.get( "x-express-openapi-validated" ) !== undefined ) {
        return pureExpressMethod.apply( res, args );
      }
      const body = args[0];
      const itemSchema = InaturalistAPIV2.responseItemSchema( req );
      // TODO there should be a way to apply fields filtering to response
      // attributes other than the results array. Not sure if this means an
      // entire response schema should be specified, like { results: { taxon: {
      // name: true } } }, or if only "resources" should be specified and the
      // same filtering applies wherever they're encountered, e.g. { taxon: {
      // name: true } }.
      if (
        body
        && !_.isEmpty( body.results )
        && itemSchema
      ) {
        if ( req.inat.fields === false ) {
          res.set( "x-express-openapi-validated", true );
          const error = new Error( "invalid fields parameter" );
          error.status = 422;
          return InaturalistAPIV2.sendWrapper( req, res, error );
        }
        if ( req.inat.fields !== "all" ) {
          body.results = InaturalistAPIV2.applyFieldSelectionToItem(
            req,
            body.results,
            req.inat.fields,
            itemSchema
          );
        }
      }

      // TODO figure out a way to validate error responses; should each
      // endpoint be able to specify it's own kind of error response? Should
      // there just be one and the error middleware handles it? Without this,
      // error responses get validated, and every error, including a 422,
      // becomes a 500 to the client if the path doesn't explicitly lay out
      // the shape of the error response
      if ( res.statusCode >= 400 ) {
        return pureExpressMethod.apply( res, args );
      }

      let validation = res.validateResponse( res.statusCode, body );
      let validationMessage;
      if ( validation === undefined ) {
        validation = { message: undefined, errors: undefined };
      }
      if ( validation.errors ) {
        const errorList = Array.from( validation.errors ).map( e => `${e.path}: ${e.message}` ).join( "," );
        validationMessage = `Invalid response for status code ${res.statusCode}: ${errorList}`;
        // Set to avoid a loop, and to provide the original status code
        res.set( "x-express-openapi-validation-error-for", res.statusCode.toString( ) );
      }
      res.set( "x-express-openapi-validated", true );
      if ( onlyWarn || !validation.errors ) {
        if ( _.isNull( body ) ) {
          args[0] = "";
        } else if ( _.has( req.originalQuery || req.query, "pretty" ) ) {
          args[0] = JSON.stringify( body, null, 2 );
        }
        return pureExpressMethod.apply( res, args );
      }
      return InaturalistAPIV2.sendWrapper( req, res, new Error( validationMessage ) );
    };
  }

  static setRequestFields( req, res, next ) {
    req.inat.fields = InaturalistAPIV2.requestFields( req );
    req.inat.fieldRequested = targetFieldPath => {
      if ( !req.inat.fields ) {
        return false;
      }
      return InaturalistAPIV2.targetFieldInSource( targetFieldPath, req.inat.fields );
    };
    next( );
  }

  static targetFieldInSource( targetFieldPath, sourceFields ) {
    if ( !_.isString( targetFieldPath ) || !_.isObject( sourceFields ) ) {
      throw new Error( );
    }
    if ( sourceFields.all ) {
      return "all";
    }
    const fieldHierarchy = targetFieldPath.split( "." );
    const nextTargetField = fieldHierarchy.shift( );
    const sourceMatch = sourceFields[nextTargetField];
    if ( !sourceMatch ) { return false; }
    if ( _.size( fieldHierarchy ) === 0 ) {
      return sourceFields[nextTargetField];
    }
    if ( sourceMatch === "all" ) { return "all"; }
    return InaturalistAPIV2.targetFieldInSource( fieldHierarchy.join( "." ), sourceMatch );
  }

  static validateAllResponses( req, res, next ) {
    if ( typeof res.validateResponse === "function" ) {
      // if we want to validate responses, override the express return methods
      // we might use to first validate response bodies and return a failure
      // if the response format is invalid. Otherwise use the standard express
      // return method
      InaturalistAPIV2.validationOverrideForExpressMethod( req, res, "send" );
      InaturalistAPIV2.validationOverrideForExpressMethod( req, res, "jsonp" );
    }
    next( );
  }

  static async loadCurrentUserLocaleDefaults( req, res, next ) {
    if ( !req.userSession ) {
      // this method didn't require or specify an optional JWT, so look at head JWTs now
      // TODO: ideally the called method would use `userJwtOptional` if we intend
      // the JWT to potentially modify the data returned
      await InaturalistAPIV2.verifyHeaderJWTs( req );
    }
    if ( req.userSession ) {
      const defaults = await User.localeDefaults( req.userSession.user_id );
      if ( defaults ) {
        req.userSession.extend( defaults );
      }
      if ( req.userSession.isSuspended ) {
        const error = new Error( "Unauthorized" );
        error.status = 401;
        throw error;
      }
    }
    next( );
  }

  static async lookupParameterInstances( req, res, next ) {
    apiUtil.lookupInstancesMiddleware( req )
      .then( ( ) => next( ) )
      .catch( err => InaturalistAPIV2.errorMiddleware( err, null, res, null ) );
  }

  static async jwtValidate( token, secret ) {
    try {
      const payload = jwt.verify( token, secret, { algorithms: ["HS512"] } );
      return payload;
    } catch {
      // ignore JWT decode failures
      // Authentication errors will be handled in securityHandlers as necessary
    }
    return null;
  }

  static async verifyHeaderJWTs( req ) {
    // split Authorization header by comma and verify the first two tokens
    const tokens = req.headers.authorization
      ? _.map( req.headers.authorization.split( "," ),
        t => _.last( t.trim( ).split( /\s+/ ) ) ).slice( 0, 2 )
      : null;
    await Promise.all( _.map( tokens, async token => {
      // check if token is a user JWT
      let payload = await InaturalistAPIV2.jwtValidate(
        token, config.jwtSecret || "secret"
      );
      if ( payload && payload.user_id ) {
        req.userSession = new UserSession( payload );
      } else {
        // check if token is an application JWY
        payload = await InaturalistAPIV2.jwtValidate(
          token, config.jwtApplicationSecret || "application_secret"
        );
        if ( payload && payload.application ) {
          req.applicationSession = payload;
        }
      }
    } ) );
  }

  static prepareSwaggerUIApiDoc( req, originalSwaggerDoc ) {
    // If the `unpublished` query parameter is not provided, filter out
    // endpoints that work but that we are not committed to maintaining or
    // supporting from visible documentation. Note that functionality like this
    // does not seem to be a part of the OpenAPI spec, but is under
    // consideration:
    // https://github.com/OAI/OpenAPI-Specification/issues/433.
    let modifiedSwaggerDoc = _.cloneDeep( originalSwaggerDoc );
    // remove x-express-* attributes which don't need to be in the official documentation
    modifiedSwaggerDoc = _.pickBy( modifiedSwaggerDoc, ( value, key ) => !key.match( /^x-/ ) );
    if ( !req.query.unpublished ) {
      // exclude methods that are marked as unpublished
      _.each( modifiedSwaggerDoc.paths, ( pathConfig, path ) => {
        modifiedSwaggerDoc.paths[path] = _.omitBy( pathConfig, methodConfig => (
          _.isPlainObject( methodConfig ) && methodConfig["x-unpublished"]
        ) );
      } );

      // exclude paths that have no longer have methods
      modifiedSwaggerDoc.paths = _.omitBy( modifiedSwaggerDoc.paths, pathConfig => (
        // pathConfig contains `parameters` which is an array, and methods which are objects
        _.isEmpty( _.pickBy( pathConfig, _.isPlainObject ) )
      ) );

      // exclude schemas that are marked as unpublished
      modifiedSwaggerDoc.components.schemas = _.omitBy(
        modifiedSwaggerDoc.components.schemas, ( schema, schemaName ) => {
          let joiSchema;
          const schemaPathName = _.snakeCase( schemaName );
          // The JOI schema needs to be loaded from the schema file as the
          // initialized OpenAPI doc will have turned component schemas into
          // simple JSON objects, losing some JOI properties like meta tags
          const requestSchemaPath = `openapi/schema/request/${schemaPathName}.js`;
          const responeSchemaPath = `openapi/schema/response/${schemaPathName}.js`;
          // Schemas can come from the request or reqponse directories
          _.each( [requestSchemaPath, responeSchemaPath], schemaPath => {
            if ( !joiSchema && fs.existsSync( schemaPath ) ) {
              // eslint-disable-next-line
              joiSchema = require( `../${schemaPath}` );
            }
          } );
          if ( joiSchema ) {
            const schemaMetas = _.get( joiSchema, "$_terms.metas" );
            return _.some( schemaMetas, meta => meta.unpublished );
          }
          return false;
        }
      );

      // exclude tags that are not referenced by any remaining paths
      modifiedSwaggerDoc.tags = _.filter( modifiedSwaggerDoc.tags, tag => (
        _.some( modifiedSwaggerDoc.paths, pathConfig => (
          _.some( pathConfig, methodConfig => (
            _.isPlainObject( methodConfig ) && _.includes( methodConfig.tags, tag.name )
          ) )
        ) )
      ) );
    }
    return modifiedSwaggerDoc;
  }

  static async initializeOpenapi( inaturalistAPIExpressApp ) {
    // method override middleware must be defined before initializing openapi
    InaturalistAPIV2.applyMethodOverrideMiddleware( inaturalistAPIExpressApp );

    initializedOpenapi = await initialize( {
      app: inaturalistAPIExpressApp,
      docPath: "api-docs",
      apiDoc: {
        ...v2ApiDoc,
        "x-express-openapi-additional-middleware": [
          InaturalistAPIV2.setRequestFields,
          InaturalistAPIV2.validateAllResponses,
          InaturalistAPIV2.loadCurrentUserLocaleDefaults,
          InaturalistAPIV2.lookupParameterInstances
        ],
        "x-express-openapi-validation-strict": true
      },
      enableObjectCoercion: true,
      dependencies: {
        sendWrapper: InaturalistAPIV2.sendWrapper
      },
      securityFilter: ( req, res ) => {
        res.status( 200 ).json( InaturalistAPIV2.prepareSwaggerUIApiDoc( req, req.apiDoc ) );
      },
      paths: "./openapi/paths/v2",
      promiseMode: true,
      securityHandlers: {
        userJwtOptional: async req => {
          await InaturalistAPIV2.verifyHeaderJWTs( req );
          return true;
        },
        userJwtRequired: async req => {
          await InaturalistAPIV2.verifyHeaderJWTs( req );
          if ( req.userSession ) {
            return true;
          }
          throw JWT_MISSING_OR_INVALID_ERROR;
        },
        appOrUserJwtRequired: async req => {
          await InaturalistAPIV2.verifyHeaderJWTs( req );
          if ( req.userSession || req.applicationSession ) {
            return true;
          }
          throw JWT_MISSING_OR_INVALID_ERROR;
        },
        appAndUserJwtRequired: async req => {
          await InaturalistAPIV2.verifyHeaderJWTs( req );
          if ( req.userSession && req.applicationSession ) {
            return true;
          }
          throw JWT_MISSING_OR_INVALID_ERROR;
        }
      },
      consumesMiddleware: {
        // TODO: custom coercion for JSON bodies?
        "multipart/form-data": InaturalistAPIV2.multipartMiddleware
      },
      errorTransformer: ( openapiError, ajvError ) => {
        console.log( openapiError );
        console.log( ajvError );
        const returnedError = { ...openapiError };
        if ( ajvError && ajvError ) {
          if ( ajvError.instancePath ) {
            returnedError.instancePath = ajvError.instancePath;
          }
          if ( ajvError.params ) {
            returnedError.params = ajvError.params;
          }
        }
        return returnedError;
      },
      errorMiddleware: InaturalistAPIV2.errorMiddleware
    } );

    inaturalistAPIExpressApp.get( "/v2/", ( req, res ) => res.redirect( "/v2/docs" ) );

    const swaggerOptions = {
      customSiteTitle: "iNaturalist API",
      customfavIcon: "/favicon.ico"
    };
    const swaggerUIMiddleware = swaggerUi.setup( initializedOpenapi.apiDoc, swaggerOptions );
    inaturalistAPIExpressApp.use(
      "/v2/docs",
      ( req, res, next ) => {
        req.swaggerDoc = InaturalistAPIV2.prepareSwaggerUIApiDoc( req, initializedOpenapi.apiDoc );
        next( );
      },
      swaggerUi.serve,
      swaggerUIMiddleware
    );
  }
};

module.exports = InaturalistAPIV2;
