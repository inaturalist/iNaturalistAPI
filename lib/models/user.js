"use strict";
var _ = require( "underscore" ),
    squel = require( "squel" ).useFlavour( "postgres" ),
    esClient = require( "../es_client" ),
    pgClient = require( "../pg_client" ),
    Model = require( "./model" );

var User = class User extends Model {

  constructor( attrs ) {
    super( attrs );
    this.icon_url = User.iconUrl( this );
  }

  static findByLogin( login, callback ) {
    if( _.isEmpty( login ) ) { return callback( ); }
    var query = squel.
      select( ).
        field( "id, login, name").
      from( "users" ).
      where( "login = ?", login );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        callback( null, result.rows[0] );
      }
    );
  }

  static findByLoginOrID( login, callback ) {
    User.findByLogin( login, function( err, user ) {
      if( err ) { return callback( err ); }
      if( user ) { return callback( null, user ); }
      var query = squel.select( ).field( "id, login, name ").from( "users" ).
        where( "id = ?", login );
      pgClient.connection.query( query.toString( ),
        function( err, result ) {
          if( err ) { return callback( err ); }
          var user = result.rows[0] ? result.rows[0] : false;
          callback( null, user );
        }
      );
    });
  }

  static findInES( idOrLogin, callback ) {
    User.findByLoginOrID( idOrLogin, function( err, user ) {
      if( err ) { return callback( err ); }
      if( !user ) { return callback( ); }
      const query = { body: { query: { term: { id: user.id } } } };
      esClient.search( "users", query, ( err, results ) => {
        if( err ) { return callback( err ); }
        var user = results.hits.hits[0] ? results.hits.hits[0]._source : null;
        callback( null, user );
      });
    });
  }

  static findByIDInES( ids, callback ) {
    const userIDs = _.compact( _.flatten( [ids] ) );
    let query = { body: { query: { terms: { id: userIDs } } } };
    esClient.search( "users", query, ( err, results ) => {
      if( err ) { return callback( err ); }
      callback( null, results.hits.hits.map( h => h._source ) );
    });
  }

  static iconUrl( user ) {
    if( user.icon ) {
      return user.icon.replace("thumb", "medium");
    }
    if( !user.icon_content_type ) { return; }
    var extension;
    if( user.icon_content_type && user.icon_content_type.match( /jpeg$/ ) ) { extension = "jpg"; }
    else if( user.icon_content_type && user.icon_content_type.match( /png$/ ) ) { extension = "png"; }
    else if( user.icon_content_type && user.icon_content_type.match( /gif$/ ) ) { extension = "gif"; }
    else if( user.icon_content_type && user.icon_content_type.match( /bmp$/ ) ) { extension = "bmp"; }
    else if( user.icon_content_type && user.icon_content_type.match( /tiff$/ ) ) { extension = "tiff"; }
    else return;
    // catch a few file_names that paperclip knows are JPEGs
    if( extension == "jpg" && user.icon_file_name &&
        user.icon_file_name.match( /(stringio\.txt|open-uri|\.jpeg|^data$)/ ) ) {
      extension = "jpeg";
    }
    var prefix = global.config.userImagePrefix ||
      "https://static.inaturalist.org/attachments/users/icons/";
    return prefix + user.id + "/medium." + extension;
  }

  static projectsCurated( userID, callback ) {
    var query = squel.select( ).field( "project_id ").from( "project_users" ).
      where( "user_id = ?", userID ).
      where( "role IN ?", [ "manager", "curator" ] );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        callback( null, _.map( result.rows, "project_id" ) );
      }
    );
  }

  static blocks( userID, callback ) {
    var query = squel.
      select( ).
        field( "user_id, blocked_user_id, users.login AS user_login, blocked_users.login AS blocked_user_login" ).
      from( "user_blocks" ).
        left_join( "users", "users", "user_blocks.user_id = users.id" ).
        left_join( "users", "blocked_users", "user_blocks.blocked_user_id = users.id" ).
      where( "user_id = ? OR blocked_user_id = ?", userID, userID );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var blocks = {
          blockedUsers: [],
          blockedByUsers: []
        };
        _.map( result.rows, r => {
          if ( r.user_id === userID ) {
            blocks.blockedUsers.push( {
              id: r.blocked_user_id,
              login: r.blocked_user_login
            } );
          } else {
            blocks.blockedByUsers.push( {
              id: r.user_id,
              login: r.user_login
            } );
          }
        } )
        if ( blocks.blockedUsers.length === 0 && blocks.blockedByUsers.length === 0 ) {
          callback( null, null );
        } else {
          callback( null, blocks );
        }
      }
    );
  }

  static localeDefaults( userID, callback ) {
    var query = squel.select( ).
        field( "users.locale" ).
        field( "users.place_id" ).
        field( "places.name", "place_name" ).
        field( "places.ancestry", "place_ancestry" ).
        field( "preferences.value", "prefers_common_names" ).
      from( "users" ).
      left_join( "places", null, "users.place_id = places.id" ).
      left_join( "preferences", null, "users.id = preferences.owner_id AND preferences.owner_type = 'User' AND preferences.name = 'common_names'" ).
      where( "users.id = ?", userID );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        if ( _.isEmpty( result.rows ) ) { return callback( ); }
        const row = result.rows[0];
        let defaults = {
          prefersCommonNames: row.prefers_common_names !== "f"
        };
        if ( row.locale ) { defaults.locale = row.locale; }
        if ( row.place_id ) {
          defaults.preferredPlace = {
            id: row.place_id,
            name: row.place_name,
            ancestor_place_ids: row.place_ancestry ?
              row.place_ancestry.split( "/" ).map( Number ) : [ ]
          }
        }
        callback( null, defaults );
      }
    );
  }

};

User.modelName = "user";
User.tableName = "users";
User.returnFields = [
  "id", "login", "name" ];

module.exports = User;
