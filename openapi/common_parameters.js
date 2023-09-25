const _ = require( "lodash" );
const Joi = require( "joi" );
const transform = require( "./joi_to_openapi_parameter" );

const Params = { };

Params.zoom = Joi.number( ).integer( )
  .min( 0 )
  .max( 21 )
  .label( "zoom" )
  .meta( { in: "path" } )
  .required( );
Params.x = Joi.number( ).integer( )
  .min( 0 )
  .label( "x" )
  .meta( { in: "path" } )
  .required( );
Params.y = Joi.number( ).integer( )
  .min( 0 )
  .label( "y" )
  .meta( { in: "path" } )
  .required( );
Params.tile_size = Joi.number( ).integer( )
  .valid(
    256,
    512
  )
  .label( "tile_size" )
  .meta( { in: "query" } );

Params.tilePathParams = _.map( [
  Params.zoom,
  Params.x,
  Params.y,
  Params.tile_size
], transform );

module.exports = Params;
