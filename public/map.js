var ObservationsMap = {
  map: null,
  socket: null,
  displayedObservations: [ ],
  displayedIDs: [ ],
  observationsToDisplay: 500,
  socket: io( )
};

ObservationsMap.init = function( ) {
  ObservationsMap.map = L.map( "map" ).setView( [ 20, 0 ], 1 ) ;
  L.tileLayer( "http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo( ObservationsMap.map );

  ObservationsMap.socket.on( "newObservations",
    ObservationsMap.appendObservations );

  setTimeout( ObservationsMap.fetchLatestObservations, 500 );
};

ObservationsMap.fetchLatestObservations = function( ) {
  var reqData = { order_by: "id", order: "desc", per_page: 100 };
  if( ObservationsMap.displayedObservations.length > 0 ) {
    _.extend( reqData, {
      id_above: ObservationsMap.displayedObservations[0].obs.id });
  }
  ObservationsMap.socket.emit( "requestNewObservations", reqData );
};

ObservationsMap.appendObservations = function( data ) {
  _.each( data.results, ObservationsMap.appendObservation );
  // now that we have the latest, fetch again in 5 seconds
  setTimeout( ObservationsMap.fetchLatestObservations, 5000 );
};

ObservationsMap.appendObservation = function( obs ) {
  if( _.indexOf( ObservationsMap.displayedIDs, obs.id ) !== -1 ) {
    return;
  }
  if( ObservationsMap.displayedObservations.length >=
      ObservationsMap.observationsToDisplay ) {
    var last = ObservationsMap.displayedObservations.pop( );
    ObservationsMap.map.removeLayer( last.layer );
    ObservationsMap.displayedIDs.pop( );
  }
  var layer = ObservationsMap.displayObservation( obs );
  if( layer ) {
    ObservationsMap.displayedObservations.unshift({ obs: obs, layer: layer });
    ObservationsMap.displayedIDs.unshift( obs.id );
  }
};

ObservationsMap.displayObservation = function( obs ) {
  if( obs.geojson ) {
    return marker = L.marker( obs.geojson.coordinates.reverse( ), {
      bounceOnAdd: true,
      bounceOnAddOptions: { duration: 2500 },
    }).bindPopup( ObservationsMap.obsPopup( obs ) ).addTo( ObservationsMap.map );
  }
};

ObservationsMap.obsPopup = function( obs ) {
  var obsURL = "http://www.inaturalist.org/observations/"+ obs.id;
  var html =
    "ID: <a href='"+ obsURL +"'>"+ obs.id +"</a><br/>" +
    "Observer: <a href='http://www.inaturalist.org/people/"+
    obs.user.login +"'>"+ obs.user.login +"</a>";
  if( obs.photos.length > 0 && obs.photos[0].url ) {
    html += "<br/><a href='"+ obsURL +"'><img src='"+ obs.photos[0].url +"'/></a>";
  }
  return html;
};

setTimeout( ObservationsMap.init, 500 );
