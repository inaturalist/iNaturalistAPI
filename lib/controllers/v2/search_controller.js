const _ = require( "lodash" );
const ctrlv1 = require( "../v1/search_controller" );

const search = async req => {
  const v1Response = await ctrlv1.search( req );
  _.each( v1Response.results, result => {
    const { type } = result;
    result[_.snakeCase( type )] = result.record;
    result.type = _.snakeCase( type );
    delete result.record;
  } );
  return v1Response;
};

module.exports = {
  search
};
