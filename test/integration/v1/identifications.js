const { expect } = require( "chai" );
const request = require( "supertest" );
const fs = require( "fs" );
const _ = require( "lodash" );

const fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

describe( "Identifications", ( ) => {
  describe( "search", ( ) => {
    it( "should filter by is_change", function ( done ) {
      request( this.app ).get( "/v1/identifications?is_change=false&taxon_id=10002" )
        .expect( res => {
          expect( res.body.results.length ).to.eq( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "should filter by d1 and d2", function ( done ) {
      const identIn2015 = 124;
      const identIn2016 = 125;
      request( this.app ).get( "/v1/identifications?d1=2015-01-01&d2=2015-12-31" )
        .expect( res => {
          const ids = res.body.results.map( i => i.id );
          expect( ids ).to.include( identIn2015 );
          expect( ids ).not.to.include( identIn2016 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );

    it( "can return only ids", function ( done ) {
      request( this.app ).get( "/v1/identifications?id=102&only_id=true&per_page=1" )
        .expect( res => {
          const result = res.body.results[0];
          expect( _.keys( result ).length ).to.eq( 1 );
          expect( _.keys( result )[0] ).to.eq( "id" );
          expect( result.id ).to.eq( 102 );
        } ).expect( 200, done );
    } );

    it( "never returns email or IP for user in identification", function ( done ) {
      request( this.app ).get( "/v1/identifications?id=2023092501" )
        .expect( res => {
          const identification = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( identification.id ).to.eq( 2023092501 );
          expect( identification.user ).not.to.be.undefined;
          expect( identification.user.id ).to.eq( 2023092501 );
          expect( identification.user.email ).to.be.undefined;
          expect( identification.user.last_ip ).to.be.undefined;
          expect( identification.observation ).not.to.be.undefined;
          expect( identification.observation.user ).not.to.be.undefined;
          expect( identification.observation.user.id ).to.eq( 2023092501 );
          expect( identification.observation.user.email ).to.be.undefined;
          expect( identification.observation.user.last_ip ).to.be.undefined;
          expect( identification.observation.identifications ).not.to.be.undefined;
          expect( identification.observation.identifications.length ).to.eq( 1 );
          expect( identification.observation.identifications[0].user ).not.to.be.undefined;
          expect( identification.observation.identifications[0].user.id ).to.eq( 2023092501 );
          expect( identification.observation.identifications[0].user.email ).to.be.undefined;
          expect( identification.observation.identifications[0].user.last_ip ).to.be.undefined;
        } ).expect( 200, done );
    } );
  } );

  describe( "details", ( ) => {
    it( "never returns email or IP for user in identification", function ( done ) {
      request( this.app ).get( "/v1/identifications/2023092501" )
        .expect( res => {
          const identification = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( identification.id ).to.eq( 2023092501 );
          expect( identification.user ).not.to.be.undefined;
          expect( identification.user.id ).to.eq( 2023092501 );
          expect( identification.user.email ).to.be.undefined;
          expect( identification.user.last_ip ).to.be.undefined;
          expect( identification.observation ).not.to.be.undefined;
          expect( identification.observation.user ).not.to.be.undefined;
          expect( identification.observation.user.id ).to.eq( 2023092501 );
          expect( identification.observation.user.email ).to.be.undefined;
          expect( identification.observation.user.last_ip ).to.be.undefined;
          expect( identification.observation.identifications ).not.to.be.undefined;
          expect( identification.observation.identifications.length ).to.eq( 1 );
          expect( identification.observation.identifications[0].user ).not.to.be.undefined;
          expect( identification.observation.identifications[0].user.id ).to.eq( 2023092501 );
          expect( identification.observation.identifications[0].user.email ).to.be.undefined;
          expect( identification.observation.identifications[0].user.last_ip ).to.be.undefined;
        } ).expect( 200, done );
    } );
  } );

  describe( "identifiers", ( ) => {
    it( "never returns email or IP for user in identification", function ( done ) {
      request( this.app ).get( "/v1/identifications/identifiers?id=2023092501" )
        .expect( res => {
          const identification = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( identification.user_id ).to.eq( 2023092501 );
          expect( identification.user ).not.to.be.undefined;
          expect( identification.user.id ).to.eq( 2023092501 );
          expect( identification.user.email ).to.be.undefined;
          expect( identification.user.last_ip ).to.be.undefined;
        } ).expect( 200, done );
    } );
  } );

  describe( "observers", ( ) => {
    it( "never returns email or IP for user in identification", function ( done ) {
      request( this.app ).get( "/v1/identifications/observers?id=2023092501" )
        .expect( res => {
          const identification = res.body.results[0];
          expect( res.body.page ).to.eq( 1 );
          expect( res.body.total_results ).to.eq( 1 );
          expect( res.body.results.length ).to.eq( 1 );
          expect( identification.user_id ).to.eq( 2023092501 );
          expect( identification.user ).not.to.be.undefined;
          expect( identification.user.id ).to.eq( 2023092501 );
          expect( identification.user.email ).to.be.undefined;
          expect( identification.user.last_ip ).to.be.undefined;
        } ).expect( 200, done );
    } );
  } );

  describe( "species_counts", ( ) => {
    it( "should have results", function ( done ) {
      request( this.app ).get( "/v1/identifications/species_counts" )
        .expect( res => {
          expect( res.body.results.length ).to.be.above( 0 );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "recent_taxa", ( ) => {
    it( "returns identifications and taxa", function ( done ) {
      request( this.app ).get( "/v1/identifications/recent_taxa" )
        .expect( res => {
          const firstResult = res.body.results[0];
          expect( firstResult.identification ).to.not.be.undefined;
          expect( firstResult.taxon ).to.not.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "should filter by quality_grade=needs_id,research", function ( done ) {
      const identFromCasual = _.find( fixtures.elasticsearch.identifications.identification,
        i => i.observation && i.observation.quality_grade === "casual" && i.taxon && i.taxon.min_species_ancestors.length > 1 );
      const searchTaxon = identFromCasual.taxon.min_species_ancestors[0];
      request( this.app ).get( `/v1/identifications/recent_taxa?taxon_id=${searchTaxon.id}&rank=species&quality_grade=needs_id,research` )
        .expect( res => {
          expect( res.body.results.map( r => r.taxon.id ) ).not.to
            .include( identFromCasual.taxon.id );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
    it( "should filter by quality_grade=casual", function ( done ) {
      const identFromCasual = _.find( fixtures.elasticsearch.identifications.identification,
        i => i.observation && i.observation.quality_grade === "casual" && i.taxon && i.taxon.min_species_ancestors.length > 1 );
      const searchTaxon = identFromCasual.taxon.min_species_ancestors[0];
      request( this.app ).get( `/v1/identifications/recent_taxa?taxon_id=${searchTaxon.id}&rank=species&quality_grade=casual` )
        .expect( res => {
          expect( res.body.results.map( r => r.taxon.id ) ).to.include( identFromCasual.taxon.id );
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );

  describe( "similar_species", ( ) => {
    it( "requires a taxon_id", function ( done ) {
      request( this.app ).get( "/v1/identifications/similar_species" )
        .expect( "Content-Type", /json/ ).expect( 422, done );
    } );

    it( "returns json", function ( done ) {
      request( this.app ).get( "/v1/identifications/similar_species?taxon_id=5" )
        .expect( res => {
          const firstResult = res.body.results[0];
          expect( firstResult.count ).to.eq( 1 );
          expect( firstResult.taxon ).to.not.be.undefined;
        } ).expect( "Content-Type", /json/ )
        .expect( 200, done );
    } );
  } );
} );
