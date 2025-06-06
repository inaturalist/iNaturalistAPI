const _ = require( "lodash" );
const squel = require( "safe-squel" ).useFlavour( "postgres" );
const PromisePool = require( "es6-promise-pool" );
const util = require( "../util" );
const pgClient = require( "../pg_client" );
const esClient = require( "../es_client" );
const Model = require( "./model" );
const ESModel = require( "./es_model" );
const User = require( "./user" );
const RedisCacheClient = require( "../redis_cache_client" );

const Taxon = class Taxon extends Model {
  constructor( attrs ) {
    super( attrs );
    if ( this.iconic_taxon_id ) {
      const iconicTaxon = Taxon.iconicTaxaByID[this.iconic_taxon_id.toString( )];
      if ( iconicTaxon ) {
        this.iconic_taxon_name = iconicTaxon.name;
      }
    }
  }

  preferredCommonNameByPriority( taxonNamePriority, options = { } ) {
    const namesInLexicon = [];
    const namesInPlace = [];
    const namesInAncestorPlace = [];
    _.each( this.names, n => {
      if ( taxonNamePriority.lexicon ) {
        if ( n.lexicon === taxonNamePriority.lexicon ) {
          namesInLexicon.push( { ...n, sortKey: n.position } );
        }
      } else if ( options.locale
        && n.locale
        && n.locale.toLowerCase( ) === options.locale.toLowerCase( )
      ) {
        namesInLexicon.push( { ...n, sortKey: n.position } );
      }
      if ( taxonNamePriority.place_id && n.place_taxon_names ) {
        const ptn = _.find( n.place_taxon_names,
          pn => pn.place_id === taxonNamePriority.place_id );
        if ( ptn ) {
          namesInPlace.push( { ...n, sortKey: ptn.position } );
        } else {
          const ancestorPtn = _.find( n.place_taxon_names, pn => (
            _.includes( taxonNamePriority.ancestor_place_ids, pn.place_id )
          ) );
          if ( ancestorPtn ) {
            namesInAncestorPlace.push( { ...n, sortKey: ancestorPtn.position } );
          }
        }
      }
    } );
    let nameInLexicon;
    let nameInPlace;
    let nameInPlaceInLexicon;
    let nameInAncestorPlaceInLexicon;
    if ( namesInPlace.length > 0 ) {
      const sortedNamesInPlace = _.sortBy( namesInPlace, n => n.sortKey );
      if ( sortedNamesInPlace.length > 0 ) {
        nameInPlace = sortedNamesInPlace[0];
      }
      if ( taxonNamePriority.lexicon ) {
        nameInPlaceInLexicon = _.find(
          sortedNamesInPlace, n => n.lexicon === taxonNamePriority.lexicon
        );
      } else if ( options.locale ) {
        nameInPlaceInLexicon = _.find(
          sortedNamesInPlace, n => n.locale === options.locale
        );
      }
    }
    if ( namesInAncestorPlace.length > 0 ) {
      const sortedNamesInAncestorPlace = _.sortBy( namesInAncestorPlace, n => n.sortKey );
      if ( taxonNamePriority.lexicon ) {
        nameInAncestorPlaceInLexicon = _.find(
          sortedNamesInAncestorPlace, n => n.lexicon === taxonNamePriority.lexicon
        );
      } else if ( options.locale ) {
        nameInAncestorPlaceInLexicon = _.find(
          sortedNamesInAncestorPlace, n => n.locale === options.locale
        );
      }
    }
    if ( namesInLexicon.length > 0 ) {
      nameInLexicon = _.sortBy( namesInLexicon, n => n.sortKey )[0];
    }
    nameInLexicon = nameInPlaceInLexicon
      || ( !taxonNamePriority.lexicon && nameInPlace )
      || nameInAncestorPlaceInLexicon
      || nameInLexicon;
    if ( nameInLexicon ) {
      return nameInLexicon;
    }
    // e.g. locale is en-US and no en-US names were found, so look instead for en
    if ( !taxonNamePriority.lexicon && options.locale && options.locale.match( /-/ ) ) {
      const nameInBaseLocale = this.preferredCommonNameByPriority(
        taxonNamePriority, { locale: options.locale.split( "-" )[0] }
      );
      if ( nameInBaseLocale ) {
        return nameInBaseLocale;
      }
    }
    return null;
  }

  preferredCommonNames( options = { } ) {
    if ( !options.userSession
      || options.userSession.prefersCommonNames === false
      || _.isEmpty( options.userSession.taxonNamePriorities ) ) {
      return null;
    }
    const preferredCommonNames = [];
    _.each( _.sortBy( options.userSession.taxonNamePriorities, "position" ), taxonNamePriority => {
      const preferredName = this.preferredCommonNameByPriority( taxonNamePriority, options );
      if ( preferredName ) {
        preferredCommonNames.push( preferredName );
      }
    } );
    return preferredCommonNames;
  }

  preferredCommonName( opts = { } ) {
    const options = { ...opts };
    if ( options.prefersCommonNames === false
         || ( options.userSession && options.userSession.prefersCommonNames === false )
    ) {
      return null;
    }
    const stubTaxonNamePriority = {
      lexicon: null
    };
    if ( options.preferredPlace ) {
      stubTaxonNamePriority.place_id = options.preferredPlace.id;
      stubTaxonNamePriority.ancestor_place_ids = options.preferredPlace.ancestor_place_ids;
    }
    const preferredTaxonName = this.preferredCommonNameByPriority(
      stubTaxonNamePriority, { locale: options.locale }
    );
    if ( preferredTaxonName ) {
      return preferredTaxonName.name;
    }
    return null;
  }

  conservationStatus( place, options = {} ) {
    let globalStatus = 0;
    let localStatus = 0;
    let ancestorStatus = 0;
    const statuses = options.statuses || this.statuses;
    _.each( statuses, s => {
      if ( !s.iucn || s.iucn <= Taxon.IUCN_LEAST_CONCERN ) { return; }
      const statusPlaceId = s.place ? s.place.id : s.place_id;
      if ( place ) {
        if ( _.includes( place.ancestor_place_ids, statusPlaceId ) && s.iucn > ancestorStatus ) {
          ancestorStatus = s;
        }
        if ( statusPlaceId === place.id && s.iucn > localStatus ) {
          localStatus = s;
        }
      }
      if ( !statusPlaceId && s.iucn > globalStatus ) {
        globalStatus = s;
      }
    } );
    const status = localStatus || ancestorStatus || globalStatus || null;
    return status;
  }

  establishmentMeans( place ) {
    if ( !place ) { return null; }
    let localMeans;
    let ancestorMeans;
    _.each( this.listed_taxa, lt => {
      if ( !lt.establishment_means ) { return; }
      if ( lt.place_id === place.id && !localMeans ) {
        localMeans = lt;
      }
      if ( _.includes( place.ancestor_place_ids, lt.place_id ) && !ancestorMeans && !_.includes( ["native", "endemic"], lt.establishment_means ) ) {
        ancestorMeans = lt;
      }
    } );
    return localMeans || ancestorMeans;
  }

  prepareForResponse( localeOptions = { }, opts = { } ) {
    const localeOpts = { ...localeOptions };
    const options = { ...opts };
    const userPreferredCommonNames = this.preferredCommonNames( localeOpts );
    // default to undefined which will not include these attributes in the response,
    // rather than including them with a value of `null` which was causing the Android
    // app to erronously present the common name as the string "null"
    this.preferred_common_names = _.defaultTo( userPreferredCommonNames, undefined );
    if ( _.isNull( userPreferredCommonNames ) ) {
      // userPreferredCommonNames is null, so taxonNamePriorities weren't used. Lookup
      // preferred_common_name based on requested locale and preferredPlace
      this.preferred_common_name = _.defaultTo( this.preferredCommonName( localeOpts ), undefined );
    } else if ( _.isEmpty( userPreferredCommonNames ) ) {
      // userPreferredCommonNames is empty, so taxonNamePriorities were used but
      // there weren't any matching names. Set preferred_common_name to undefined
      this.preferred_common_name = undefined;
    } else {
      // userPreferredCommonNames is not empty, so concatenate its values for preferred_common_names
      this.preferred_common_name = _.join( _.uniq( _.map( this.preferred_common_names, "name" ) ), " · " );
    }
    if ( this.default_photo ) {
      this.default_photo.url = util.fixHttps( this.default_photo.url );
      this.default_photo.medium_url = util.fixHttps( this.default_photo.medium_url );
      this.default_photo.square_url = util.fixHttps( this.default_photo.square_url );
    }
    if ( this.taxon_photos ) {
      _.each( this.taxon_photos, tp => {
        tp.photo.url = util.fixHttps( tp.photo.url );
        tp.photo.original_url = util.fixHttps( tp.photo.original_url );
        tp.photo.large_url = util.fixHttps( tp.photo.large_url );
        tp.photo.medium_url = util.fixHttps( tp.photo.medium_url );
        tp.photo.small_url = util.fixHttps( tp.photo.small_url );
        tp.photo.square_url = util.fixHttps( tp.photo.square_url );
        tp.photo.native_page_url = util.fixHttps( tp.photo.native_page_url );
      } );
    }
    if ( localeOpts.locale !== "en" ) {
      this.english_common_name = _.defaultTo( this.preferredCommonName(
        { ...localeOpts, locale: "en" }
      ), undefined );
    }
    const cs = this.conservationStatus( localeOpts.place || localeOpts.preferredPlace );
    if ( cs ) {
      this.conservation_status = cs;
    }
    const em = this.establishmentMeans( localeOpts.place || localeOpts.preferredPlace );
    if ( em ) {
      this.establishment_means = em;
      this.preferred_establishment_means = em.establishment_means;
    }
    // these arrays have already been used to prepare the above attributes,
    // so remove these values to reduce the size of the response
    if ( options.names ) {
      this.names = _.map( this.names, n => _.omit( n, ["place_taxon_names"] ) );
    } else {
      delete this.names;
    }
    delete this.statuses;
    delete this.listed_taxa;
    delete this.place_ids;
    delete this.colors;
    delete this.ancestors;
  }

  static async findByID( id, options = { } ) {
    if ( !Number( id ) ) {
      const error = Error( 422 );
      error.status = 422;
      error.custom_message = `Invalid taxon_id: ${id}`;
      throw error;
    }

    const fetchRequest = async ( ) => {
      const getResponse = await esClient.mget( [id], "taxa", {
        source: { _source: _.union( Taxon.esReturnFields, ["min_species_ancestry"] ) }
      } );
      return (
        _.isEmpty( getResponse )
        || _.isEmpty( getResponse.docs )
        || !getResponse.docs[0]._source
      ) ? null : getResponse.docs[0]._source;
    };
    if ( options.cache ) {
      const cacheSeconds = 60 * 60;
      const redisCacheKey = `taxon-${id}`;
      return RedisCacheClient.getOrSetJSON( redisCacheKey, cacheSeconds, fetchRequest );
    }

    return fetchRequest( );
  }

  static async loadIconicTaxa( ) {
    const iconicTaxaNames = _.zipObject( Taxon.ICONIC_TAXON_NAMES, [] );
    const iconicTaxaByName = { };
    const iconicTaxaIDs = { };
    const query = squel.select( ).field( "id, name " ).from( "taxa" )
      .where( "name IN ?", _.keys( iconicTaxaNames ) )
      .order( "observations_count", false );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    _.each( rows, r => {
      if ( iconicTaxaByName[r.name.toLowerCase( )] === undefined ) {
        iconicTaxaByName[r.name.toLowerCase( )] = r;
        iconicTaxaIDs[r.id] = r;
      }
    } );
    Taxon.iconicTaxaByName = iconicTaxaByName;
    Taxon.iconicTaxaByID = iconicTaxaIDs;
  }

  static iconicTaxonColor( nameOrID ) {
    if ( !nameOrID ) { return Taxon.defaultColor; }
    let t = Taxon.iconicTaxaByID[nameOrID.toString( )];
    if ( !t && _.isString( nameOrID ) ) { t = Taxon.iconicTaxaByName[nameOrID.toLowerCase( )]; }
    return t ? Taxon.iconicTaxonColorsByName[t.name.toLowerCase( )] : null;
  }

  static iconicTaxonID( nameOrID ) {
    let t = Taxon.iconicTaxaByID[nameOrID.toString( )];
    if ( !t && _.isString( nameOrID ) ) { t = Taxon.iconicTaxaByName[nameOrID.toLowerCase( )]; }
    return t ? t.id : null;
  }

  static async assignConservationStatuses( taxa, opts = { } ) {
    const options = { ...opts };
    if ( !options.details ) { return; }
    const ids = _.compact( _.uniq( _.flatMapDeep( taxa, t => [t.ancestor_ids, t.id] ) ) );
    if ( _.isEmpty( ids ) ) { return; }
    const query = squel.select( )
      .field( "cs.id" )
      .field( "cs.taxon_id" )
      .field( "t.name", "taxon_name" )
      .field( "t.rank", "taxon_rank" )
      .field( "cs.status" )
      .field( "cs.authority" )
      .field( "cs.iucn" )
      .field( "cs.url" )
      .field( "cs.description" )
      .field( "cs.place_id" )
      .field( "cs.source_id" )
      .field( "cs.geoprivacy" )
      .field( "cs.user_id" )
      .field( "cs.updater_id" )
      .field( "cs.created_at" )
      .field( "cs.updated_at" )
      .field( "p.name", "place_name" )
      .field( "p.display_name", "place_display_name" )
      .field( "p.ancestry", "place_ancestry" )
      .field( "p.admin_level", "place_admin_level" )
      .from( "conservation_statuses cs" )
      .left_join( "places p", null, "cs.place_id = p.id" )
      .left_join( "taxa t", null, "cs.taxon_id = t.id" )
      .where( "cs.taxon_id IN ?", ids );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    await ESModel.fetchBelongsTo( rows, User, { source: { includes: ["id", "login"] } } );
    await ESModel.fetchBelongsTo( rows, User, {
      attrName: "updater",
      foreignKey: "updater_id",
      source: { includes: ["id", "login"] }
    } );
    const statusesByTaxonId = { };
    _.each( rows, r => {
      r.place = null;
      if ( r.place_id ) {
        r.place = {
          id: r.place_id,
          name: r.place_name,
          display_name: r.place_display_name,
          admin_level: r.place_admin_level,
          ancestor_place_ids: _.flattenDeep( [
            _.compact( ( r.place_ancestry || "" ).split( "/" ) ).map( i => parseInt( i, 10 ) ),
            r.place_id
          ] )
        };
      }
      delete r.user_id;
      delete r.place_id;
      delete r.place_name;
      delete r.place_display_name;
      delete r.place_ancestry;
      delete r.place_admin_level;
      statusesByTaxonId[r.taxon_id] = statusesByTaxonId[r.taxon_id] || [];
      statusesByTaxonId[r.taxon_id].push( r );
    } );
    _.each( taxa, t => {
      const selfAndAncestorIds = _.reverse( _.uniq( _.flattenDeep( [t.ancestor_ids, t.id] ) ) );
      t.conservation_statuses = _.compact(
        _.flatMap( selfAndAncestorIds, aid => statusesByTaxonId[aid] )
      );
      if ( t.conservation_status && t.conservation_statuses.length > 0 ) {
        const csCandidate = _.find( t.conservation_statuses, status => (
          ( ( status.place && status.place.id ) || null )
            === ( ( t.conservation_status.place && t.conservation_status.place.id ) || null )
          && status.authority && t.conservation_status.authority
          && status.authority.toLowerCase( ) === t.conservation_status.authority.toLowerCase( )
          && status.status && t.conservation_status.status
          && status.status.toLowerCase( ) === t.conservation_status.status.toLowerCase( )
        ) );
        if ( csCandidate ) {
          t.conservation_status = csCandidate;
        }
      } else if ( options.localeOpts && t.conservation_statuses.length > 0 ) {
        t.conservation_status = t.conservationStatus(
          options.localeOpts.place || options.localeOpts.preferredPlace,
          { statuses: t.conservation_statuses }
        );
      }
    } );
  }

  // _.uniq can produce inconsistent results. This always chooses the earliest
  // listed taxon
  static uniqueListedTaxaByPlaceAndEstablishment( listedTaxa ) {
    const grouped = _.groupBy( listedTaxa, lt => `${lt.place.id}-${lt.establishment_means}` );
    return _.map( grouped, lts => _.sortBy( lts, "id" )[0] );
  }

  static async assignListedTaxa( taxa, opts ) {
    const options = { ...opts };
    if ( !options.details ) { return; }
    const ids = _.compact( _.map( taxa, "id" ) );
    if ( _.isEmpty( ids ) ) {
      return;
    }
    const query = squel.select( )
      .field( "lt.id, lt.taxon_id, lt.establishment_means, lt.list_id, l.title list_title, "
        + "lt.place_id, p.name place_name, p.display_name place_display_name, "
        + "p.ancestry place_ancestry, p.admin_level place_admin_level" )
      .from( "listed_taxa lt" )
      .left_join( "places p", null, "lt.place_id = p.id" )
      .left_join( "lists l", null, "lt.list_id = l.id" )
      .where( "lt.taxon_id IN ?", ids )
      .where( "lt.place_id IS NOT NULL AND lt.establishment_means IS NOT NULL" )
      .order( "p.admin_level" );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    const byTaxonID = { };
    _.each( rows, r => {
      r.place = r.place_id ? {
        id: r.place_id,
        name: r.place_name,
        display_name: r.place_display_name,
        admin_level: r.place_admin_level,
        ancestor_place_ids: _.flattenDeep( [
          _.compact( ( r.place_ancestry || "" ).split( "/" ) ).map( i => parseInt( i, 10 ) ),
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
      byTaxonID[r.taxon_id] = byTaxonID[r.taxon_id] || [];
      byTaxonID[r.taxon_id].push( r );
    } );
    _.each( taxa, t => {
      let listedTaxa = _.filter( byTaxonID[t.id] || [], lt => (
        lt.establishment_means === "introduced" || lt.establishment_means === "endemic"
      ) );
      listedTaxa = _.sortBy( listedTaxa, lt => (
        _.isNil( lt.place.admin_level ) ? 99999 : lt.place.admin_level
      ) );
      listedTaxa = Taxon.uniqueListedTaxaByPlaceAndEstablishment( listedTaxa );
      if ( listedTaxa.length < 100 ) {
        listedTaxa = listedTaxa.concat(
          _.sortBy(
            _.filter( byTaxonID[t.id] || [], lt => (
              !( lt.establishment_means === "introduced" || lt.establishment_means === "endemic" )
            ) ),
            lt => ( _.isNil( lt.place.admin_level ) ? 99999 : lt.place.admin_level )
          ).slice( 0, 100 )
        );
        listedTaxa = Taxon.uniqueListedTaxaByPlaceAndEstablishment( listedTaxa );
      }
      t.listed_taxa_count = listedTaxa.length;
      t.listed_taxa = listedTaxa.slice( 0, 100 );
    } );
  }

  static async assignWikipediaSummary( taxa, options ) {
    if ( !options.details ) { return; }
    const ids = _.compact( _.map( taxa, "id" ) );
    if ( _.isEmpty( ids ) ) { return; }
    const query = squel.select( )
      .field( "t.id, t.wikipedia_summary, t.wikipedia_title, t.name, td.locale, td.body, td.url" )
      .from( "taxa t" )
      .left_join( "taxon_descriptions td", null, "t.id = td.taxon_id" )
      .where( "t.id IN ?", ids );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    const byTaxonID = { };
    _.each( rows, r => {
      byTaxonID[r.id] = byTaxonID[r.id] || [];
      if ( r.body ) {
        byTaxonID[r.id].push( {
          locale: r.locale.toLowerCase( ),
          body: r.body,
          url: r.url
        } );
      }
      byTaxonID[r.id].push( {
        locale: "en",
        body: r.wikipedia_summary,
        url: `https://en.wikipedia.org/wiki/${r.wikipedia_title || r.name}`
      } );
    } );
    _.each( _.compact( taxa ), t => {
      if ( byTaxonID[t.id] ) {
        let summary = _.find( byTaxonID[t.id], d => d.locale === options.locale );
        if ( _.isEmpty( summary ) ) {
          const localePrefix = options.locale.split( "-" )[0];
          summary = _.find( byTaxonID[t.id], d => _.startsWith( d.locale, `${localePrefix}` ) );
        }
        if ( summary ) {
          t.wikipedia_summary = summary.body;
          t.wikipedia_url = summary.url;
        }
      }
      if ( !t.wikipedia_summary || t.wikipedia_summary.match( /^\d\d\d\d-\d\d-\d\d$/ ) ) {
        t.wikipedia_summary = null;
        t.wikipedia_url = null;
      }
    } );
  }

  static async assignVisionInclusion( taxa ) {
    // eslint-disable-next-line global-require
    const ComputervisionController = require( "../controllers/v1/computervision_controller" );
    await ComputervisionController.cacheAllTaxonAncestries( );
    _.each( _.compact( taxa ), t => {
      t.vision = ComputervisionController.modelContainsTaxonID( t.id );
    } );
  }

  static async preloadIntoTaxonPhotos( taxa, options ) {
    options = options || { };
    const prepareTaxon = t => t.prepareForResponse( options.localeOpts );
    // const taxonPhotos = _.flatten( _.map( taxa, t => t.taxon_photos ) );
    _.each( taxa, taxon => {
      _.each( taxon.taxon_photos, taxonPhoto => {
        if ( taxonPhoto.taxon_id === taxon.id ) {
          taxonPhoto.taxon = _.omit( taxon, "taxon_photos" );
        }
      } );
    } );
    const taxonPhotosNeedingTaxa = _.filter( _.compact( _.flatten(
      _.map( taxa, t => t.taxon_photos )
    ) ), taxonPhoto => _.isEmpty( taxonPhoto.taxon ) );
    const taxonOpts = {
      modifier: prepareTaxon,
      source: _.without( Taxon.esReturnFields, "default_photo" )
    };
    await ESModel.fetchBelongsTo( taxonPhotosNeedingTaxa, Taxon, taxonOpts );
  }

  static async loadReferencedTaxa( ) {
    const query = squel.select( )
      .from( "taxa" )
      .where( "is_active = ? AND name IN ?", true, ["Homo", "Homo sapiens", "Life"] )
      .order( "id" );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    _.each( rows, row => {
      row.ancestor_ids = row.ancestry?.split( "/" )?.map( Number );
      if ( row.name === "Homo" && !Taxon.homo ) {
        Taxon.homo = row;
      } else if ( row.name === "Homo sapiens" && !Taxon.homoSapiens ) {
        Taxon.homoSapiens = row;
      } else if ( row.name === "Life" && !Taxon.life ) {
        Taxon.life = row;
      }
    } );
  }

  static preloadBasicInfoFromDBParallel( taxa, concurrency = 3 ) {
    return new Promise( ( resolve, reject ) => {
      const chunks = _.chunk( _.values( taxa ), 5000 );
      const promiseProducer = ( ) => {
        const chunk = chunks.shift( );
        if ( !chunk ) {
          return null;
        }
        return Taxon.preloadBasicInfoFromDB( chunk );
      };
      const pool = new PromisePool( promiseProducer, concurrency );
      pool.start( ).then( ( ) => {
        resolve( );
      } ).catch( e => {
        reject( e );
      } );
    } );
  }

  static async preloadBasicInfoFromDB( taxa ) {
    if ( taxa.length === 0 ) { return; }
    const taxonIDs = _.map( taxa, "id" );
    if ( _.isEmpty( taxonIDs ) ) { return; }
    const query = squel.select( )
      .field( "taxa.id, taxa.name, taxa.rank, taxa.rank_level, taxa.ancestry, taxa.is_active, iconic_taxa.name AS iconic_taxon_name" )
      .from( "taxa" )
      .left_join( "taxa iconic_taxa", null, "taxa.iconic_taxon_id = iconic_taxa.id" )
      .where( "taxa.id IN ?", util.paramArray( taxonIDs ) );
    const result = await pgClient.replica.query( query.toString( ) );
    const taxonDetails = { };
    _.each( result.rows, row => {
      taxonDetails[row.id] = row;
      if ( row.ancestry ) {
        taxonDetails[row.id].parent_id = Number( _.last( row.ancestry.split( "/" ) ) );
      }
    } );
    _.each( taxa, t => {
      if ( !_.isEmpty( taxonDetails[t.id] ) ) {
        t = Object.assign( t, taxonDetails[t.id] );
      }
    } );
  }

  static async ancestorsWithin( ids ) {
    if ( _.isEmpty( ids ) ) {
      return { };
    }
    const query = squel.select( ).field( "id, ancestry " ).from( "taxa" )
      .where( "id IN ?", ids );
    const { rows } = await pgClient.replica.query( query.toString( ) );
    const idsObject = _.keyBy( ids );
    const knownAncestors = { };
    _.each( rows, r => {
      if ( r.ancestry ) {
        _.each( _.map( r.ancestry.split( "/" ), str => Number( str ) ), aid => {
          if ( idsObject[aid] && !knownAncestors[aid] ) {
            knownAncestors[aid] = true;
          }
        } );
      }
    } );
    return knownAncestors;
  }

  static esQueryOptions( req ) {
    const localeOpts = util.localeOpts( req );
    const prepareTaxon = t => {
      t.prepareForResponse( localeOpts );
    };
    return {
      modifier: prepareTaxon,
      source: {
        includes: [
          "id",
          "parent_id",
          "ancestry",
          "rank",
          "rank_level",
          "name",
          "names.name",
          "names.locale",
          "names.position",
          "names.is_valid",
          "names.place_taxon_names",
          "min_species_ancestry",
          "default_photo"
        ]
      }
    };
  }
};

Taxon.modelName = "taxon";
Taxon.tableName = "taxa";

Taxon.iconicTaxaByName = { };
Taxon.iconicTaxaByID = { };

Taxon.esReturnFields = [
  "ancestor_ids",
  "ancestry",
  "atlas_id",
  "colors",
  "complete_rank",
  "complete_species_count",
  "current_synonymous_taxon_ids",
  "default_photo",
  "extinct",
  "flag_counts",
  "iconic_taxon_id",
  "id",
  "is_active",
  "listed_taxa.establishment_means",
  "listed_taxa.id",
  "listed_taxa.place_id",
  "name",
  "names.is_valid",
  "names.locale",
  "names.lexicon",
  "names.name",
  "names.place_taxon_names",
  "names.position",
  "observations_count",
  "parent_id",
  "rank",
  "rank_level",
  "statuses.*",
  "taxon_changes_count",
  "taxon_schemes_count",
  "uuid",
  "wikipedia_url"
];

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

Taxon.ICONIC_TAXON_NAMES = [
  "Actinopterygii",
  "Amphibia",
  "Animalia",
  "Arachnida",
  "Aves",
  "Chromista",
  "Fungi",
  "Insecta",
  "Mammalia",
  "Mollusca",
  "Plantae",
  "Protozoa",
  "Reptilia"
];

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
  root: 100,
  stateofmatter: 100,
  kingdom: 70,
  phylum: 60,
  subphylum: 57,
  superclass: 53,
  class: 50,
  subclass: 47,
  infraclass: 45,
  subterclass: 44,
  superorder: 43,
  order: 40,
  suborder: 37,
  infraorder: 35,
  parvorder: 34.5,
  zoosection: 34,
  zoosubsection: 33.5,
  superfamily: 33,
  epifamily: 32,
  family: 30,
  subfamily: 27,
  supertribe: 26,
  tribe: 25,
  subtribe: 24,
  genus: 20,
  genushybrid: 20,
  subgenus: 15,
  section: 13,
  subsection: 12,
  complex: 11,
  species: 10,
  hybrid: 10,
  subspecies: 5,
  variety: 5,
  form: 5,
  infrahybrid: 5
};
module.exports = Taxon;
