const { observation_field_values } = require( "inaturalistjs" ); // eslint-disable-line camelcase
const InaturalistAPI = require( "../../inaturalist_api" );

const ObservationFieldValuesController = class ObservationFieldValuesController {
  static create( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.create, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static update( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.update, req )
      .then( r => callback( null, r ) ).catch( callback );
  }

  static delete( req, callback ) {
    InaturalistAPI.iNatJSWrap( observation_field_values.delete, req )
      .then( r => callback( null, r ) ).catch( callback );
  }
};

module.exports = ObservationFieldValuesController;
