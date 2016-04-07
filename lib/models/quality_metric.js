"use strict";
var Model = require( "./model" );

var QualityMetric = class QualityMetric extends Model { };

QualityMetric.modelName = "quality_metric";
QualityMetric.modelNamePlural = "quality_metrics";
QualityMetric.tableName = "quality_metrics";

module.exports = QualityMetric;
