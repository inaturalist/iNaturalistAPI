"use strict";
var _ = require( "underscore" ),
    expect = require( "chai" ).expect,
    fs = require( "fs" ),
    identifications = require( "inaturalistjs" ).identifications,
    util = require( "../../../lib/util" ),
    testHelper = require( "../../../lib/test_helper" ),
    Identification = require( "../../../lib/models/identification" ),
    IdentificationsController = require( "../../../lib/controllers/v1/identifications_controller" ),
    eq;

var fixtures = JSON.parse( fs.readFileSync( "schema/fixtures.js" ) );

var Q = ( params, callback ) => {
  var queryString = _.reduce( params, ( components, value, key ) => {
    components.push( key + "=" + ( value ? encodeURIComponent( value ) : "") );
    return components;
  }, [ ] ).join( "&" );
  IdentificationsController.reqToElasticQuery({ query: params,
    _parsedUrl: { query: queryString }}, callback );
};

describe( "IdentificationsController", ( ) => {
  it( "creates", done => {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "create", Identification, done );
  });

  it( "updates", done => {
    testHelper.testInatJSPreload(
      IdentificationsController, identifications, "update", Identification, done );
  });

  it( "deletes", done => {
    testHelper.testInatJSNoPreload(
      IdentificationsController, identifications, "delete", done );
  });

  describe( "reqToElasticQuery", ( ) => {
    it( "defaults to current=true", ( ) => {
      Q( { }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current && f.terms.current[0] === "true";
      })).to.not.be.undefined;
    });

    it( "can set current to false", ( ) => {
      Q( { current: "false" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current && f.terms.current[0] === "false";
      })).to.not.be.undefined;
    });

    it( "filters by taxon_id", ( ) => {
      Q( { taxon_id: 88 }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms["taxon.ancestor_ids"] &&
          f.terms["taxon.ancestor_ids"][0] === 88;
      })).to.not.be.undefined;
    });

    it( "filters by user login", ( ) => {
      Q( { user_id: "a-user" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms["user.login"] &&
          f.terms["user.login"][0] === "a-user"
      })).to.not.be.undefined;
    });

    it( "filters by boolean true params", ( ) => {
      Q( { current_taxon: "true" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.terms && f.terms.current_taxon && f.terms.current_taxon[0] === true;
      })).to.not.be.undefined;
    });

    it( "filters by boolean false params", ( ) => {
      Q( { current_taxon: "false" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.term && f.term.current_taxon === false;
      })).to.not.be.undefined;
    });

    it( "filters by without_taxon_id", ( ) => {
      Q( { without_taxon_id: 89 }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.inverse_filters, f => {
        return f.terms && f.terms["taxon.ancestor_ids"] &&
          f.terms["taxon.ancestor_ids"][0] === 89;
      })).to.not.be.undefined;
    });

    it( "filters by without_observation_taxon_id", ( ) => {
      Q( { without_observation_taxon_id: 90 }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.inverse_filters, f => {
        return f.terms && f.terms["observation.taxon.ancestor_ids"] &&
          f.terms["observation.taxon.ancestor_ids"][0] === 90;
      })).to.not.be.undefined;
    });

    it( "filters by booleans true", ( ) => {
      Q( { is_change: "true" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.exists && f.exists.field === "taxon_change.id";
      })).to.not.be.undefined;
    });

    it( "filters by booleans false", ( ) => {
      Q( { is_change: "false" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.inverse_filters, f => {
        return f.exists && f.exists.field === "taxon_change.id";
      })).to.not.be.undefined;
    });

    it( "filters by lrank", ( ) => {
      Q( { lrank: "species" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range["taxon.rank_level"] &&
          f.range["taxon.rank_level"].gte === 10 &&
          f.range["taxon.rank_level"].lte === 100;
      })).to.not.be.undefined;
    });

    it( "filters by hrank", ( ) => {
      Q( { hrank: "family" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range["taxon.rank_level"] &&
          f.range["taxon.rank_level"].gte === 0 &&
          f.range["taxon.rank_level"].lte === 30;
      })).to.not.be.undefined;
    });

    it( "filters by observation_lrank", ( ) => {
      Q( { observation_lrank: "species" },
        ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range["observation.taxon.rank_level"] &&
          f.range["observation.taxon.rank_level"].gte === 10 &&
          f.range["observation.taxon.rank_level"].lte === 100;
      })).to.not.be.undefined;
    });

    it( "filters by observation_hrank", ( ) => {
      Q( { observation_hrank: "family" },
        ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range["observation.taxon.rank_level"] &&
          f.range["observation.taxon.rank_level"].gte === 0 &&
          f.range["observation.taxon.rank_level"].lte === 30;
      })).to.not.be.undefined;
    });

    it( "filters by d1/d2", ( ) => {
      Q( { d1: "2016-01-01T01:00:00", d2: "2017-01-01T01:00:00" }, ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range.created_at &&
          f.range.created_at.gte === "2016-01-01T01:00:00+00:00" &&
          f.range.created_at.lte === "2017-01-01T01:00:00+00:00";
      })).to.not.be.undefined;
    });

    it( "filters by observed_d1/d2", ( ) => {
      Q( { observed_d1: "2016-01-01T01:00:00", observed_d2: "2017-01-01T01:00:00" },
        ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.bool && f.bool.should[0].bool.filter[0].range["observation.time_observed_at"];
      })).to.not.be.undefined;
    });

    it( "filters by observation_created_d1/d2", ( ) => {
      Q( { observation_created_d1: "2016-01-01T01:00:00",
           observation_created_d2: "2017-01-01T01:00:00" },
         ( e, q ) => ( eq = q ) );
      expect( _.detect( eq.filters, f => {
        return f.range && f.range["observation.created_at"] &&
          f.range["observation.created_at"].gte === "2016-01-01T01:00:00+00:00" &&
          f.range["observation.created_at"].lte === "2017-01-01T01:00:00+00:00";
      })).to.not.be.undefined;
    });

    it( "sorts by created_at desc by default", ( ) => {
      Q( { }, ( e, q ) => ( eq = q ) );
      expect( eq.sort ).to.deep.eq( { created_at: "desc" } );
    });

    it( "can sort ascending", ( ) => {
      Q( { order: "asc" }, ( e, q ) => ( eq = q ) );
      expect( eq.sort ).to.deep.eq( { created_at: "asc" } );
    });

    it( "can sort by id", ( ) => {
      Q( { order_by: "id" }, ( e, q ) => ( eq = q ) );
      expect( eq.sort ).to.deep.eq( { id: "desc" } );
    });
  });

  describe( "search", ( ) => {
    it( "returns identifications", done => {
      IdentificationsController.search( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq( fixtures.elasticsearch.identifications.identification.length );
        done( );
      });
    });
  });

  describe( "show", ( ) => {
    it( "returns identifications", done => {
      IdentificationsController.show( { params: { id: "102" }, query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(1);
        done( );
      });
    });
  });

  describe( "categories", ( ) => {
    it( "returns identification counts grouped by category", done => {
      IdentificationsController.categories( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(
          _.uniq( _.filter( fixtures.elasticsearch.identifications.identification, i => i.category ), i => i.category ).length
        );
        expect(r.results[0].category).to.eq( "leading" );
        expect(r.results[0].count).to.eq(
          _.filter( fixtures.elasticsearch.identifications.identification, i => i.category === "leading" ).length
        );
        done( );
      });
    });
  });


  describe( "speciesCounts", ( ) => {
    it( "returns taxa", done => {
      IdentificationsController.speciesCounts( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(
          _.uniq( _.filter( fixtures.elasticsearch.identifications.identification, i => i.taxon ), i => i.taxon.id ).length
        );
        expect(r.results[0].count).to.above(0);
        expect(r.results[0].taxon.id).to.eq(5);
        done( );
      });
    });
  });

  describe( "identifiers", ( ) => {
    it( "returns identification counts grouped by identifier", done => {
      IdentificationsController.identifiers( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(
          _.uniq( _.filter( fixtures.elasticsearch.identifications.identification, i => i.user ), i => i.user.id ).length
        );
        expect(r.results[0].count).to.eq(1);
        expect(r.results[0].user.id).to.not.be.undefined;
        done( );
      });
    });
  });

  describe( "observers", ( ) => {
    it( "returns identification counts grouped by observer", done => {
      IdentificationsController.observers( { query: { } }, ( e, r ) => {
        expect(r.total_results).to.eq(
          _.uniq( _.filter( fixtures.elasticsearch.identifications.identification, i => i.observation ), i => i.observation.user.id ).length
        );
        expect(r.results[0].count).to.eq(1);
        expect(r.results[0].user.id).to.not.be.undefined;
        done( );
      });
    });
  });

});