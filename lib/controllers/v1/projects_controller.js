var _ = require( "underscore" ),
    esClient = require( "../../es_client" ),
    InaturalistAPI = require( "../../inaturalist_api" ),
    Project = require( "../../models/project" ),
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

ProjectsController.members = function( req, callback ) {
  InaturalistAPI.setPerPage( req, { default: 30, max: 100 } );
  req.query.page = Number( req.query.page ) || 1;
  if( req.query.page < 1 ) {
    req.query.page = 1;
  }
  Project.findByID( req.params.id, function( err, obj ) {
    if( err ) { return callback( err ); }
    if( obj ) {
      obj.members( req.query, function( err, members ) {
        if( err ) { return callback( err ); }
        var total = ( members.length > 0 ) ? Number( members[ 0 ].total_count ) : 0;
        InaturalistAPI.resultsHash({
          total: total,
          per_page: req.query.per_page,
          page: req.query.page,
          results: _.map( members, function( m ) {
            return _.omit( m, "total_count" );
          })
        }, callback )
      })
    } else {
      return callback({ error: "Unknown project_id", status: 422 });
    }
  });
};

module.exports = {
  show: ProjectsController.show,
  autocomplete: ProjectsController.autocomplete,
  members: ProjectsController.members
};
