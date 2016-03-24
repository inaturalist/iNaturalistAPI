"use strict";
var _ = require( "underscore" ),
   memoryCache = require( "memory-cache" ),
   squel = require( "squel" ),
   esClient = require( "../es_client" ),
   pgClient = require( "../pg_client" ),
   Model = require( "./model" );

var Taxon = class Taxon extends Model {

  constructor( attrs ) {
    super( attrs );
    if( this.iconic_taxon_id ) {
      var iconicTaxon = Taxon.iconicTaxaByID[ this.iconic_taxon_id.toString( ) ];
      if( iconicTaxon ) {
        this.iconic_taxon_name = iconicTaxon.name;
      }
    }
  }

  preferredCommonName( options ) {
    options = options || { };
    options.locale = ( options.locale || "en" ).split( "-" )[0];
    var nameInLocale;
    var nameInPlace;
    var nameInAncestorPlace;
    _.each( this.names, function( n ) {
      if( options.preferredPlace && n.place_taxon_names ) {
        if( _.find( n.place_taxon_names, function( ptn ) {
            return ptn.place_id === options.preferredPlace.id; })) {
          nameInPlace = n.name;
        } else if( _.find( n.place_taxon_names, function( ptn ) {
            return _.contains( options.preferredPlace.ancestor_place_ids, ptn.place_id ); })) {
          nameInAncestorPlace = n.name;
        }
      }
      if( !nameInLocale && n.locale === options.locale ) { nameInLocale = n.name; }
    });
    nameInLocale = nameInPlace || nameInAncestorPlace || nameInLocale;
    if( options.defaultToEnglish === true &&
        !nameInLocale && options.locale != "en" ) {
      return this.preferredCommonName( _.extend( { }, options, { locale: "en" } ) );
    }
    return nameInLocale;
  }

  conservationStatus( place ) {
    var globalStatus = 0;
    var localStatus = 0;
    var ancestorStatus = 0;
    _.each( this.statuses, function( s ) {
      if( !s.iucn || s.iucn <= Taxon.IUCN_LEAST_CONCERN ) { return; }
      if( place ) {
        if( _.contains( place.ancestor_place_ids, s.place_id ) && s.iucn > ancestorStatus ) {
          ancestorStatus = s;
        }
        if( s.place_id == place.id && s.iucn > localStatus ) {
          localStatus = s;
        }
      }
      if( !s.place_id && s.iucn > globalStatus ) {
        globalStatus = s;
      }
    });
    var status = localStatus || ancestorStatus || globalStatus;
    if( status ) { return status; }
  }

  establishmentMeans( place ) {
    if( !place ) { return; }
    var localMeans;
    var ancestorMeans;
    _.each( this.listed_taxa, function( lt ) {
      if( !lt.establishment_means ) { return; }
      if( lt.place_id == place.id && !localMeans ) {
        localMeans = lt;
      }
      if( _.contains( place.ancestor_place_ids, lt.place_id ) && !ancestorMeans ) {
        ancestorMeans = lt;
      }
    });
    var means = localMeans || ancestorMeans;
    if( means ) { return means; }
  }

  prepareForResponse( localeOpts ) {
    localeOpts = localeOpts || { };
    localeOpts.locale = ( localeOpts.locale || "en" ).split( "-" )[0];
    this.preferred_common_name = this.preferredCommonName( localeOpts );
    if( localeOpts.locale != "en" ) {
      this.english_common_name = this.preferredCommonName(
        _.extend( localeOpts, { locale: "en" } ));
    }
    var cs, em;
    if(( cs = this.conservationStatus( localeOpts.place || localeOpts.preferredPlace ))) {
      this.conservation_status = cs;
      this.conservation_status.status = Taxon.IUCN_STATUSES[ cs.iucn ];
      delete this.conservation_status.iucn;
      this.preferred_conservation_status = Taxon.IUCN_STATUSES[ cs.iucn ];
    }
    if(( em = this.establishmentMeans( localeOpts.place || localeOpts.preferredPlace ))) {
      this.establishment_means = em;
      this.preferred_establishment_means = em.establishment_means;
    }
    // these arrays have already been used to prepare the above attributes,
    // so remove these values to reduce the size of the response
    delete this.names;
    delete this.statuses;
    delete this.listed_taxa;
    delete this.place_ids;
    delete this.colors;
  }

  static findByID( id, callback ) {
    if( !Number( id ) ) {
      return callback({ messsage: "invalid taxon_id", status: 422 });
    }
    var cacheKey = "taxa." + id;
    var taxon = memoryCache.get( cacheKey );
    if( !_.isNull( taxon ) ) { return callback( null, taxon ); }
    esClient.search( "taxa", { body: { query: { term: { id: id } } } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        // setting taxon to false, since null can't be cached
        var taxon = results.hits.hits[0] ? results.hits.hits[0]._source : false;
        memoryCache.put( cacheKey, taxon, 3600000 ); // 1 hour
        callback( null, taxon );
    });
  }

  static loadIconicTaxa( callback ) {
    var names = [
      "Animalia", "Amphibia", "Reptilia", "Aves", "Mammalia",
      "Actinopterygii", "Mollusca", "Arachnida", "Insecta",
      "Fungi", "Plantae", "Protozoa", "Chromista"
    ];
    var iconicTaxaNames = _.object( names, [ ] );
    var iconicTaxaByName = { };
    var iconicTaxaIDs = { };
    var query = squel.select( ).field( "id, name ").from( "taxa" ).
      where( "name IN ?", _.keys( iconicTaxaNames ) ).
      order( "observations_count", false );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        // setting user to false, since null can't be cached
        _.each( result.rows, function( r ) {
          if( iconicTaxaByName[ r.name.toLowerCase( ) ] === undefined ) {
            iconicTaxaByName[ r.name.toLowerCase( ) ] = r;
            iconicTaxaIDs[ r.id ] = r;
          }
        });
        Taxon.iconicTaxaByName = iconicTaxaByName;
        Taxon.iconicTaxaByID = iconicTaxaIDs;
        if( callback ) { callback( ); }
      }
    );
  }

  static iconicTaxonColor( nameOrID ) {
    var t = Taxon.iconicTaxaByID[ nameOrID.toString( ) ];
    if( !t && _.isString( nameOrID ) ) { t = Taxon.iconicTaxaByName[ nameOrID.toLowerCase( ) ]; }
    if( t ) {
      return Taxon.iconicTaxonColorsByName[ t.name.toLowerCase( ) ];
    }
  }

  static iconicTaxonID( nameOrID ) {
    var t = Taxon.iconicTaxaByID[ nameOrID.toString( ) ];
    if( !t && _.isString( nameOrID ) ) { t = Taxon.iconicTaxaByName[ nameOrID.toLowerCase( ) ]; }
    if( t ) { return t.id; }
  }
};

Taxon.modelName = "taxon";
Taxon.tableName = "taxa";

Taxon.iconicTaxaByName = { };
Taxon.iconicTaxaByID = { };

Taxon.IUCN_LEAST_CONCERN = 10;
Taxon.IUCN_STATUSES = {
  0: "NE",
  5: "DD",
  10: "LC",
  20: "NT",
  30: "VU",
  40: "EN",
  50: "CR",
  60: "EW",
  70: "EX"
};

Taxon.iconicTaxonColorsByName = {
  animalia: "#1E90FF",
  amphibia: "#1E90FF",
  reptilia: "#1E90FF",
  aves: "#1E90FF",
  mammalia: "#1E90FF",
  actinopterygii: "#1E90FF",
  mollusca: "#FF4500",
  arachnida: "#FF4500",
  insecta: "#FF4500",
  fungi: "#FF1493",
  plantae: "#73AC13",
  protozoa: "#691776",
  chromista: "#993300"
};

Taxon.ranks = {
  "root": 100,
  "kingdom": 70,
  "phylum": 60,
  "subphylum": 57,
  "superclass": 53,
  "class": 50,
  "subclass": 47,
  "superorder": 43,
  "order": 40,
  "suborder": 37,
  "infraorder": 35,
  "superfamily": 33,
  "epifamily": 32,
  "family": 30,
  "subfamily": 27,
  "supertribe": 26,
  "tribe": 25,
  "subtribe": 24,
  "genus": 20,
  "genushybrid": 20,
  "species": 10,
  "hybrid": 10,
  "subspecies": 5,
  "variety": 5,
  "form": 5
};
module.exports = Taxon;
