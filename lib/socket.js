var iNaturalistAPI = require( "./inaturalist_api" ),
    socket = { server: null };

socket.connect = function( server ) {
  if( socket.server ) { return socket.server; }
  socket.server = require( "socket.io" )( server );

  socket.server.on( "connection", function( sock ) {
    sock.on( "requestNewObservations", socket.emitNewObservations );
  });

  return socket.server;
};

socket.emitNewObservations = function( reqData ) {
  if( socket.server ) {
    reqData = { query: reqData || { } };
    console.log(reqData);
    InaturalistAPI.observationsIndex( reqData, function( err, resData ) {
      socket.server.sockets.emit( "newObservations", resData );
    });
  }
};

module.exports = socket;
