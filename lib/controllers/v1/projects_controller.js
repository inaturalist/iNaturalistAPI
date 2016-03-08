var _ = require( "underscore" ),
    esClient = require( "../../es_client" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    ProjectsController = { };

ProjectsController.returnFields = [ "id", "title", "description", "slug" ];

ProjectsController.autocomplete = function( req, callback ) {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  var filters = [ ];
  if( !req.query.q ) {
    return InaturalistAPI.basicResponse( null, req, null, callback );
  }
  var wheres = { bool: { should: [
    { term: { slug: req.query.q } },
    { match: { title_autocomplete: { query: req.query.q, operator: "and" } } },
    { match: { title: { query: req.query.q, operator: "and" } } }
  ] } };
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
    body: {
      query: {
        bool: {
          must: wheres,
          filter: filters
        }
      },
      _source: ProjectsController.returnFields,
      size: req.query.per_page
    }
  }, function( err, response ) {
    InaturalistAPI.basicResponse( err, req, response, callback );
  });
};

ProjectsController.show = function( req, callback ) {
  InaturalistAPI.setPerPage( req, { default: 10, max: 100 } );
  var ids = _.filter( req.params.id.split(","), _.identity );
  if( ids.length > req.query.per_page ) {
    return callback({ error: "Too many IDs", status: 422 });
  }
  esClient.connection.search({
    preference: global.config.elasticsearch.preference || "_local",
    index: ( process.env.NODE_ENV || global.config.environment ) + "_projects",
    body: {
      sort: { id: "desc" },
      query: {
        filtered: {
          filter: [ { terms: { id: ids } } ]
        }
      },
      _source: ProjectsController.returnFields
    }
  }, function( err, response ) {
    InaturalistAPI.basicResponse( err, req, response, callback );
  });
};

module.exports = {
  show: ProjectsController.show,
  autocomplete: ProjectsController.autocomplete
};
