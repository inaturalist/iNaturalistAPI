"use strict";
var _ = require( "lodash" ),
    esClient = require( "../../es_client" ),
    Place = require( "../../models/place" ),
    Project = require( "../../models/project" ),
    Taxon = require( "../../models/taxon" ),
    User = require( "../../models/user" ),
    SearchController = { };

SearchController.search = function( req, callback ) {
  var index = [
    "taxa",
    "places",
    "projects",
    "users"
  ].map( i => `${process.env.NODE_ENV || global.config.environment}_${i}` ).join( "," );
  const body = {
    size: 10,
    query: {
      multi_match: {
        query: req.query ? req.query.q : "",
        fields: ["*_autocomplete"],
        fuzziness : "AUTO",
        prefix_length : 2
      }
    }
  };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index,
    body
  }, ( err, response ) => {
    if ( err ) { return callback( err ); }
    const indexPrefix = `${process.env.NODE_ENV || global.config.environment}_`;
    const results = _.compact( _.map( response.hits.hits, h => {
      switch( h._index ) {
        case `${indexPrefix}taxa`:
          return new Taxon( Object.assign( { type: "Taxon" }, h._source ) );
          break;
        case `${indexPrefix}places`:
          return new Place( Object.assign( { type: "Place" }, h._source ) );
          break;
        case `${indexPrefix}users`:
          return new User( Object.assign( { type: "User" }, h._source ) );
          break;
        case `${indexPrefix}projects`:
          return new Project( Object.assign( { type: "Project" }, h._source ) );
          break;
        default:
          // do nothing
      }
    } ) );
    callback( null, {
      total_results: response.hits.total,
      results
    } );
  } );
};

module.exports = {
  search: SearchController.search
};
