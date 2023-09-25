const request = require( "supertest" );
const nock = require( "nock" );
const config = require( "../../../config" );

describe( "Geomodel Tiles", ( ) => {
  describe( "geomodel", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04?taxon_id=1&swlat=0&swlng=-180&nelat=85.0511287798066&nelng=0" )
        .reply( 200, { } );
      request( this.app ).get( "/v2/geomodel/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );

    it( "accepts a thresholded parameter", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04?thresholded=true&taxon_id=1&swlat=0&swlng=-180&nelat=85.0511287798066&nelng=0" )
        .reply( 200, { } );
      request( this.app ).get( "/v2/geomodel/1/1/0/0.png?thresholded=true" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );

    it( "does not send the thresholded parameter when false", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04?taxon_id=1&swlat=0&swlng=-180&nelat=85.0511287798066&nelng=0" )
        .reply( 200, { } );
      request( this.app ).get( "/v2/geomodel/1/1/0/0.png?thresholded=false" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "geomodel_comparison", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04_taxon_range_comparison?taxon_id=1&swlat=0&swlng=-180&nelat=85.0511287798066&nelng=0" )
        .reply( 200, { } );
      request( this.app ).get( "/v2/geomodel_comparison/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );

  describe( "geomodel_taxon_range", ( ) => {
    it( "returns JSON", function ( done ) {
      nock( config.imageProcesing.tensorappURL )
        .get( "/h3_04_taxon_range?taxon_id=1&swlat=0&swlng=-180&nelat=85.0511287798066&nelng=0" )
        .reply( 200, { } );
      request( this.app ).get( "/v2/geomodel_taxon_range/1/1/0/0.png" )
        .expect( "Content-Type", /png/ )
        .expect( 200, done );
    } );
  } );
} );
