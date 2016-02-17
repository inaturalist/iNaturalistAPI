var expect = require( "chai" ).expect,
    esClient = require( "../lib/es_client" );

describe( "esClient", function( ) {
  describe( "connect", function( ) {
    it( "returns the open connection", function( ) {
      var connection1 = esClient.connect( );
      var connection2 = esClient.connect( );
      expect( connection1 ).to.eql( connection2 );
    });
  });

  describe( "compileFilters", function( ) {
    it( "requires an object", function( ) {
      expect( esClient.compileFilters( ) ).to.eql([ ]);
      expect( esClient.compileFilters({ }) ).to.eql([ ]);
      expect( esClient.compileFilters({ filters: [
        { a: 1, b: 2 }]})).to.eql([ ]);
    });

    it( "compiles basic filters", function( ) {
      expect( esClient.compileFilters({ filters: [ { id: 1 } ]})).to.
        eql([{ id: 1 }]);
    });

    it( "compiles envelope filters", function( ) {
      expect( esClient.compileFilters({ filters: [ { envelope: {
        geojson: { nelat: 5 } }}]})).to.eql([{
          geo_shape: { geojson: { shape: {
            coordinates: [ [ -180, -90 ], [ 180, 5 ] ],
            type: "envelope" }}}}]);
    });
  });

  describe( "envelopeFilter", function( ) {
    it( "requires an object with valid envelope", function( ) {
      expect( esClient.envelopeFilter( ) ).to.undefined;
      expect( esClient.envelopeFilter( { }) ).to.undefined;
      expect( esClient.envelopeFilter( { envelope: { loc: { } } }) ).to.undefined;
    });

    it( "sets reasonable default values", function( ) {
      expect( esClient.envelopeFilter( { envelope: { loc: { nelat: 5 } } }) ).to.
        eql({ geo_shape: { loc: { shape: { type: "envelope",
          coordinates: [ [ -180, -90 ], [ 180, 5 ] ] }}}});
      expect( esClient.envelopeFilter( { envelope: { loc: { swlng: 5 } } }) ).to.
        eql({ geo_shape: { loc: { shape: { type: "envelope",
          coordinates: [ [ 5, -90 ], [ 180, 90 ] ] }}}});
    });

    it( "splits envelopes that cross the dateline into an or query", function( ) {
      expect( esClient.envelopeFilter( { envelope: { loc: { nelng: -10, swlng: 30 } } }) ).to.
        eql({ or: [
          { geo_shape: { loc: { shape: { type: "envelope",
          coordinates: [ [ 30, -90 ], [ 180, 90 ] ] }}}},
          { geo_shape: { loc: { shape: { type: "envelope",
          coordinates: [ [ -180, -90 ], [ -10, 90 ] ] }}}}
        ]});
    });
  });

  describe( "searchHash", function( ) {
    it( "defaults to 30 per page", function( ) {
      var h = esClient.searchHash({ });
      expect( h.size ).to.eq( 30 );
    });

    it( "maxes out at 200 per page", function( ) {
      var h = esClient.searchHash({ per_page: 500 });
      expect( h.size ).to.eq( 200 );
    });

    it( "can return a custom field list", function( ) {
      var h = esClient.searchHash({ fields: [ "id", "name" ] });
      expect( h.fields ).to.deep.eq([ "id", "name" ]);
    });
  });

});
