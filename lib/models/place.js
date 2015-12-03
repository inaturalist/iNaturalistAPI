var _ = require( "underscore" ),
    pgClient = require( "../pg_client" ),
    Place = { };

Place = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

module.exports = Place;
