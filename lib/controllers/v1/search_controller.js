const _ = require( "lodash" );
const esClient = require( "../../es_client" );
const Place = require( "../../models/place" );
const Project = require( "../../models/project" );
const Taxon = require( "../../models/taxon" );
const User = require( "../../models/user" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );

const SearchController = { };

SearchController.search = async req => {
  let sources = [
    "taxa",
    "places",
    "projects",
    "users"
  ];
  if ( req.query && req.query.sources ) {
    if ( typeof ( req.query.sources ) === "string" ) {
      sources = _.intersection( sources, req.query.sources.split( "," ) );
    } else {
      sources = _.intersection( sources, req.query.sources );
    }
  }
  const index = sources
    .map( i => `${process.env.NODE_ENV || global.config.environment}_${i}` ).join( "," );
  const q = req.query ? req.query.q : "";
  if ( _.isEmpty( q ) ) {
    return InaturalistAPI.basicResponse( req );
  }
  const { page, perPage } = InaturalistAPI.paginationData( req );
  // Things that absolutely must be included
  const filter = [
    // Sometimes cruft piles up. We don't want to return it
    { exists: { field: "id" } }
  ];
  if ( req.query && req.query.place_id ) {
    filter.push( {
      terms: { associated_place_ids: [req.query.place_id] }
    } );
  }
  // Things that absolutely must NOT be included
  const mustNot = [
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
  ];
  // The interesting stuff
  const should = [
    // match _autocomplete fields across all indices
    {
      constant_score: {
        filter: {
          multi_match: {
            query: q,
            fields: ["*_autocomplete", "name"],
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
        filter: {
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
        boost: 2
      }
    },
    // boost exact matches in the taxa index
    {
      constant_score: {
        filter: {
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
        boost: 3
      }
    },
    // boost exact matches across the rest of the indices Note: this
    // isn't working perfectly. For one thing it matches more than
    // exact matches, e.g. when you search for "lepidopt" you get a
    // lot of projects about Lepidoptera. It also seems to score
    // projects with multuple mentions of lepidoptera in the desc
    // higher than the taxon Lepidoptera if you boost. Boost at 1 is
    // ok, but a better solution would be to actually do exact
    // matching and score docs equally regardless of term frequency.
    {
      constant_score: {
        filter: {
          multi_match: {
            query: q,
            fields: ["*_autocomplete", "description"],
            type: "phrase"
          }
        },
        boost: 1
      }
    }
  ];
  // Add the shoulds to the filter. Without this, the shoulds will operate only
  // in the query context and won't filter out non-matching documents, e.g. if
  // you search for "moth" you'll get back documents that do not contain the
  // word moth, and if they get a higher score due to higher obs count, they can
  // appear above more relevant matches
  filter.push( {
    bool: {
      should
    }
  } );
  const body = {
    from: ( perPage * page ) - perPage,
    size: perPage,
    query: {
      function_score: {
        query: {
          bool: {
            filter,
            must_not: mustNot,
            should
          }
        },
        field_value_factor: {
          field: "universal_search_rank",
          factor: 1,
          missing: 3,
          modifier: "log2p"
        },
        boost_mode: "sum"
      }
    }
  };
  const highlight = {
    fields: {
      "names.exact_ci": { },
      "*_autocomplete": { },
      description: { }
    }
  };
  if ( util.isJa( q ) ) {
    highlight.fields["names.name_ja"] = { };
  }
  body.highlight = highlight;
  const response = await esClient.connection.search( {
    preference: global.config.elasticsearch.preference,
    index,
    body
  } );
  const indexPrefix = `${process.env.NODE_ENV || global.config.environment}_`;
  const localeOpts = util.localeOpts( req );
  const results = _.compact( _.map( response.hits.hits, h => {
    const score = h._score;
    let matches;
    if ( body.highlight && h.highlight ) {
      const highlighted = h.highlight[_.keys( h.highlight )[0]];
      h._source.matched_term = highlighted[0].replace( /<\/?em>/g, "" );
      matches = _.compact(
        _.uniq(
          _.flattenDeep(
            _.map( h.highlight, values => _.map( values, v => {
              let m;
              const re = /<em>(.+?)<\/em>/gmi;
              const pieces = [];
              do {
                m = re.exec( v );
                if ( m ) {
                  pieces.push( m.slice( 1, m.length ) );
                }
              } while ( m );
              return pieces;
            } ) )
          )
        )
      );
    }
    // When using Elasticsearch index aliases, the original index name is
    // returned in _index, so use a string match instead of equality here
    if ( _.includes( h._index, "taxa" ) ) {
      const t = new Taxon( h._source );
      t.prepareForResponse( localeOpts );
      return {
        score,
        type: "Taxon",
        matches,
        record: t
      };
    }
    if ( _.includes( h._index, "places" ) ) {
      return {
        score,
        type: "Place",
        matches,
        record: new Place( h._source )
      };
    }
    if ( _.includes( h._index, "users" ) ) {
      return {
        score,
        type: "User",
        matches,
        record: new User( h._source )
      };
    }
    if ( _.includes( h._index, "projects" ) ) {
      return {
        score,
        type: "Project",
        matches,
        record: new Project( h._source )
      };
    }
    return null;
  } ) );
  return {
    total_results: response.hits.total.value,
    page,
    per_page: perPage,
    results
  };
};

module.exports = {
  search: SearchController.search
};
