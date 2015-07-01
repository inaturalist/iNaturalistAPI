var expect = require( "chai" ).expect,
    esClient = require( "../lib/es_client" );

describe( "esClient", function( ) {

  describe( "compileWheres", function( ) {
    it( "requires an object", function( ) {
      expect( esClient.compileWheres( ) ).to.eql([ ]);
      expect( esClient.compileWheres({ }) ).to.eql([ ]);
    });

    it( "turns single values into matches", function( ) {
      expect( esClient.compileWheres({ where: { id: 5 }})).to.
        eql([{ match: { id: 5 } }]);
    });

    it( "turns multiple values into terms", function( ) {
      expect( esClient.compileWheres({ where: { id: [ 6, 7 ] }})).to.
        eql([{ terms: { id: [ 6, 7 ] } }]);
    });

    it( "keep objects in tact", function( ) {
      expect( esClient.compileWheres({ where: { id: { some: "obj" }}})).to.
        eql([{ id: { some: "obj" }}]);
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

});
