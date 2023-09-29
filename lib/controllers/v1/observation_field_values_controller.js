const { observation_field_values: observationFieldValues } = require( "inaturalistjs" );
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationFieldValuesController = class ObservationFieldValuesController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( observationFieldValues.create, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observationFieldValues.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observationFieldValues.delete, req );
  }
};

module.exports = ObservationFieldValuesController;
