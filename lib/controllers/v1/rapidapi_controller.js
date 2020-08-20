const _ = require( "lodash" );
const ComputervisionController = require( "./computervision_controller" );
const util = require( "../../util" );

const RapidAPIController = class RapidAPIController {
  static async scoreImage( req ) {
    if ( !util.isRapidAPIRequest( req ) ) {
      throw new Error( 401 );
    }
    if ( !req.file ) {
      throw new Error( 422 );
    }
    const trimTaxon = t => _.pick( t, ["id", "name", "preferred_common_name"] );
    const cvResponse = await ComputervisionController.scoreImageUpload( req.file.path, req );
    // trim and reformat response
    _.each( cvResponse.results, r => {
      r.taxon = trimTaxon( r.taxon );
      if ( _.has( r, "frequency_score" ) ) {
        r.seen_nearby = r.frequency_score > 0;
      }
      r.visually_similar = r.vision_score > 0;
      _.each( ["vision_score", "combined_score", "score", "frequency_score"], attr => {
        delete r[attr];
      } );
    } );
    if ( cvResponse.common_ancestor ) {
      cvResponse.suggested_ancestor = trimTaxon( cvResponse.common_ancestor.taxon );
      delete cvResponse.common_ancestor;
    }
    _.each( ["page", "per_page", "total_results"], attr => {
      delete cvResponse[attr];
    } );
    return cvResponse;
  }
};

module.exports = RapidAPIController;
