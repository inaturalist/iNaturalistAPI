var FacetsMap = {
  map: null,
  inatLayer: null,
  utfgridLayer: null,
  popup: null
};

FacetsMap.init = function( ) {
  FacetsMap.map = L.map( "map" ).setView( [ 20, 0 ], 1 ) ;
  L.tileLayer( "http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo( FacetsMap.map );
  FacetsMap.addTileWithParams( window.location.search.replace( "?", "" ) );

  $("#search").on( "submit", function( e ) {
    e.preventDefault( );
    if( FacetsMap.popup ) { FacetsMap.map.removeLayer( FacetsMap.popup ); }
    var params = _.map( _.filter( $(this).serializeArray( ), function( obj ) {
      return obj.value !== "";
    }), function( obj ) {
      return [ obj.name, obj.value ].join( "=" );
    }).join( "&" );
    history.pushState( params, "", "?" + params );
    FacetsMap.addTileWithParams( params );
  });

  $(window).on("popstate", function( event ) {
    if( FacetsMap.popup ) { FacetsMap.map.removeLayer( FacetsMap.popup ); }
    FacetsMap.addTileWithParams( event.originalEvent.state );
  });

};

FacetsMap.addTileWithParams = function( params ) {
  params = params || "";
  $("#search input[type=text]").val( "" );
  _.each( params.split( "&" ), function( p ) {
    if( !p ) { return; }
    var pp = p.split( "=" );
    $("#search input[name="+ pp[0] +"]").val( pp[1] );
  });
  if( FacetsMap.inatLayer ) { FacetsMap.map.removeLayer( FacetsMap.inatLayer ); }
  var tileURL = "http://elastictiles.inaturalist.org/colored_heatmap/{z}/{x}/{y}.png";
  if( params ) { tileURL += "?" + params; }
  FacetsMap.inatLayer = L.tileLayer( tileURL, {
    attribution: '<a href="http://www.inaturalist.org/">iNaturalist</a> contributors'
  }).addTo( FacetsMap.map );
  FacetsMap.addUTFGridTileWithParams( params );
};

FacetsMap.addUTFGridTileWithParams = function( params ) {
  if( FacetsMap.utfgridLayer ) { FacetsMap.map.removeLayer( FacetsMap.utfgridLayer ); }
  var tileURL = "http://elastictiles.inaturalist.org/colored_heatmap/{z}/{x}/{y}.grid.json?callback={cb}&source=true";
  if( params ) { tileURL += "&" + params; }
  FacetsMap.utfgridLayer = new L.UtfGrid(tileURL, {
    resolution: 4
  });
  FacetsMap.utfgridLayer.on( "click", function (e) {
    if( e.data ) {
      if( FacetsMap.popup ) { FacetsMap.map.removeLayer( FacetsMap.popup ); }
      var source = e.data._source.replace( /'/g, '"' );
      FacetsMap.popup = L.popup({ minWidth: 415 }).
        setLatLng([ e.data.latitude, e.data.longitude ]).
        setContent( source ).
        openOn( FacetsMap.map );
    }
  });
  FacetsMap.map.addLayer( FacetsMap.utfgridLayer );
};

setTimeout( FacetsMap.init, 500 );
