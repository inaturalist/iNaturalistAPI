// This doesn't entirely replicate Joi's boolean type, e.g. support for
// truthy(), but it does assume the strings "true" and "false" are valid boolean
// parameters as Joi does by default. It will *not* perform conversion to
// boolean values, though. ~~ kueda 2020-03-23

module.exports = ( ) => ( {
  enum: ["true", "false"]
} );
