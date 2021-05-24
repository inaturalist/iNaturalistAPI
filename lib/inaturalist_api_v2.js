const _ = require( "lodash" );
const { initialize } = require( "express-openapi" );
const swaggerUi = require( "swagger-ui-express" );
const fs = require( "fs" );
const multer = require( "multer" );
const crypto = require( "crypto" );
const jwt = require( "jsonwebtoken" );
const openapiCoercer = require( "openapi-request-coercer" );
const config = require( "../config" );
const v2ApiDoc = require( "../openapi/doc" );
const util = require( "./util" );

// TODO: how to get applyMethodOverrideMiddleware to work properly withou
// some persistent variable like this. The route in the override middleware
// needs to be defined BEFORE the openapi app is initialized and defines it
// own routes, but the middleware also needs to know which paths can be
// overridden, which it can't know until the app is initialized
let initializedOpenapi = null;

const jwtMissingError = new Error( "JWT is missing" );
jwtMissingError.status = 401;

const jwtInvalidError = new Error( "JWT is invalid" );
jwtInvalidError.status = 401;

const InaturalistAPIV2 = class InaturalistAPIV2 {
  // this needs all 4 parameters even if next is not used
  /* eslint-disable-next-line no-unused-vars */
  static errorMiddleware = ( err, req, res, next ) => {
    const status = err.status || ( err.response && err.response.status );
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
        status: status || 401,
        message: "Unauthorized"
      } );
      return;
    }
    // Rails will often return errors with a json body. Is there a good way to
    // incorporate that into the response here?
    // if ( err.response ) {
    //   err.response.json( ).then( json => {
    //     console.log( "[DEBUG] json: ", json );
    //   } );
    // }
    // console.log( "Error trace from errorMiddleware:" );
    // if ( req ) {
    //   console.log( `[DEBUG] Error from request for ${req.path}` );
    // }
    // console.trace( err );
    res.status( status || 500 ).json( err instanceof Error
      ? {
        status: status || 500,
        message: err.message,
        // TODO Remove in production, right?
        // stack: err.stack.split( "\n" ),
        from: "errorMiddleware"
      } : err );
  };

  // this will be shared as a `dependency` with all openapi `path` endpoints
  // to be used as a consistent way to throw errors and return JSON to render
  static sendWrapper = ( req, res, err, results ) => {
    if ( err ) { return void InaturalistAPIV2.errorMiddleware( err, null, res, null ); }
    if ( !res.status ) {
      res.status( 200 );
    }
    res.header( "Content-Type", "application/json" ).jsonp( results );
  };

  // set up multer to handle multipart file uploads
  static uploadHandler = ( ) => {
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

  static multipartMiddleware = ( req, res, next ) => {
    const knownUploadFields = [];
    const { properties } = req.operationDoc.requestBody.content["multipart/form-data"].schema;
    // determine fields for which this method allows uploads
    _.each( properties, ( schema, name ) => {
      if ( schema.type === "string" && schema.format === "binary" ) {
        knownUploadFields.push( name );
      }
    } );
    // TODO - explain: I think express-openapi wasn't automatically using the coercer on multipart
    // requests and this section is making that happen. We often accept uploads with other formData
    // parameters and we want the non-binary parameters to be coerced
    const parameters = _.map( _.keys( properties ), k => ( {
      in: req.headers["content-type"] === "application/json" ? "body" : "formData",
      name: k,
      schema: req.operationDoc.requestBody.content["multipart/form-data"].schema.properties[k]
    } ) );
    const coercer = new openapiCoercer.default( { // eslint-disable-line
      extensionBase: "x-express-openapi-coercion",
      loggingKey: "express-openapi-coercion",
      parameters,
      enableObjectCoercion: true
    } );
    coercer.coerce( req );
    const uploadHandler = InaturalistAPIV2.uploadHandler( );
    const uploadMiddleware = uploadHandler.fields(
      _.map( knownUploadFields, f => ( { name: f } ) )
    );
    uploadMiddleware( req, res, ( ) => {
      const body = _.cloneDeep( req.body );

      // Not sure what this was doing, but removing blank params makes it
      // impossible to remove individual attributes ~~~ kueda 20210513
      // // for other formData parameters in the multipart request, if the value is
      // // en empty string, remove it from the request body. The coercer does this
      // // for JSON requests but not for multipart requests
      // _.each( originalBody, ( v, k ) => {
      //   if ( _.isObject( v ) ) {
      //     newBody[k] = { };
      //     _.each( v, ( vv, kk ) => {
      //       if ( vv !== "" ) {
      //         newBody[k][kk] = vv;
      //       }
      //     } );
      //   } else {
      //     newBody[k] = v;
      //   }
      // } );

      // multer puts files in a `files` attribute, but we need them in the body
      if ( req.files ) {
        _.each( knownUploadFields, f => {
          body[f] = req.files[f];
        } );
      }

      // reset the body to include files and remove empty fields
      req.body = body;
      coercer.coerce( req );
      next( );
    } );
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
  static applyMethodOverrideMiddleware = inaturalistAPIExpressApp => {
    inaturalistAPIExpressApp.use( ( req, res, next ) => {
      const methodOverride = req.header( "X-HTTP-Method-Override" );
      if ( req.method === "POST" && methodOverride === "GET" && initializedOpenapi ) {
        const basePathRegex = new RegExp( "^/v2" );
        const apiPath = req.path.replace( basePathRegex, "" );
        let apiMethod = initializedOpenapi.apiDoc.paths[apiPath];
        const paths = _.keys( initializedOpenapi.apiDoc.paths );
        for ( let i = 0; i < paths.length; i += 1 ) {
          const knownPath = paths[i];
          // This is admittedly crude: assumes the URL exactly matches the route pattern
          const pathRegex = new RegExp( `^${knownPath.replace( /\{.+?\}/, ".+?" )}$` );
          if ( pathRegex.test( apiPath ) ) {
            apiMethod = initializedOpenapi.apiDoc.paths[knownPath];
            break;
          }
        }
        if ( apiMethod ) {
          let allowsOverride = false;
          if ( apiMethod.get ) {
            allowsOverride = _.find( apiMethod.get.parameters, p => (
              p.name === "X-HTTP-Method-Override" && p.in === "header"
            ) );
          }
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
  };

  // If a schema looks like one of our custom schemas, return the custom schema.
  // Otherwise return the schema that was passed in
  static resolveSchema = ( req, schema ) => {
    const schemaRef = schema.$ref;
    if ( schemaRef && schemaRef.match( /#\/components\/schemas\// ) ) {
      const schemaName = schemaRef.replace( "#/components/schemas/", "" );
      return req.apiDoc.components.schemas[schemaName];
    }
    return schema;
  };

  // Extract the requested response fields
  static requestFields = req => {
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
      } catch {
        // ignore parse failures
      }
      const fieldsStringMatch = fields.match( /^[a-z_]+(,[a-z_]+)*$/ );
      if ( fieldsStringMatch ) {
        // fields might be a comma-delimited string, if so split and return as array
        return fields.split( "," );
      }
      return false;
    }
    return null;
  };

  static responseItemSchema = req => {
    if ( req.operationDoc
      && req.operationDoc.responses["200"]
      && req.operationDoc.responses["200"].content
      && req.operationDoc.responses["200"].content["application/json"]
      && req.operationDoc.responses["200"].content["application/json"].schema
    ) {
      const responseSchema = InaturalistAPIV2.resolveSchema( req,
        req.operationDoc.responses["200"].content["application/json"].schema );
      if ( responseSchema.properties
        && responseSchema.properties.results
        && responseSchema.properties.results.items
      ) {
        return InaturalistAPIV2.resolveSchema( req, responseSchema.properties.results );
      }
    }
    return null;
  };


  // These methods take the requested fields, select the ones that match the
  // schema definition for the endpoint that was hit, and return only those
  // fields. The two methods refer to each other, so we need to define a stub
  // first.
  // let applyFieldSelectionToItem = ( ) => { };
  static applyFieldSelectionToObject = ( req, item, fieldsRequested, itemSchema ) => {
    let fieldsToReturn = { };
    // Make sure we always return required fields
    _.each( itemSchema.required, k => {
      fieldsToReturn[k] = true;
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
        const propertySchema = InaturalistAPIV2.resolveSchema( req, v );
        prunedItem[k] = InaturalistAPIV2.applyFieldSelectionToItem( req,
          item[k], { all: true }, propertySchema );
      } );
    } else {
      // loop through the requested fields
      _.each( fieldsToReturn, ( v, k ) => {
        // the root item has the field, and is in the root item definition
        const fieldSchema = itemSchema.properties[k];
        if ( item[k] !== undefined && fieldSchema ) {
          const propertySchema = InaturalistAPIV2.resolveSchema( req, fieldSchema );
          prunedItem[k] = InaturalistAPIV2.applyFieldSelectionToItem( req,
            item[k], v, propertySchema );
        }
      } );
    }
    return prunedItem;
  };

  static applyFieldSelectionToItem = ( req, item, fields, itemSchema ) => {
    if ( itemSchema.type === "array" && _.isArray( item ) ) {
      item = _.map( item, i => InaturalistAPIV2.applyFieldSelectionToItem(
        req, i, fields, InaturalistAPIV2.resolveSchema( req, itemSchema.items )
      ) );
    } else if ( itemSchema.type === "object" && _.isObject( item ) ) {
      item = InaturalistAPIV2.applyFieldSelectionToObject( req, item, fields, itemSchema );
    }
    return item;
  };

  static validationOverrideForExpressMethod = ( req, res, method ) => {
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
        const fields = InaturalistAPIV2.requestFields( req );
        if ( fields === false ) {
          res.set( "x-express-openapi-validated", true );
          const error = new Error( "invalid fields parameter" );
          error.status = 422;
          return InaturalistAPIV2.sendWrapper( req, res, error );
        }
        if ( fields !== "all" ) {
          body.results = InaturalistAPIV2.applyFieldSelectionToItem( req,
            body.results, fields, itemSchema );
        }
      }

      let validation = res.validateResponse( res.statusCode, body );
      let validationMessage;
      if ( validation === undefined ) {
        validation = { message: undefined, errors: undefined };
      }
      // console.log([res.statusCode, body])
      if ( validation.errors ) {
        const errorList = Array.from( validation.errors ).map( e => e.message ).join( "," );
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

  static validateAllResponses = ( req, res, next ) => {
    if ( typeof res.validateResponse === "function" ) {
      // if we want to validate responses, override the express return methods
      // we might use to first validate response bodies and return a failure
      // if the response format is invalid. Otherwise use the standard express
      // return method
      InaturalistAPIV2.validationOverrideForExpressMethod( req, res, "send" );
      InaturalistAPIV2.validationOverrideForExpressMethod( req, res, "jsonp" );
    }
    next( );
  };

  static userJwtValidate = ( req, required ) => {
    if ( !req.headers.authorization ) {
      if ( required === "required" ) {
        throw jwtMissingError;
      }
      return Promise.resolve( true );
    }
    const token = _.last( req.headers.authorization.split( /\s+/ ) );
    return jwt.verify( token, config.jwtSecret || "secret",
      { algorithms: ["HS512"] }, ( err, payload ) => {
        if ( required === "required" && err ) throw jwtInvalidError;
        if ( payload && payload.user_id ) {
          req.userSession = payload;
        }
        return Promise.resolve( true );
      } );
  }

  static applicationJwtValidate = ( req, required ) => {
    if ( !req.headers.authorization ) {
      if ( required === "required" ) {
        throw jwtMissingError;
      }
      return Promise.resolve( true );
    }
    const token = _.last( req.headers.authorization.split( /\s+/ ) );
    return jwt.verify( token, config.jwtApplicationSecret || "secret",
      { algorithms: ["HS512"] }, ( err, payload ) => {
        if ( required === "required" && err ) throw jwtInvalidError;
        if ( payload && payload.application ) {
          req.applicationSession = payload;
        }
        return Promise.resolve( true );
      } );
  }

  static initializeOpenapi = inaturalistAPIExpressApp => {
    // method override middleware must be defined before initializing openapi
    InaturalistAPIV2.applyMethodOverrideMiddleware( inaturalistAPIExpressApp );

    initializedOpenapi = initialize( {
      app: inaturalistAPIExpressApp,
      docPath: "api-docs",
      apiDoc: {
        ...v2ApiDoc,
        "x-express-openapi-additional-middleware": [InaturalistAPIV2.validateAllResponses],
        "x-express-openapi-validation-strict": true
      },
      enableObjectCoercion: true,
      dependencies: {
        sendWrapper: InaturalistAPIV2.sendWrapper
      },
      securityFilter: ( req, res ) => {
        // remove x-express-* attributes which don't need to be in the official documentation
        res.status( 200 ).json( _.pickBy( req.apiDoc, ( value, key ) => !key.match( /^x-/ ) ) );
      },
      paths: "./openapi/paths/v2",
      promiseMode: true,
      securityHandlers: {
        userJwtRequired: req => InaturalistAPIV2.userJwtValidate( req, "required" ).then( ( ) => {
          if ( req.userSession ) {
            return Promise.resolve( true );
          }
          const jwtMissingUserError = new Error( "JWT does not specify a user" );
          jwtMissingUserError.status = 401;
          throw jwtMissingUserError;
        } ).catch( err => {
          throw err;
        } ),
        userJwtOptional: req => InaturalistAPIV2.userJwtValidate( req ).catch( err => {
          throw err;
        } ),
        appOrUserJwtRequired: req => InaturalistAPIV2.userJwtValidate( req )
          .then( ( ) => InaturalistAPIV2.applicationJwtValidate( req ) )
          .then( ( ) => {
            if ( req.userSession || req.applicationSession ) {
              return Promise.resolve( true );
            }
            const jwtMissingContextError = new Error( "JWT does not specify an application or a user" );
            jwtMissingContextError.status = 401;
            throw jwtMissingContextError;
          } ).catch( err => {
            throw err;
          } )
      },
      consumesMiddleware: {
        // TODO: custom coercion for JSON bodies?
        "multipart/form-data": InaturalistAPIV2.multipartMiddleware
      },
      errorMiddleware: InaturalistAPIV2.errorMiddleware
    } );

    inaturalistAPIExpressApp.get( "/v2/", ( req, res ) => res.redirect( "/v2/docs" ) );

    const swaggerOptions = {
      customSiteTitle: "iNaturalist API",
      customfavIcon: "/favicon.ico"
    };
    // Filter out endpoints from that work but that we are not committed to
    // maintaining or supporting from visible documentation. Note that
    // functionality like this does not seem to be a part of the OpenAPI spec,
    // but is under consideration:
    // https://github.com/OAI/OpenAPI-Specification/issues/433. Also note that I
    // think this is a pretty crude solution to the problem of treating the API
    // docs as a commitment to API consumers that we support all documented
    // functionality for the life of this version. I think I'd prefer that we
    // could somehow annotate some endpoints as private, annotate some as
    // "unsupported," or provide some kind of param that shows these private and
    // unsupported endpoints to people who are interested, like developers on
    // staff. ~~kueda 20200813
    const swaggerApiDoc = Object.assign( {}, initializedOpenapi.apiDoc, {
      paths: _.omitBy( initializedOpenapi.apiDoc.paths, ( pathConfig, path ) => path.match( /computervision/ ) ),
      tags: _.sortBy(
        _.omitBy( initializedOpenapi.apiDoc.tags, tag => tag.name.match( /Computer Vision/ ) ),
        tag => tag.name
      ),
      components: Object.assign( {}, initializedOpenapi.apiDoc.components, {
        schemas: _.omitBy(
          initializedOpenapi.apiDoc.components.schemas,
          ( schema, schemaName ) => schemaName.match( /vision/i )
        )
      } )
    } );
    const swaggerUIMiddleware = swaggerUi.setup( swaggerApiDoc, swaggerOptions );
    // temporary fix for swaggerUI loading issues
    // See https://github.com/scottie1984/swagger-ui-express/issues/178
    swaggerUIMiddleware( { }, { send: ( ) => { } }, ( ) => { } );
    inaturalistAPIExpressApp.use( "/v2/docs", swaggerUi.serve, swaggerUIMiddleware );
  };
};

module.exports = InaturalistAPIV2;
