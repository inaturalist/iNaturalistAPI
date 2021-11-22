const Joi = require( "joi" );

const polygon = Joi.array( ).items(
  Joi.array( ).items(
    Joi.array( ).length( 2 ).items(
      Joi.number( )
    )
  )
);

const multiPolygon = Joi.array( ).items( polygon );

module.exports = Joi.object( ).keys( {
  coordinates: Joi.when( "type", {
    is: "Multipolygon",
    then: multiPolygon,
    otherwise: polygon
  } ).required( ),
  type: Joi.string( ).required( )
} )
  .unknown( false )
  .meta( { className: "PolygonGeoJson" } )
  .valid( null );
