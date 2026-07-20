const _ = require( "lodash" );
const { expect } = require( "chai" );
const sinon = require( "sinon" );
const Logstasher = require( "../lib/logstasher" );

describe( "Logstasher", ( ) => {
  it( "recognizes bots", ( ) => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
      "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26"
        + " (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25"
        + " (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 OpenSSL/0.9.8i",
      "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
      "Mozilla/5.0 (compatible; MegaIndex.ru/2.0; +http://megaindex.com/crawler)",
      "NewRelicPinger/1.0 (733677)",
      "Python-urllib/2.7",
      "Ruby"
    ];
    const notBots = [
      "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:37.0) Gecko/20100101 Firefox/37.0",
      "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:37.0) Gecko/20100101 Firefox/37.0"
    ];
    _.each( bots, b => {
      expect( Logstasher.userAgentIsBot( b ) ).to.be.true;
    } );
    _.each( notBots, b => {
      expect( Logstasher.userAgentIsBot( b ) ).to.be.false;
    } );
  } );

  it( "returns the original IP in a list of IPs", ( ) => {
    expect( Logstasher.originalIPInList( null ) ).to.be.null;
    expect( Logstasher.originalIPInList( 100 ) ).to.be.null;
    expect( Logstasher.originalIPInList( ["127.0.0.1"] ) ).to.be.null;
    expect( Logstasher.originalIPInList( "127.0.0.1" ) ).to.eq( "127.0.0.1" );
    expect( Logstasher.originalIPInList( "127.0.0.1, 192.168.1.1" ) ).to.eq( "192.168.1.1" );
  } );

  it( "cleans up multiple IPs and adds originals to new field", ( ) => {
    expect( Logstasher.splitMultipleIPs( { x_real_ip: "127.0.0.1, 192.168.1.1" } ) ).to.deep.eq( {
      x_real_ip: "192.168.1.1",
      x_real_ip_all: ["127.0.0.1", "192.168.1.1"]
    } );
  } );

  it( "returns the IP of a request", ( ) => {
    expect( Logstasher.ipFromRequest( null ) ).to.be.null;
    expect( Logstasher.ipFromRequest( {} ) ).to.be.null;
    expect( Logstasher.ipFromRequest(
      { headers: { "x-real-ip": "127.0.0.1" } }
    ) ).to.eq( "127.0.0.1" );
    expect( Logstasher.ipFromRequest(
      { headers: { "x-real-ip": "127.0.0.1, 192.168.1.1" } }
    ) ).to.eq( "192.168.1.1" );
  } );

  describe( "beforeRequestPayload", ( ) => {
    it( "includes X-HTTP-Method-Override headers", ( ) => {
      const req = { headers: { "x-http-method-override": "GET" }, method: "POST" };
      const payload = Logstasher.beforeRequestPayload( req );
      expect( payload.method ).to.eq( "POST" );
      expect( payload.x_http_method_override ).to.eq( "GET" );
    } );

    it( "excludes fields from post bodies", ( ) => {
      const req = {
        headers: { },
        method: "POST",
        body: {
          preferred_place_id: 1,
          taxon_id: 1,
          fields: {
            field1: "true",
            field2: "true"
          }
        }
      };
      const payload = Logstasher.beforeRequestPayload( req );
      expect( payload.body_string ).to.include( "preferred_place_id" );
      expect( payload.body_string ).to.include( "taxon_id" );
      expect( payload.body_string ).not.to.include( "fields" );
      expect( payload.body_string ).not.to.include( "field1" );
      expect( payload.body_string ).not.to.include( "field2" );
    } );
  } );

  describe( "afterRequestPayload", ( ) => {
    it( "includes request context", ( ) => {
      const req = { inat: { requestContext: "inatContext" } };
      expect( Logstasher.afterRequestPayload( req ).context ).to.eq( "inatContext" );
    } );

    it( "prioritizes context from log response bodies", ( ) => {
      const req = {
        _logClientError: true,
        inat: { requestContext: "inatContext" },
        body: {
          context: "logContext"
        }
      };
      expect( Logstasher.afterRequestPayload( req ).context ).to.eq( "logContext" );
    } );
  } );

  describe( "writeMissingMediaLog", ( ) => {
    afterEach( ( ) => {
      sinon.restore( );
    } );

    it( "does nothing when the log stream is not set", ( ) => {
      sinon.stub( Logstasher, "logWriteStream" ).returns( undefined );
      expect( ( ) => Logstasher.writeMissingMediaLog( "photo", 1, 2, 3 ) ).not.to.throw( );
    } );

    it( "writes a JSON line when the log stream is set", ( ) => {
      const written = [];
      sinon.stub( Logstasher, "logWriteStream" ).returns( {
        write: line => written.push( line )
      } );
      Logstasher.writeMissingMediaLog( "photo", 1001, 2002, 3003 );
      expect( written.length ).to.eq( 1 );
      const payload = JSON.parse( written[0] );
      expect( payload.subtype ).to.eq( "MissingMedia" );
      expect( payload.media_type ).to.eq( "photo" );
      expect( payload.observation_id ).to.eq( 1001 );
      expect( payload.media_id ).to.eq( 2002 );
      expect( payload.join_record_id ).to.eq( 3003 );
      expect( payload["@timestamp"] ).to.not.be.undefined;
    } );
  } );
} );
