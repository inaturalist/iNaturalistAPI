const _ = require( "lodash" );
const esClient = require( "../../es_client" );
const Place = require( "../../models/place" );
const Project = require( "../../models/project" );
const Taxon = require( "../../models/taxon" );
const User = require( "../../models/user" );
const util = require( "../../util" );
const InaturalistAPI = require( "../../inaturalist_api" );
const TaxaController = require( "./taxa_controller" );
const ElasticQueryBuilder = require( "../../elastic_query_builder" );

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
  const q = req.query ? req.query.q : "";

  if ( _.isEmpty( q ) ) {
    return InaturalistAPI.basicResponse( req );
  }
  const { page, perPage } = InaturalistAPI.paginationData( req );
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
  const filters = [
    { exists: { field: "id" } }
  ];
  if ( req.query && req.query.place_id ) {
    filters.push( {
      terms: { associated_place_ids: [req.query.place_id] }
    } );
  }
  const body = ElasticQueryBuilder.buildQuery( {
    q,
    sources,
    page,
    perPage,
    req,
    mustNot,
    filters,
    useFunctionScore: true,
    highlight: {
      fields: {
        "names.exact_ci": { },
        "*_autocomplete": { },
        description: { }
      }
    }
  } );
  const response = await esClient.search( sources, { body } );
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
  if ( req.query.include_taxon_ancestors && req.query.include_taxon_ancestors !== "false" ) {
    await TaxaController.assignAncestors(
      req,
      _.map( _.filter( results, r => r.type === "Taxon" ), "record" ),
      { localeOpts }
    );
  }
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
