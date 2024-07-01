const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  rails: Joi.object( ).keys( {
    git_branch: Joi.string( ),
    git_commit: Joi.string( ),
    image_tag: Joi.string( ),
    build_date: Joi.string( )
  } ),
  api: Joi.object( ).keys( {
    git_branch: Joi.string( ),
    git_commit: Joi.string( ),
    image_tag: Joi.string( ),
    build_date: Joi.string( )
  } ),
  vision: Joi.object( ).keys( {
    git_branch: Joi.string( ),
    git_commit: Joi.string( ),
    image_tag: Joi.string( ),
    build_date: Joi.string( )
  } )
} ).unknown( false );
