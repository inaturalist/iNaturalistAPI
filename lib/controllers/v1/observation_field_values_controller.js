const { observation_field_values } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationFieldValuesController = class ObservationFieldValuesController {
  static async create( req ) {
    return InaturalistAPI.iNatJSWrap( observation_field_values.create, req );
  }

  static async update( req ) {
    return InaturalistAPI.iNatJSWrap( observation_field_values.update, req );
  }

  static async delete( req ) {
    return InaturalistAPI.iNatJSWrap( observation_field_values.delete, req );
  }
};

module.exports = ObservationFieldValuesController;
