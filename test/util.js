var expect = require( "chai" ).expect,
    util = require( "../lib/util" );

describe( "util", function( ) {

  describe( "renderError", function( ) {
    it( "renders a generic exception", function( done ) {
      var res = expectResult( 500, "Error", done );
      util.renderError( "      testing renderError", res );
    });

    it( "renders a custom exception", function( done ) {
      var e = { message: "testing", status: 501 };
      // TODO: the message is now always Error when debug is off
      var res = expectResult( 501, "Error", done );
      util.renderError( e, res );
    });
  });

  describe( "renderMessage", function( ) {
    it( "renders a response message with proper status", function( done ) {
      var res = expectResult( 123, "the message", done );
      util.renderMessage( res, "the message", 123 );
    });
  });

  describe( "debug", function( ) {
    it( "writes to console.log", function( ) {
      expect( util.debug( "      testing debug" ) ).to.be.undefined;
    });
  });

  describe( "pp", function( ) {
    it( "writes to compclidated objects", function( ) {
      expect( util.pp( { just: { a: { test: { } } } } ) ).to.be.undefined;
    });
  });

  describe( "capitalize", function( ) {
    it( "capitalizes only the first letter", function( ) {
      expect( util.capitalize( "helloWorld" ) ).to.eq( "Helloworld");
    });
  });

});

function expectResult( status, message, done ) {
  var header_attr, header_val, status, content;
  res = { };
  res.set = function( attr, val ) {
    header_attr = attr;
    header_val = val;
  };
  res.status = function( val ) {
    status = val;
    return res;
  };
  res.send = function( val ) {
    content = val;
    return res;
  };
  res.end = function( ) {
    expect( header_attr ).to.eq( "Content-Type" );
    expect( header_val ).to.eq( "text/html" );
    expect( status ).to.eq( status );
    expect( content ).to.eq( message );
    done( );
  };
  return res;
}
