const ctrlv1 = require( "../v1/comments_controller" );
const {Translate} = require('@google-cloud/translate').v2;
const config = require( "../../../config" );

const create = async req => {
  const comment = await ctrlv1.create( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [comment]
  };
};

const update = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  delete req.params.uuid;
  const comment = await ctrlv1.update( req );
  return {
    page: 1,
    per_page: 1,
    total_results: 1,
    results: [comment]
  };
};

// delete is a reserved word and you can't declare a method with that name in a
// module
const destroy = async req => {
  const { uuid } = req.params;
  req.params.id = uuid;
  delete req.params.uuid;
  return ctrlv1.delete( req );
};

const translate = async req => {
  const text = req.body.comment.body;
  const target = req.body.comment.target;
  const googleTranslate = new Translate({
    projectId: config.googleTranslate.projectId,
    key: config.googleTranslate.key,
  });
  let googleResult = await googleTranslate.translate(text, target);
  let translation = googleResult[1].data.translations[0].translatedText
  return {
    translation: translation
  };
};

module.exports = {
  create,
  update,
  delete: destroy,
  translate
};
