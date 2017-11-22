"use strict";
var _ = require( "lodash" ),
   squel = require( "squel" ).useFlavour( "postgres" ),
   util = require( "../util" ),
   esClient = require( "../es_client" ),
   pgClient = require( "../pg_client" ),
   Model = require( "./model" ),
   User = require( "./user" ),
   ESModel = require( "./es_model" );

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
    if (
      options.prefersCommonNames === false ||
      ( options.userSession && options.userSession.prefersCommonNames === false )
    ) {
      return;
    }
    if ( options.locale ) {
      options.locale = options.locale.split( "-" )[0];
    }
    var nameInLocale;
    var nameInPlace;
    var nameInAncestorPlace;
    var namesInLocale = [];
    var namesInPlace = [];
    var namesInAncestorPlace = [];
    _.each( this.names, function( n ) {
      if ( n.locale === options.locale ) {
        namesInLocale.push( Object.assign( { }, n, { sortKey: n.position } ) );
      }
      if ( options.preferredPlace && n.place_taxon_names ) {
        var ptn = _.find( n.place_taxon_names, ptn => ptn.place_id === options.preferredPlace.id );
        if ( ptn ) {
          namesInPlace.push( Object.assign( { }, n, { sortKey: ptn.position } ) );
        } else {
          var ancestorPtn = _.find( n.place_taxon_names, ptn => (
            _.includes( options.preferredPlace.ancestor_place_ids, ptn.place_id )
          ) );
          if ( ancestorPtn ) {
            namesInAncestorPlace.push( Object.assign( { }, n, {
              sortKey: ancestorPtn.position
            } ) );
          }
        }
      }
    });
    if ( namesInPlace.length > 0 ) {
      let sortedNamesInPlace = _.sortBy( namesInPlace, n => n.sortKey );
      let nameInPlaceInLocale = _.find( sortedNamesInPlace, n => n.locale === options.locale );
      if ( nameInPlaceInLocale ) {
        nameInPlace = nameInPlaceInLocale.name;
      } else {
        nameInPlace = sortedNamesInPlace[0].name;
      }
    }
    if ( namesInAncestorPlace.length > 0 ) {
      let sortedNamesInAncestorPlace = _.sortBy( namesInAncestorPlace, n => n.sortKey );
      let nameInAncestorPlaceInLocale = _.find( sortedNamesInAncestorPlace, n => n.locale === options.locale );
      if ( nameInAncestorPlaceInLocale ) {
        nameInAncestorPlace = nameInAncestorPlaceInLocale.name;
      } else {
        nameInAncestorPlace = sortedNamesInAncestorPlace[0].name;
      }
    }
    if ( namesInLocale.length > 0 ) {
      nameInLocale = _.sortBy( namesInLocale, n => n.sortKey )[0].name;
    }
    nameInLocale = nameInPlace || nameInAncestorPlace || nameInLocale;
    if (
      ( options.defaultToEnglish === true || !options.locale ) &&
      !nameInLocale &&
      options.locale != "en"
    ) {
      return this.preferredCommonName( _.extend( { }, options, { locale: "en" } ) );
    }
    return nameInLocale;
  }

  conservationStatus( place, options = {} ) {
    var globalStatus = 0;
    var localStatus = 0;
    var ancestorStatus = 0;
    var statuses = options.statuses || this.statuses;
    _.each( statuses, function( s ) {
      if( !s.iucn || s.iucn <= Taxon.IUCN_LEAST_CONCERN ) { return; }
      var statusPlaceId = s.place ? s.place.id : s.place_id;
      if( place ) {
        if( _.includes( place.ancestor_place_ids, statusPlaceId ) && s.iucn > ancestorStatus ) {
          ancestorStatus = s;
        }
        if( statusPlaceId == place.id && s.iucn > localStatus ) {
          localStatus = s;
        }
      }
      if( !statusPlaceId && s.iucn > globalStatus ) {
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
      if( _.includes( place.ancestor_place_ids, lt.place_id ) && !ancestorMeans ) {
        ancestorMeans = lt;
      }
    });
    var means = localMeans || ancestorMeans;
    if( means ) { return means; }
  }

  prepareForResponse( localeOpts, options ) {
    localeOpts = Object.assign( { }, localeOpts );
    options = Object.assign( { }, options );
    localeOpts.locale = ( localeOpts.locale || "en" ).split( "-" )[0];
    this.preferred_common_name = this.preferredCommonName( localeOpts );
    if( this.default_photo ) {
      this.default_photo.url = util.fix_https( this.default_photo.url );
      this.default_photo.medium_url = util.fix_https( this.default_photo.medium_url );
      this.default_photo.square_url = util.fix_https( this.default_photo.square_url );
    }
    if( this.taxon_photos ) {
      _.each( this.taxon_photos, tp => {
        tp.photo.url = util.fix_https( tp.photo.url );
        tp.photo.original_url = util.fix_https( tp.photo.original_url );
        tp.photo.large_url = util.fix_https( tp.photo.large_url );
        tp.photo.medium_url = util.fix_https( tp.photo.medium_url );
        tp.photo.small_url = util.fix_https( tp.photo.small_url );
        tp.photo.square_url = util.fix_https( tp.photo.square_url );
        tp.photo.native_page_url = util.fix_https( tp.photo.native_page_url );
      });
    }
    if( localeOpts.locale != "en" ) {
      this.english_common_name = this.preferredCommonName(
        _.extend( localeOpts, { locale: "en" } ));
    }
    var cs, em;
    if(( cs = this.conservationStatus( localeOpts.place || localeOpts.preferredPlace ))) {
      this.conservation_status = cs;
    }
    if(( em = this.establishmentMeans( localeOpts.place || localeOpts.preferredPlace ))) {
      this.establishment_means = em;
      this.preferred_establishment_means = em.establishment_means;
    }
    // these arrays have already been used to prepare the above attributes,
    // so remove these values to reduce the size of the response
    if( !options.names ) {
      delete this.names;
    }
    delete this.statuses;
    delete this.listed_taxa;
    delete this.place_ids;
    delete this.colors;
    delete this.ancestors;
  }

  static findByID( id, callback ) {
    if( !Number( id ) ) {
      return callback({ messsage: "invalid taxon_id", status: 422 });
    }
    esClient.search( "taxa", { body: { query: { term: { id: id } } } },
      function( err, results ) {
        if( err ) { return callback( err ); }
        var taxon = results.hits.hits[0] ? results.hits.hits[0]._source : null;
        callback( null, taxon );
    });
  }

  static loadIconicTaxa( callback ) {
    var names = [
      "Animalia", "Amphibia", "Reptilia", "Aves", "Mammalia",
      "Actinopterygii", "Mollusca", "Arachnida", "Insecta",
      "Fungi", "Plantae", "Protozoa", "Chromista"
    ];
    var iconicTaxaNames = _.zipObject( names, [ ] );
    var iconicTaxaByName = { };
    var iconicTaxaIDs = { };
    var query = squel.select( ).field( "id, name ").from( "taxa" ).
      where( "name IN ?", _.keys( iconicTaxaNames ) ).
      order( "observations_count", false );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
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
    if ( !nameOrID ) { return Taxon.defaultColor; }
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

  static assignConservationStatuses( taxa, options, callback ) {
    options = Object.assign( { }, options );
    if( !options.details ) { return callback( null, taxa ); }
    var ids = _.compact( _.uniq( _.flatMapDeep( taxa, t => [t.ancestor_ids, t.id] ) ) );
    if( _.isEmpty( ids ) ) {
      return callback( null, taxa );
    }
    var query = squel.select( ).
      field( "cs.taxon_id ").
      field( "cs.status" ).
      field( "cs.authority" ).
      field( "cs.iucn" ).
      field( "cs.url" ).
      field( "cs.description" ).
      field( "cs.place_id" ).
      field( "p.name", "place_name" ).
      field( "p.display_name", "place_display_name" ).
      field( "p.ancestry", "place_ancestry" ).
      field( "p.admin_level", "place_admin_level" ).
      from( "conservation_statuses cs" ).
      left_join( "places p", null, "cs.place_id = p.id" ).
      where( "cs.taxon_id IN ?", ids );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var statusesByTaxonId = { };
        _.each( result.rows, r => {
          r.place = null;
          if( r.place_id ) {
            r.place = {
              id: r.place_id,
              name: r.place_name,
              display_name: r.place_display_name,
              admin_level: r.place_admin_level,
              ancestor_place_ids: _.flatten( [
                _.compact( ( r.place_ancestry || "" ).split( "/" ) ).map( i => parseInt( i ) ),
                r.place_id
              ] )
            }
          }
          delete r.place_id;
          delete r.place_name;
          delete r.place_display_name;
          delete r.place_ancestry;
          delete r.place_admin_level;
          statusesByTaxonId[ r.taxon_id ] = statusesByTaxonId[ r.taxon_id ] || [ ];
          statusesByTaxonId[ r.taxon_id ].push( r );
        });
        _.each( taxa, t => {
          const selfAndAncestorIds = _.reverse( _.uniq( _.flatten( [t.ancestor_ids, t.id] ) ) );
          t.conservation_statuses = _.compact( _.flatMap( selfAndAncestorIds, aid => statusesByTaxonId[aid] ) );
          if ( t.conservation_status && t.conservation_statuses.length > 0 ) {
            const csCandidate = _.find( t.conservation_statuses, status => {
              return (
                ( status.place && status.place.id || null ) === 
                  ( t.conservation_status.place && t.conservation_status.place.id || null ) &&
                status.authority.toLowerCase( ) === t.conservation_status.authority.toLowerCase( ) &&
                status.status.toLowerCase( ) === t.conservation_status.status.toLowerCase( )
              );
            } );
            if ( csCandidate ) {
              t.conservation_status = csCandidate;
            }
          } else if ( options.localeOpts && t.conservation_statuses.length > 0 ) {
            t.conservation_status = t.conservationStatus(
              options.localeOpts.place || options.localeOpts.preferredPlace,
              { statuses: t.conservation_statuses }
            )
          }
        } );
        callback( null, taxa );
      }
    );
  }

  static assignListedTaxa( taxa, options, callback ) {
    options = Object.assign( { }, options );
    if( !options.details ) { return callback( null, taxa ); }
    var ids = _.compact( _.map( taxa, "id" ) );
    if( _.isEmpty( ids ) ) {
      return callback( null, taxa );
    }
    var query = squel.select( ).
      field( "lt.id, lt.taxon_id, lt.establishment_means, lt.list_id, l.title list_title, " +
        "lt.place_id, p.name place_name, p.display_name place_display_name, " + 
        "p.ancestry place_ancestry, p.admin_level place_admin_level" ).
      from( "listed_taxa lt" ).
      left_join( "places p", null, "lt.place_id = p.id" ).
      left_join( "lists l", null, "lt.list_id = l.id" ).
      where( "lt.taxon_id IN ?", ids ).
      where( "lt.place_id IS NOT NULL AND lt.establishment_means IS NOT NULL" );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var byTaxonID = { };
        _.each( result.rows, r => {
          r.place = r.place_id ? {
            id: r.place_id,
            name: r.place_name,
            display_name: r.place_display_name,
            admin_level: r.place_admin_level,
            ancestor_place_ids: _.flatten( [
              _.compact( ( r.place_ancestry || "" ).split( "/" ) ).map( i => parseInt( i ) ),
              r.place_id
            ] )
          } : null;
          delete r.place_id;
          delete r.place_name;
          delete r.place_display_name;
          delete r.place_ancestry;
          delete r.place_admin_level;
          r.list = r.list_id ? { id: r.list_id, title: r.list_title } : null;
          delete r.list_id;
          delete r.list_title;
          byTaxonID[ r.taxon_id ] = byTaxonID[ r.taxon_id ] || [ ];
          byTaxonID[ r.taxon_id ].push( r );
        });
        _.each( taxa, t => t.listed_taxa = byTaxonID[ t.id ] );
        callback( null, taxa );
      }
    );
  }

  static assignWikipediaSummary( taxa, options, callback ) {
    if( !options.details ) { return callback( null, taxa ); }
    var ids = _.compact( _.map( taxa, "id" ) );
    if( _.isEmpty( ids ) ) { return callback( null, taxa ); }
    var query = squel.select( ).
      field( "t.id, t.wikipedia_summary, td.locale, td.body" ).
      from( "taxa t" ).
      left_join( "taxon_descriptions td", null, "t.id = td.taxon_id" ).
      where( "t.id IN ?", ids );
    pgClient.connection.query( query.toString( ),
      function( err, result ) {
        if( err ) { return callback( err ); }
        var byTaxonID = { };
        _.each( result.rows, r => {
          byTaxonID[ r.id ] = byTaxonID[ r.id ] || [];
          if ( r.body ) {
            byTaxonID[ r.id ].push({ locale: r.locale.toLowerCase( ), body: r.body });
          }
          byTaxonID[ r.id ].push({ locale: "en", body: r.wikipedia_summary });
        });
        _.each( _.compact( taxa ), t => {
          if ( byTaxonID[ t.id ] ) {
            let summary = _.find( byTaxonID[ t.id ], d => d.locale === options.locale );
            if ( _.isEmpty( summary ) ) {
              const localePrefix = options.locale.split( "-" )[0];
              summary = _.find( byTaxonID[ t.id ], d => _.startsWith( d.locale, `${localePrefix}` ) );
            }
            if ( summary ) { t.wikipedia_summary = summary.body; }
          }
          if( !t.wikipedia_summary || t.wikipedia_summary.match( /^\d\d\d\d-\d\d-\d\d$/ ) ) {
            t.wikipedia_summary = null;
          }
        });
        callback( null, taxa );
      }
    );
  }

  static assignTaxonCurators( taxa, options, callback ) {
    if( !options.details ) { return callback( null, taxa ); }
    var ancestorIds = _.uniq( _.compact( _.flattenDeep( _.map( taxa, t => [t.id, t.ancestor_ids] ) ) ) );
    if( _.isEmpty( ancestorIds ) ) { return callback( null, taxa ); }
    var query = squel.select( ).
      field( "tc.user_id" ).
      field( "tc.taxon_id" ).
      field( "t.complete_rank" ).
      from( "taxon_curators", "tc" ).
      left_join( "taxa", "t", "t.id = tc.taxon_id" ).
      where( "tc.taxon_id IN ?", ancestorIds );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return callback( err ); }
      const curatorsWithRanks = result.rows.map( r => {
        const curator = Object.assign( {}, r );
        curator.completeRankLevel = Taxon.ranks[r.complete_rank];
        return curator;
      } );
      const usersByID = {};
      _.each( _.compact( taxa ), taxon => {
        const curatorsOfTaxon = _.filter( curatorsWithRanks, curator => {
          const curatorOfAncestor = curator.taxon_id === taxon.id || taxon.ancestor_ids.indexOf( curator.taxon_id ) >= 0;
          const curatorOfRank = !curator.completeRankLevel || curator.completeRankLevel <= taxon.rank_level;
          return curatorOfAncestor && curatorOfRank;
        } );
        if ( curatorsOfTaxon.length > 0 ) {
          taxon.taxon_curators = curatorsOfTaxon;
          _.each( curatorsOfTaxon, c => usersByID[c.user_id] = usersByID[c.user_id] || { id: c.user_id } );
        }
      } );
      User.findByIDInES( _.keys( usersByID ), ( err, users ) => {
        if ( err ) { return callback( err ); }
        _.each( _.compact( taxa ), taxon => {
          _.each( taxon.taxon_curators, c => {
            c.user = new User( _.find( users, u => u.id === c.user_id ) );
            delete c.user_id;
            delete c.taxon_id;
            delete c.complete_rank;
          } );
        } );
        callback( null, taxa )
      } );
    } );
  }

  static preloadPhotosInto( taxa, options, callback ) {
    options = options || { };
    var prepareTaxon = t => t.prepareForResponse( options.localeOpts );
    var taxonPhotos = _.flatten( _.map( taxa, t => t.taxon_photos ) );
    var taxonOpts = { modifier: prepareTaxon, source: { excludes: [ "photos", "taxon_photos" ] } };
    ESModel.fetchBelongsTo( taxonPhotos, Taxon, taxonOpts, callback );
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

Taxon.defaultColor = "#585858";

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
