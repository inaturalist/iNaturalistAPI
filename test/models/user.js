const { expect } = require( "chai" );
const User = require( "../../lib/models/user" );

describe( "User", ( ) => {
  describe( "findByLogin", ( ) => {
    it( "returns a user given an login", done => {
      User.findByLogin( "a-user", ( err, u ) => {
        expect( u.id ).to.eq( 123 );
        expect( u.login ).to.eq( "a-user" );
        done( );
      } );
    } );

    it( "returns a user from the cache", done => {
      User.findByLogin( "a-user", ( err, u ) => {
        expect( u.id ).to.eq( 123 );
        expect( u.login ).to.eq( "a-user" );
        done( );
      } );
    } );

    it( "returns undefined for missing users", done => {
      User.findByLogin( "nonsense", ( err, u ) => {
        expect( u ).to.be.undefined;
        done( );
      } );
    } );

    it( "returns nothing given nothing", done => {
      User.findByLogin( undefined, ( err, u ) => {
        expect( u ).to.be.undefined;
        done( );
      } );
    } );
  } );

  describe( "iconUrl", ( ) => {
    it( "returns nothing if there is no icon", ( ) => {
      expect( User.iconUrl( { } ) ).to.be.null;
    } );

    it( "returns nothing with an unknown type", ( ) => {
      expect( User.iconUrl( { id: 50, icon_content_type: "nans" } ) ).to.be.null;
    } );

    it( "recognizes standard extensions", ( ) => {
      expect( User.iconUrl( { id: 50, icon_content_type: "jpeg" } ) ).to.match( /50\/medium.jpg$/ );
      expect( User.iconUrl( { id: 50, icon_content_type: "png" } ) ).to.match( /50\/medium.png$/ );
      expect( User.iconUrl( { id: 50, icon_content_type: "gif" } ) ).to.match( /50\/medium.gif$/ );
      expect( User.iconUrl( { id: 50, icon_content_type: "bmp" } ) ).to.match( /50\/medium.bmp$/ );
      expect( User.iconUrl( { id: 50, icon_content_type: "tiff" } ) ).to.match( /50\/medium.tiff$/ );
    } );

    it( "some exceptions", ( ) => {
      expect( User.iconUrl( {
        id: 50,
        icon_content_type: "jpeg",
        icon_file_name: "image.jpeg"
      } ) ).to.match( /50\/medium.jpeg$/ );
      expect( User.iconUrl( {
        id: 50,
        icon_content_type: "jpeg",
        icon_file_name: "stringio.txt"
      } ) ).to.match( /50\/medium.jpeg$/ );
      expect( User.iconUrl( {
        id: 50,
        icon_content_type: "jpeg",
        icon_file_name: "open-uri20110111-11111-111111"
      } ) ).to.match( /50\/medium.jpeg$/ );
      expect( User.iconUrl( {
        id: 50,
        icon_content_type: "jpeg",
        icon_file_name: "data"
      } ) ).to.match( /50\/medium.jpeg$/ );
    } );

    it( "some exceptions", ( ) => {
      const globalPrefix = global.config.userImagePrefix;
      global.config.userImagePrefix = null;
      expect( User.iconUrl( { id: 50, icon_content_type: "jpeg", icon_file_name: "image.jpeg" } ) )
        .to.eq( "https://static.inaturalist.org/attachments/users/icons/50/medium.jpeg" );
      global.config.userImagePrefix = globalPrefix;
    } );
  } );

  describe( "findByLoginOrID", ( ) => {
    it( "should not error if given an unknown login", done => {
      User.findByLoginOrID( "nobody", ( err, u ) => {
        expect( err ).to.eq( null );
        expect( u ).to.eq( false );
        done( );
      } );
    } );

    it( "should not error if given an unknown ID", done => {
      User.findByLoginOrID( 123456789, ( err, u ) => {
        expect( err ).to.eq( null );
        expect( u ).to.eq( false );
        done( );
      } );
    } );

    it( "returns a user given an ID", done => {
      User.findByLoginOrID( 1, ( err, u ) => {
        expect( err ).to.eq( null );
        expect( u.id ).to.eq( 1 );
        expect( u.login ).to.eq( "userlogin" );
        done( );
      } );
    } );

    it( "returns a user given a login", done => {
      User.findByLoginOrID( "userlogin", ( err, u ) => {
        expect( err ).to.eq( null );
        expect( u.id ).to.eq( 1 );
        expect( u.login ).to.eq( "userlogin" );
        done( );
      } );
    } );
  } );
} );
