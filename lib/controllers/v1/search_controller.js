"use strict";
var _ = require( "lodash" ),
    esClient = require( "../../es_client" ),
    Place = require( "../../models/place" ),
    Project = require( "../../models/project" ),
    Taxon = require( "../../models/taxon" ),
    User = require( "../../models/user" ),
    nodeUtil = require('util'),
    util = require( "../../util" ),
    SearchController = { };

SearchController.search = function( req, callback ) {
  var index = [
    "taxa",
    "places",
    "projects",
    "users"
  ].map( i => `${process.env.NODE_ENV || global.config.environment}_${i}` ).join( "," );
  const q = req.query ? req.query.q : "";
  const body = {
    size: 10,
    query: {
      function_score: {
        query: {
          bool: {
            should: [
              {
                constant_score: {
                  query: {
                    multi_match: {
                      query: q,
                      fields: ["*_autocomplete"],
                      fuzziness : "AUTO",
                      prefix_length : 2
                    }
                  },
                  boost: 1
                }
              },
              {
                constant_score: {
                  query: {
                    nested: {
                      path: "names",
                      ignore_unmapped: true,
                      query: {
                        match: {
                          "names.name_autocomplete": {
                            query: q,
                            operator: "and"
                          }
                        }
                      }
                    }
                  },
                  boost: 2
                }
              }
            ]
          }
        },
        field_value_factor: {
          field: "observations_count",
          factor: 1,
          missing: 3,
          modifier: "log2p"
        },
        boost_mode: "sum"
      }
    }
  };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index,
    body
  }, ( err, response ) => {
    if ( err ) { return callback( err ); }
    const maxScore = response.hits.max_score;
    const indexPrefix = `${process.env.NODE_ENV || global.config.environment}_`;
    const localeOpts = util.localeOpts( req );
    const results = _.compact( _.map( response.hits.hits, h => {
      const score = h._score;
      switch( h._index ) {
        case `${indexPrefix}taxa`:
          const t = new Taxon( h._source );
          t.prepareForResponse( localeOpts );
          return {
            score,
            type: "Taxon",
            record: t
          };
          break;
        case `${indexPrefix}places`:
          return {
            score,
            type: "Place",
            record: new Place(  h._source )
          };
          break;
        case `${indexPrefix}users`:
          return {
            score,
            type: "User",
            record: new User( h._source )
          };
          break;
        case `${indexPrefix}projects`:
          return {
            score,
            type: "Project",
            record: new Project( h._source )
          };
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
