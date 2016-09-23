"user strict";
var _ = require( "underscore" ),
    expect = require( "chai" ).expect,
    identifications = require( "inaturalistjs" ).identifications,
    util = require( "../../../lib/util" ),
    testHelper = require( "../../../lib/test_helper" ),
    Identification = require( "../../../lib/models/identification" ),
    IdentificationsController = require( "../../../lib/controllers/v1/identifications_controller" ),
    eq;

var Q = function( params, callback ) {
  var queryString = _.reduce( params,
    function ( components, value, key ) {
      components.push( key + "=" + (value ? encodeURIComponent( value ) : "") );
      return components;
    }, [ ] ).join( "&" );
  IdentificationsController.reqToElasticQuery({ query: params,
    _parsedUrl: { query: queryString }}, callback );
};

describe( "IdentificationsController", function( ) {
  it( "creates", function( done ) {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "create", Identification, done );
  });

  it( "updates", function( done ) {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "update", Identification, done );
  });

  it( "deletes", function( done ) {
    testHelper.testInatJSNoPreload(
      IdentificationsController, identifications, "delete", done );
  });

  describe( "reqToElasticQuery", function( ) {
    it( "defaults to current=true", function( ) {
      Q( { }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current && f.terms.current[0] === "true";
      })).to.not.be.undefined;
    });

    it( "can set current to false", function( ) {
      Q( { current: "false" }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current && f.terms.current[0] === "false";
      })).to.not.be.undefined;
    });

    it( "filters by taxon_id", function( ) {
      Q( { taxon_id: 88 }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms["taxon.ancestor_ids"] &&
          f.terms["taxon.ancestor_ids"][0] === 88;
      })).to.not.be.undefined;
    });

    it( "filters by user login", function( ) {
      Q( { user_id: "a-user" }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms["user.login"] &&
          f.terms["user.login"][0] === "a-user"
      })).to.not.be.undefined;
    });

    it( "filters by boolean true params", function( ) {
      Q( { current_taxon: "true" }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current_taxon && f.terms.current_taxon[0] === true;
      })).to.not.be.undefined;
    });

    it( "filters by boolean false params", function( ) {
      Q( { current_taxon: "false" }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.term && f.term.current_taxon === false;
      })).to.not.be.undefined;
    });

    it( "filters by without_taxon_id", function( ) {
      Q( { without_taxon_id: 89 }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.not && f.not.terms && f.not.terms["taxon.ancestor_ids"] &&
          f.not.terms["taxon.ancestor_ids"][0] === 89;
      })).to.not.be.undefined;
    });

    it( "filters by without_observation_taxon_id", function( ) {
      Q( { without_observation_taxon_id: 90 }, function( e, q ) { eq = q; } );
      expect( _.detect( eq.filters, f => {
        return f.not && f.not.terms && f.not.terms["observation.taxon.ancestor_ids"] &&
          f.not.terms["observation.taxon.ancestor_ids"][0] === 90;
      })).to.not.be.undefined;
    });
  });

  describe( "search", function( ) {
    it( "returns identifications", function( done ) {
      IdentificationsController.search( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(2);
        done( );
      });
    });
  });

  describe( "show", function( ) {
    it( "returns identifications", function( done ) {
      IdentificationsController.show( { params: { id: "102" }, query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(1);
        done( );
      });
    });
  });

  describe( "categories", function( ) {
    it( "shows identifications", function( done ) {
      IdentificationsController.categories( { query: { } }, function( ) {
        // this needs some work - fixtures, etc
        done( );
      });
    });
  });


  describe( "speciesCounts", function( ) {
    it( "returns taxa", function( done ) {
      IdentificationsController.speciesCounts( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(1);
        expect(r.results[0].count).to.eq(2);
        expect(r.results[0].taxon.id).to.eq(5);
        done( );
      });
    });
  });

});