const app = require( "../app" );

exports.mochaHooks = {
  async beforeAll( ) {
    this.timeout( 20000 );
    this.app = await app( );
  }
};
