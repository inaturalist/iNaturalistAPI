"use strict";
var _ = require( "lodash" ),
    esClient = require( "../../es_client" ),
    Place = require( "../../models/place" ),
    Project = require( "../../models/project" ),
    Taxon = require( "../../models/taxon" ),
    User = require( "../../models/user" ),
    util = require( "../../util" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    SearchController = { };

SearchController.search = function( req, callback ) {
  let sources = [
    "taxa",
    "places",
    "projects",
    "users"
  ];
  if ( req.query && req.query.sources ) {
    sources = _.intersection( sources, req.query.sources.split( "," ) );
  }
  const index = sources.map( i => `${process.env.NODE_ENV || global.config.environment}_${i}` ).join( "," );
  const q = req.query ? req.query.q : "";
  if ( _.isEmpty( q ) ) {
    return InaturalistAPI.basicResponse( null, req, null, callback );
  }
  const { page, perPage } = InaturalistAPI.paginationData( req );
  const body = {
    from: ( perPage * page ) - perPage,
    size: perPage,
    query: {
      function_score: {
        query: {
          bool: {
            must_not: [
              {
                term: {
                  is_active: false
                }
              },
              {
                term: {
                  spam: true
                }
              },
              {
                term: {
                  suspended: true
                }
              }
            ],
            should: [
              // match _autocomplete fields across all indices
              {
                constant_score: {
                  query: {
                    multi_match: {
                      query: q,
                      fields: ["*_autocomplete"],
                      fuzziness: "AUTO",
                      prefix_length: 5,
                      max_expansions: 2,
                      operator: "and"
                    }
                  },
                  boost: 1
                }
              },
              // match the nested name_autocomplete field in the taxa index
              {
                constant_score: {
                  query: {
                    nested: {
                      path: "names",
                      ignore_unmapped: true,
                      query: {
                        match: {
                          "names.name_autocomplete": {
                            fuzziness: "AUTO",
                            prefix_length: 5,
                            query: q,
                            operator: "and"
                          }
                        }
                      }
                    }
                  },
                  boost: 1
                }
              },
              // boost exact matches in the taxa index
              {
                constant_score: {
                  query: {
                    nested: {
                      path: "names",
                      ignore_unmapped: true,
                      query: {
                        match: {
                          "names.exact_ci": {
                            query: q
                          }
                        }
                      }
                    }
                  },
                  boost: 2
                }
              },
              // boost exact matches across the rest of the indices
              {
                constant_score: {
                  query: {
                    multi_match: {
                      query: q,
                      fields: ["*_autocomplete", "description"],
                      type: "phrase"
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
  const highlight = { fields: { "names.exact_ci": { }, "names.name_autocomplete": { } } };
  if( util.is_ja( q ) ) {
    highlight.fields[ "names.name_ja" ] = { };
  }
  body.highlight = highlight;
  esClient.connection.search({
    preference: global.config.elasticsearch.preference,
    index,
    body
  }, ( err, response ) => {
    if ( err ) { return callback( err ); }
    const indexPrefix = `${process.env.NODE_ENV || global.config.environment}_`;
    const localeOpts = util.localeOpts( req );
    const results = _.compact( _.map( response.hits.hits, h => {
      const score = h._score;
      if( body.highlight && h.highlight ) {
        var highlighted = h.highlight[ _.keys( h.highlight )[0] ];
        h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      }
      switch( h._index ) {
        case `${indexPrefix}taxa`: {
          const t = new Taxon( h._source );
          t.prepareForResponse( localeOpts );
          return {
            score,
            type: "Taxon",
            record: t
          };
        }
        case `${indexPrefix}places`:
          return {
            score,
            type: "Place",
            record: new Place(  h._source )
          };
        case `${indexPrefix}users`:
          return {
            score,
            type: "User",
            record: new User( h._source )
          };
        case `${indexPrefix}projects`:
          return {
            score,
            type: "Project",
            record: new Project( h._source )
          };
        default:
          // do nothing
      }
    } ) );
    callback( null, {
      total_results: response.hits.total,
      page,
      per_page: perPage,
      results
    } );
  } );
};

module.exports = {
  search: SearchController.search
};
