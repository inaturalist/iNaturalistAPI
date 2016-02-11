var _ = require( "underscore" ),
    squel = require( "squel" ),
    memoryCache = require( "memory-cache" ),
    moment = require( "moment" ),
    pgClient = require( "../pg_client" ),
    Project = { };

Project = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

Project.prototype.searchParams = function( callback ) {
  var params = { };
  var project = this;
  project.prefersRangeByDate( function( err, prefersDate ) {
    project.projectList( function( err, list ) {
      project.observationRules( function( err, rules ) {
        if( project.start_time && project.end_time ) {
          if( prefersDate === true ) {
            params.d1 = moment.utc( project.start_time ).format( "YYYY-MM-DD" );
            params.d2 = moment.utc( project.end_time ).format( "YYYY-MM-DD" );
          } else {
            params.d1 = moment.utc( project.start_time ).format( );
            params.d2 = moment.utc( project.end_time ).format( );
          }
        }
        var taxonIDs = [ ];
        var placeIDs = [ project.place_id ];
        _.each( rules, function( rule ) {
          switch( rule.operator ) {
            case "in_taxon?":
              taxonIDs.push( rule.operand_id );
              break;
            case "observed_in_place?":
              placeIDs.push( rule.operand_id );
              break;
            case "on_list?":
              if( list ) { params.list_id = list.id; }
              break;
            case "identified?":
              params.identified = "true";
              break;
            case "georeferenced?":
              params.has = params.has || [ ];
              params.has.push( "geo" );
              break;
            case "has_a_photo?":
              params.has = params.has || [ ];
              params.has.push( "photos" );
              break;
            case "has_a_sound?":
              params.has = params.has || [ ];
              params.has.push( "sounds" );
              break;
            case "captive?":
              params.captive = "true";
              break;
            case "wild?":
              params.captive = "false";
              break;
          }
        });
        taxonIDs = _.compact( _.uniq( taxonIDs ) );
        placeIDs = _.compact( _.uniq( placeIDs ) );
        if( taxonIDs.length > 0 ) {
          params.taxon_ids = taxonIDs;
        }
        if( placeIDs.length > 0 ) {
          params.place_id = placeIDs;
        }
        callback( null, params );
      });
    });
  });
};

Project.prototype.prefersRangeByDate = function( callback ) {
  if( !_.isUndefined( this.date_range_preference ) ) {
    return callback( null, this.date_range_preference );
  }
  var query = squel.select( ).field( "id ").from( "preferences" ).
    where( "owner_id = ? AND owner_type = 'Project'", this.id ).
    where( "name = 'range_by_date' AND value = 't'" ).
    limit( 1 );
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      this.date_range_preference = ( result.rows.length > 0 );
      callback( null, this.date_range_preference );
    }
  );
};

Project.prototype.projectList = function( callback ) {
  if( !_.isUndefined( this.list ) ) {
    return callback( null, this.list );
  }
  var query = squel.select( ).field( "*").from( "lists" ).
    where( "type = 'ProjectList' AND project_id = ?", this.id ).limit( 1 );
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      this.list = result.rows[0] ? result.rows[0] : false;
      callback( null, this.list );
    }
  );
};

Project.prototype.observationRules = function( callback ) {
  if( !_.isUndefined( this.rules ) ) {
    return callback( null, this.rules );
  }
  var query = squel.select( ).field( "*").from( "rules" ).
    where( "ruler_type = 'Project' AND ruler_id = ?", this.id ).
    where( "type = 'ProjectObservationRule'" );
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      this.rules = result.rows;
      callback( null, this.rules );
    }
  );
};

Project.findByID = function( id, callback ) {
  var cacheKey = "projects." + id;
  var project = memoryCache.get( cacheKey );
  if( !_.isNull( project ) ) { return callback( null, project ); }
  var query = squel.select( ).field( "*" ).
    field( "start_time AT TIME ZONE 'UTC' start_time" ).
    field( "end_time AT TIME ZONE 'UTC' end_time" ).from( "projects" );
  var asInt = parseInt( id );
  if( asInt ) {
    query = query.where( "id = ? OR slug = '?'", asInt, asInt );
  } else {
    query = query.where( "slug = ?", id );
  }
  pgClient.connection.query( query.toString( ),
    function( err, result ) {
      if( err ) { return callback( err ); }
      // setting project to false, since null can't be cached
      var project = result.rows[0] ? new Project( result.rows[0] ) : false;
      memoryCache.put( cacheKey, project, 3600000 ); // 1 hour
      callback( null, project );
    }
  );
};

module.exports = Project;
