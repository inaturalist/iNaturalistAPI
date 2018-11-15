const Model = require( "./model" );

const ObservationField = class ObservationField extends Model { };

ObservationField.modelName = "observation_field";
ObservationField.indexName = "observation_fields";
ObservationField.tableName = "observation_fields";

module.exports = ObservationField;
