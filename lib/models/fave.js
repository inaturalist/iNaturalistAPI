"use strict";
var Model = require( "./model" );

var Fave = class Fave extends Model { };

Fave.modelName = "fave";
Fave.modelNamePlural = "faves";
Fave.tableName = "votes";
Fave.returnFields = [
  "id", "voter_id user_id", "votable_id", "created_at" ];

module.exports = Fave;
