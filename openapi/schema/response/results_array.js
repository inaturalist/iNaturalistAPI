const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  total_results: Joi.number( ).integer( ).required( ).meta( { className: "total_results" } ),
  page: Joi.number( ).integer( ).required( ).meta( { className: "page" } ),
  per_page: Joi.number( ).integer( ).required( ).meta( { className: "per_page" } ),
  results: Joi.array( )
} ).unknown( false );
