const Joi = require( "@hapi/joi" );

module.exports = Joi.object( ).keys( {
  coordinates: Joi.array( ).length( 2 ).items( Joi.number( ) ).required( ),
  type: Joi.string( ).required( )
} )
  .unknown( false )
  .meta( { className: "GeoJson" } )
  .valid( null );
