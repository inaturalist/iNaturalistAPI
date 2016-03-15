"use strict";
var Model = require( "./model" );

var Identification = class Identification extends Model { };

Identification.modelName = "identification";
Identification.tableName = "identifications";
Identification.returnFields = [
  "id", "observation_id", "taxon_id", "user_id", "body",
  "created_at", "updated_at", "current" ];

module.exports = Identification;
