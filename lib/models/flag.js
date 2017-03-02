"use strict";
var Model = require( "./model" );

var Flag = class Flag extends Model { };

Flag.modelName = "flag";
Flag.modelNamePlural = "flags";
Flag.tableName = "flags";
Flag.returnFields = [
  "id", "flaggable_id", "flaggable_type", "flag", "created_at", "user_id" ];
Flag.defaultDBClause = "resolved IS NOT NULL";

module.exports = Flag;
