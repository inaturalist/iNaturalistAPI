var _ = require( "underscore" ),
    esClient = require( "../es_client" ),
    Model = require( "./model" ),
    ESModel = { };

ESModel.fetchBelongsTo = function( objects, model, modifier, callback ) {
  var resultsHash = { };
  var ids = Model.belongsToIDs( objects, model );
  if( !ids ) { return callback( ); }
  esClient.search( model.tableName,
    { body: { query: { terms: { id: ids } }, size: ids.length } },
    function( err, results ) {
      if( err ) { return callback( err ); }
      _.each( results.hits.hits, function( h ) {
        resultsHash[ h._source.id ] = h._source;
      });
      Model.injectBelongsTo( objects, model, resultsHash, modifier );
      callback( );
  });
};

module.exports = ESModel;
