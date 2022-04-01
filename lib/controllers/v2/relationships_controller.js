const ctrlv1 = require( "../v1/relationships_controller" );

// const show = async req => {
//   if ( req.params.id && typeof ( req.params.id ) !== "string" ) {
//     req.params.id = req.params.id.join( "," );
//   }
//   return ctrlv1.show( req );
// };

const create = async req => {
  const relationship = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [relationship]
  };
};

const update = async req => {
  const relationship = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [relationship]
  };
};

module.exports = {
  index: ctrlv1.index,
  create,
  update,
  delete: ctrlv1.delete
};
