const app = require( "../app" );

exports.mochaHooks = {
  async beforeAll( ) {
    this.timeout( 10000 );
    this.app = await app( );
  }
};
