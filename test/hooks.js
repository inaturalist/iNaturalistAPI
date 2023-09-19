const { expect } = require( "chai" );
const app = require( "../app" );

exports.mochaHooks = {
  async beforeAll( ) {
    expect( process.env.NODE_ENV ).to.eq( "test" );
    this.timeout( 20000 );
    this.app = await app( );
  }
};
