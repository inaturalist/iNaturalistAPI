var expect = require( "chai" ).expect,
    _ = require( "underscore" ),
    pgClient = require( "../../lib/pg_client" ),
    User = require( "../../lib/models/user" );

describe( "User", function( ) {
  before( function( done ) {
    pgClient.connection.query( "TRUNCATE TABLE users", function( ) {
      pgClient.connection.query(
        "INSERT INTO users (id, login, icon_content_type, icon_file_name) VALUES ($1, $2, $3, $4)",
        [ 123, "a-user", "image/jpeg", "img.jpg" ], function( ) {
          done( );
      });
    });
  });

  describe( "findByLogin", function( ) {
    it( "returns a user given an login", function( done ) {
      User.findByLogin( "a-user", function( err, u ) {
        expect( u.id ).to.eq( 123 );
        expect( u.login ).to.eq( "a-user" );
        done( );
      });
    });

    it( "returns a user from the cache", function( done ) {
      User.findByLogin( "a-user", function( err, u ) {
        expect( u.id ).to.eq( 123 );
        expect( u.login ).to.eq( "a-user" );
        done( );
      });
    });

    it( "returns false for missing users", function( done ) {
      User.findByLogin( "nonsense", function( err, u ) {
        expect( u ).to.be.false;
        done( );
      });
    });
  });

  describe( "iconUrl", function( ) {
    it( "returns nothing if there is no icon", function( ) {
      expect( User.iconUrl({ }) ).to.be.undefined;
    });

    it( "returns nothing with an unknown type", function( ) {
      expect( User.iconUrl({ id: 50, icon_content_type: "nans" }) ).to.be.undefined;
    });

    it( "recognizes standard extensions", function( ) {
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg" }) ).to.match( /50-medium.jpg$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "png" }) ).to.match( /50-medium.png$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "gif" }) ).to.match( /50-medium.gif$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "bmp" }) ).to.match( /50-medium.bmp$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "tiff" }) ).to.match( /50-medium.tiff$/ );
    });

    it( "some exceptions", function( ) {
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg",
        icon_file_name: "image.jpeg" })).to.match( /50-medium.jpeg$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg",
        icon_file_name: "stringio.txt" })).to.match( /50-medium.jpeg$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg",
        icon_file_name: "open-uri20110111-11111-111111" })).to.match( /50-medium.jpeg$/ );
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg",
        icon_file_name: "data" })).to.match( /50-medium.jpeg$/ );
    });

    it( "some exceptions", function( ) {
      var globalPrefix = global.config.userImagePrefix;
      global.config.userImagePrefix = null;
      expect( User.iconUrl({ id: 50, icon_content_type: "jpeg", icon_file_name: "image.jpeg" })).
        to.eq( "http://www.inaturalist.org/attachments/users/icons/50-medium.jpeg" );
      global.config.userImagePrefix = globalPrefix;
    });
  });

});
