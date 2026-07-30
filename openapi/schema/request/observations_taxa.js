const _ = require( "lodash" );
const Joi = require( "joi" );
const observationsSearchSchema = require( "./observations_search" );

const nonUserIDKeys = _.omit( observationsSearchSchema.describe().keys, "user_id" );
const nonUserIDSchema = _.fromPairs(
  _.map( nonUserIDKeys, ( value, key ) => [key, observationsSearchSchema.extract( key )] )
);

module.exports = Joi.object( {
  user_id: observationsSearchSchema.extract( "user_id" ).required( ),
  ...nonUserIDSchema
} );
