var _ = require( "underscore" ),
    Identification = { };

Identification = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

Identification.modelName = "identification";
Identification.tableName = "identifications";
Identification.returnFields = [
  "id", "observation_id", "taxon_id", "user_id", "body",
  "created_at", "updated_at", "current" ];

module.exports = Identification;
