"use strict";
var Model = require( "./model" );

var ControlledTerm = class ControlledTerm extends Model {

  constructor( attrs ) {
    super( attrs );
    this.label = this.labels ? this.labels[0].label : null;
    delete this.labels;
  }

};

ControlledTerm.modelName = "controlled_term";
ControlledTerm.indexName = "controlled_terms";
ControlledTerm.tableName = "controlled_terms";

module.exports = ControlledTerm;
