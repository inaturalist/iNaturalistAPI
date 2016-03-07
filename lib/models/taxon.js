var _ = require( "underscore" ),
   memoryCache = require( "memory-cache" ),
   esClient = require( "../es_client" ),
   Taxon = { };

Taxon = function( attrs ) {
  var that = this;
  _.each( attrs, function( value, attr ) {
    that[ attr ] = value;
  });
};

Taxon.modelName = "taxon";
Taxon.tableName = "taxa";

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

Taxon.prototype.preferredCommonName = function( options ) {
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
};

Taxon.prototype.conservationStatus = function( place ) {
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
};

Taxon.prototype.establishmentMeans = function( place ) {
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
};

Taxon.prototype.prepareForResponse = function( localeOpts ) {
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
};

Taxon.findByID = function( id, callback ) {
  if( !parseInt( id ) ) {
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
};

module.exports = Taxon;
