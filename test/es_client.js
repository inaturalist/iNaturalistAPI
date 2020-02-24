const { expect } = require( "chai" );
const esClient = require( "../lib/es_client" );

describe( "esClient", ( ) => {
  describe( "connect", ( ) => {
    it( "returns the open connection", ( ) => {
      const connection1 = esClient.connect( );
      const connection2 = esClient.connect( );
      expect( connection1 ).to.eql( connection2 );
    } );
  } );

  describe( "search", ( ) => {
    it( "can specify source fields to return", async ( ) => {
      const results = await esClient.search( "taxa", {
        body: {
          query: { bool: { must: { term: { id: 9898 } } } },
          _source: ["id"]
        },
        size: 1
      } );
      expect( results.hits.total.value ).to.eql( 1 );
      expect( results.hits.hits[0]._source.id ).to.eql( 9898 );
      expect( results.hits.hits[0]._source.name ).to.be.undefined;
    } );

    it( "can choose not to return source", async ( ) => {
      const results = await esClient.search( "taxa", {
        body: {
          query: { bool: { must: { term: { id: 9898 } } } },
          _source: false
        },
        size: 1
      } );
      expect( results.hits.total.value ).to.eql( 1 );
      expect( results.hits.hits[0]._source ).to.be.undefined;
    } );
  } );

  describe( "compileFilters", ( ) => {
    it( "requires an object", ( ) => {
      expect( esClient.compileFilters( ) ).to.eql( [] );
      expect( esClient.compileFilters( { } ) ).to.eql( [] );
      expect( esClient.compileFilters( [
        { a: 1, b: 2 }] ) ).to.eql( [] );
    } );

    it( "compiles basic filters", ( ) => {
      expect( esClient.compileFilters( [{ id: 1 }] ) ).to
        .eql( [{ id: 1 }] );
    } );

    it( "compiles envelope filters", ( ) => {
      expect( esClient.compileFilters( [{
        envelope: {
          geojson: { nelat: 5 }
        }
      }] ) ).to.eql( [{
        geo_shape: {
          geojson: {
            shape: {
              coordinates: [[-180, 5], [180, -90]],
              type: "envelope"
            }
          }
        }
      }] );
    } );
  } );

  describe( "envelopeFilter", ( ) => {
    it( "requires an object with valid envelope", ( ) => {
      expect( esClient.envelopeFilter( ) ).to.be.null;
      expect( esClient.envelopeFilter( { } ) ).to.null;
      expect( esClient.envelopeFilter( { envelope: { loc: { } } } ) ).to.null;
    } );

    it( "sets reasonable default values", ( ) => {
      expect( esClient.envelopeFilter( { envelope: { loc: { nelat: 5 } } } ) ).to
        .eql( {
          geo_shape: {
            loc: {
              shape: {
                type: "envelope",
                coordinates: [[-180, 5], [180, -90]]
              }
            }
          }
        } );
      expect( esClient.envelopeFilter( { envelope: { loc: { swlng: 5 } } } ) ).to
        .eql( {
          geo_shape: {
            loc: {
              shape: {
                type: "envelope",
                coordinates: [[5, 90], [180, -90]]
              }
            }
          }
        } );
    } );

    it( "splits envelopes that cross the dateline into a bool should query", ( ) => {
      expect( esClient.envelopeFilter( { envelope: { loc: { nelng: -10, swlng: 30 } } } ) ).to
        .eql( {
          bool: {
            should: [
              {
                geo_shape: {
                  loc: {
                    shape: {
                      type: "envelope",
                      coordinates: [[30, 90], [180, -90]]
                    }
                  }
                }
              },
              {
                geo_shape: {
                  loc: {
                    shape: {
                      type: "envelope",
                      coordinates: [[-180, 90], [-10, -90]]
                    }
                  }
                }
              }
            ]
          }
        } );
    } );
  } );

  describe( "searchHash", ( ) => {
    it( "defaults to 30 per page", ( ) => {
      const h = esClient.searchHash( { } );
      expect( h.size ).to.eq( 30 );
    } );

    it( "maxes out at 10000 per page", ( ) => {
      const h = esClient.searchHash( { per_page: 10001 } );
      expect( h.size ).to.eq( 30 );
    } );
  } );

  describe( "createIndexIfNotExists", ( ) => {
    it( "doesn't throw an error if the index exists", ( ) => {
      esClient.createIndexIfNotExists( { name: "observations" }, err => {
        expect( err ).to.be.undefined;
      } );
    } );
  } );
} );
