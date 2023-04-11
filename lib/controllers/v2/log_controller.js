const create = async req => {
  if ( req.body.level === "error" ) {
    req._logClientError = true;
    req.body.error_message = req.body.message;
  } else {
    req._logClientMessage = true;
  }
};

module.exports = {
  create
};
