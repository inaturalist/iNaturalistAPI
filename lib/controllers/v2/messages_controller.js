const ctrlv1 = require( "../v1/messages_controller" );

const show = async req => {
  const response = await ctrlv1.show( req );
  delete response.reply_to_user;
  return response;
};

const create = async req => {
  const message = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [message]
  };
};

module.exports = {
  index: ctrlv1.index,
  show,
  create
};
