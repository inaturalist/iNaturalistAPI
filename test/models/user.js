const { expect } = require( "chai" );
const User = require( "../../lib/models/user" );

describe( "User", ( ) => {
  describe( "findByLogin", ( ) => {
    it( "returns a user given an login", async ( ) => {
      const u = await User.findByLogin( "a-user" );
      expect( u.id ).to.eq( 123 );
      expect( u.login ).to.eq( "a-user" );
    } );

    it( "returns a user from the cache", async ( ) => {
      const u = await User.findByLogin( "a-user" );
      expect( u.id ).to.eq( 123 );
      expect( u.login ).to.eq( "a-user" );
    } );

    it( "igmores case", async ( ) => {
      const u = await User.findByLogin( "A-USER" );
      expect( u.id ).to.eq( 123 );
      expect( u.login ).to.eq( "a-user" );
    } );

    it( "returns undefined for missing users", async ( ) => {
      const u = await User.findByLogin( "nonsense" );
      expect( u ).to.be.null;
    } );

    it( "returns nothing given nothing", async ( ) => {
      const u = await User.findByLogin( undefined );
      expect( u ).to.be.null;
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
    it( "should not error if given an unknown login", async ( ) => {
      const u = await User.findByLoginOrID( "nobody" );
      expect( u ).to.be.null;
    } );

    it( "should not error if given an unknown ID", async ( ) => {
      const u = await User.findByLoginOrID( 123456789 );
      expect( u ).to.be.null;
    } );

    it( "returns a user given an ID", async ( ) => {
      const u = await User.findByLoginOrID( 1 );
      expect( u.id ).to.eq( 1 );
      expect( u.login ).to.eq( "userlogin" );
    } );

    it( "returns a user given a login", async ( ) => {
      const u = await User.findByLoginOrID( "userlogin" );
      expect( u.id ).to.eq( 1 );
      expect( u.login ).to.eq( "userlogin" );
    } );

    it( "returns a user given a login, regardless of case", async ( ) => {
      const u = await User.findByLoginOrID( "UsErLoGIN" );
      expect( u.id ).to.eq( 1 );
      expect( u.login ).to.eq( "userlogin" );
    } );
  } );
} );
