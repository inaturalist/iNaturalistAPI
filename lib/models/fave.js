var _ = require( "underscore" ),
    Fave = { };

Fave = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

Fave.modelName = "fave";
Fave.modelNamePlural = "faves";
Fave.tableName = "votes";
Fave.returnFields = [
  "id", "voter_id user_id", "votable_id", "created_at" ];

module.exports = Fave;
