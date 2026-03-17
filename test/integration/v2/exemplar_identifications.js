const { expect } = require( "chai" );
const request = require( "supertest" );
const jwt = require( "jsonwebtoken" );
const sinon = require( "sinon" );
const UserSession = require( "../../../lib/user_session" );
const config = require( "../../../config" );

describe( "ExemplarIdentifications", ( ) => {
  describe( "search", ( ) => {
    const adminToken = jwt.sign(
      { user_id: 1 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );

    const nonAdminToken = jwt.sign(
      { user_id: 123 },
      config.jwtSecret || "secret",
      { algorithm: "HS512" }
    );

    it( "does not allow unauthenticated requests", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Content-Type", "application/json" )
        .expect( 401, done );
    } );

    it( "does not allow non-admins that are not in relevant test groups", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Authorization", nonAdminToken )
        .set( "Content-Type", "application/json" )
        .expect( 401, done );
    } );

    it( "does not allow non-admins that not in all relevant test groups", function ( done ) {
      sinon.stub( UserSession.prototype, "extend" )
        .callsFake( function ( ) {
          this.test_groups = ["helpful-id-tips"];
        } );
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Authorization", nonAdminToken )
        .set( "Content-Type", "application/json" )
        .expect( 401, ( ) => {
          UserSession.prototype.extend.restore( );
          done( );
        } );
    } );

    it( "allows non-admins that are in relevant test groups", function ( done ) {
      sinon.stub( UserSession.prototype, "extend" )
        .callsFake( function ( ) {
          this.test_groups = ["helpful-id-tips-reviewer", "helpful-id-tips"];
        } );
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Authorization", nonAdminToken )
        .set( "Content-Type", "application/json" )
        .expect( 200, ( ) => {
          UserSession.prototype.extend.restore( );
          done( );
        } );
    } );

    it( "returns JSON", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.be.above( 1 );
          expect( res.body.results.length ).to.eq( res.body.total_results );
        } )
        .expect( 200, done );
    } );

    it( "can include include category_counts", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&include_category_counts=true" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.category_counts ).to.be.an( "object" );
        } )
        .expect( 200, done );
    } );

    it( "can include include category_controlled_terms", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?include_category_controlled_terms=true" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.category_controlled_terms ).to.be.an( "array" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by upvoted", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&upvoted=true&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 upvoted" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by downvoted", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&downvoted=true&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 downvoted" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by nominated", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&nominated=true&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 7 nominated" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by not nominated", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&nominated=false&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 7 unnominated" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by query", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=7&q=unnominated&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 7 unnominated" );
        } )
        .expect( 200, done );
    } );

    it( "can filter by term_value_id", function ( done ) {
      request( this.app ).get( "/v2/exemplar_identifications?direct_taxon_id=3&term_value_id=2&fields=all" )
        .set( "Authorization", adminToken )
        .set( "Content-Type", "application/json" )
        .expect( "Content-Type", /json/ )
        .expect( res => {
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( res.body.results[0].identification.body ).to.eq( "taxon 3 annotated" );
        } )
        .expect( 200, done );
    } );
  } );
} );
