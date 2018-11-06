const _ = require( "lodash" );
const moment = require( "moment-timezone" );
const squel = require( "squel" );
const pgClient = require( "../pg_client" );

moment.tz.setDefault( "UTC" );

const Model = class Model {
  constructor( attrs ) {
    Object.assign( this, attrs );
    Model.formatDates( this );
  }

  static formatDates( obj ) {
    Object.keys( obj ).forEach( attr => {
      if ( _.isString( obj[attr] ) && obj[attr].match( /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ ) ) {
        obj[attr] = moment.parseZone( obj[attr] ).format( "YYYY-MM-DDTHH:mm:ssZ" );
      } else if ( _.isDate( obj[attr] ) ) {
        obj[attr] = moment.parseZone( obj[attr] ).format( "YYYY-MM-DDTHH:mm:ssZ" );
      } else if ( _.isObject( obj[attr] ) ) {
        Model.formatDates( obj[attr] );
      }
    } );
  }

  // Given an array of objects (e.g. [obs, obs, ...]), and an associated model,
  // return a compact, unique array of the foreign_keys for that model
  // e.g. Model.belongsToIDs([obs, ...], User) returns an array of unique values
  //      from all obs.user_id and obs.user.id
  static belongsToIDs( objects, model, options ) {
    options = options || { };
    const attrName = options.attrName || model.modelName;
    if ( !options.idFields ) {
      const modelID = options.foreignKey || `${model.modelName}_id`;
      options.idFields = { };
      options.idFields[modelID] = attrName;
    }
    if ( !_.isArray( objects ) || objects.length === 0 ) {
      return null;
    }
    let ids = _.map( objects, o => {
      if ( !o ) { return null; }
      return _.map( options.idFields, ( attr, idField ) => ( [
        o[attr] && o[attr].id,
        o[idField]
      ] ) );
    } );
    ids = _.filter( _.uniq( _.flattenDeep( ids ) ), _.identity );
    if ( ids.length === 0 ) { return null; }
    return ids;
  }

  static injectHasMany( objects, InjectModel, resultsHash ) {
    const assoc = InjectModel.modelNamePlural || InjectModel.tableName;
    // Example: for each obs (where results are identifications)
    _.each( objects, o => {
      // obs has an ID and we have identifications for that obs
      if ( o.id && !_.isEmpty( resultsHash[o.id] ) ) {
        // add the identifications to obs as an array
        o[assoc] = _.map( _.values( resultsHash[o.id] ), v => new InjectModel( v ) );
      } else {
        // there were no identifications for the obs, set to empty array
        o[assoc] = [];
      }
    } );
  }

  static injectBelongsTo( objects, InjectModel, resultsHash, options ) {
    options = options || { };
    const attrName = options.attrName || InjectModel.modelName;
    if ( !options.idFields ) {
      const modelID = options.foreignKey || `${InjectModel.modelName}_id`;
      options.idFields = { };
      options.idFields[modelID] = attrName;
    }
    // Example: for each obs (where results are users)
    _.each( objects, o => {
      if ( !o ) { return; }
      _.map( options.idFields, ( attr, idField ) => {
        let association;
        const assocObj = o[attr];
        const assocID = o[idField];
        // obs.user.id exists and we have that user in the results
        if ( assocObj && assocObj.id && !_.isEmpty( resultsHash[assocObj.id] ) ) {
          // extend obs.user with the properties in the result and turn it into User
          association = new InjectModel( _.assignIn( { },
            assocObj, resultsHash[assocObj.id] ), options );
        } else if ( assocID && !_.isEmpty( resultsHash[assocID] ) ) {
          // obs.user_id exists and we have that user in the results
          // create a new User instance
          association = new InjectModel( resultsHash[assocID], options );
        }
        if ( association ) {
          if ( options.modifier ) {
            // run any post-initialization requested for the instance.
            // This needs to run here in the objects loop, instead of the
            // `fetchBelongsTo` methods, since the results may be combined with
            // original objects properties, and that could affect the modifier
            options.modifier( association );
          }
          // assign the new instance to object
          o[attr] = association;
        }
      } );
    } );
  }

  static preloadTaxonPhotoDimensions( taxa, callback ) {
    const ids = _.compact( _.uniq( _.flattenDeep( _.map( taxa,
      t => _.map( t.taxon_photos, tp => tp.photo.id ) ) ) ) );
    if ( _.isEmpty( ids ) ) { return void callback( ); }
    Model.photoDimensionsByID( ids, ( err, photoSizeByID ) => {
      _.each( taxa, t => {
        _.each( t.taxon_photos, tp => {
          tp.photo.original_dimensions = photoSizeByID[tp.photo.id];
        } );
      } );
      callback( );
    } );
  }

  static photoDimensionsByID( ids, callback ) {
    const query = squel.select( ).fields( ["id"] )
      .fields( ["substring(metadata from ':original:.*?\n.*?:width: ([0-9]*)\n') width"] )
      .fields( ["substring(metadata from ':original:.*?\n.*?:height: ([0-9]*)\n') height"] )
      .from( "photos" )
      .where( "id IN ?", ids );
    pgClient.connection.query( query.toString( ), ( err, result ) => {
      if ( err ) { return void callback( err ); }
      const photoSizeByID = _.fromPairs( _.map( result.rows, r => {
        const width = Number( r.width );
        const height = Number( r.height );
        return [Number( r.id ), ( width && height ) ? { width, height } : null];
      } ) );
      callback( null, photoSizeByID );
    } );
  }
};

module.exports = Model;
