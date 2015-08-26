var _ = require( "underscore" ),
    carto = require( "carto" ),
    util = require( "./util" ),
    InaturalistMapStyles = { },
    cartoRenderer = new carto.Renderer({ });

InaturalistMapStyles.mmlForStyle = function( style ) {
  return {
    Layer: [ { id: "style", name: "style" } ],
    Stylesheet: [ { id: "style.mss", data: "#style{ "+ style +" }" } ]
  };
};

InaturalistMapStyles.extractMMLStyle = function( style ) {
  try {
    var extractedStyle;
    var mml = InaturalistMapStyles.mmlForStyle( style )
    var xml = cartoRenderer.render( mml );
    var styleMatch = xml.match(/<Style[\s\S]*<\/Style>/);
    if( styleMatch ) {
      extractedStyle = styleMatch[0].replace("\n", "");
      return extractedStyle;
    }
  } catch( err ) { }
};

InaturalistMapStyles.heatmap = function( colors ) {
  colors = colors || "violet 0.4, blue 0.5, green 0.6, yellow 0.9, orange 0.97, red 0.99";
  return "\
  <Style name='style' image-filters='colorize-alpha(" + colors + ")' opacity='0.7'>\
    <Rule>\
      <MarkersSymbolizer file='lib/assets/marker_15px.png' allow-overlap='true' opacity='0.4' />\
    </Rule>\
  </Style>";
};

InaturalistMapStyles.places = function( ) {
  return InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: #daa520; " +
    "polygon-opacity: 0.3; " +
    "line-width: 2; " +
    "line-opacity: 0.9; " +
    "line-color: #daa520;"
  );
};

InaturalistMapStyles.taxonRange = function( color ) {
  color = color || "#ff5eb0";
  return InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: "+ color +"; " +
    "polygon-opacity: 0.4; " +
    "line-width: 1; " +
    "line-opacity: 0.9; " +
    "line-color: "+ color +";"
  );
};

InaturalistMapStyles.taxonPlaces = function( ) {
  return InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: #daa520; " +
    "polygon-opacity: 0.3; " +
    "line-width: 1; " +
    "line-opacity: 0.9; " +
    "line-color: #daa520; " +
    "[last_observation_id > 0] { polygon-fill: #73ac13; line-color: #73ac13; } " +
    "[occurrence_status_level=10] { polygon-fill:#2E2E2E; line-color: #2E2E2E; } " +
    "[establishment_means='introduced'] { line-dasharray: 10, 6; }"
  );
};

InaturalistMapStyles.coloredHeatmap = function( color, width, opacity ) {
  width = width || 14;
  color = color || "#6E6E6E";
  opacity = opacity || 0.35;
  return InaturalistMapStyles.extractMMLStyle(
    "marker-fill: "+ color +"; " +
    "marker-fill-opacity: "+ opacity +"; " +
    "marker-width: "+ width +"; " +
    "marker-line-color: #ffffff; " +
    "marker-line-width: 2; " +
    "marker-allow-overlap: true; " +
    "marker-comp-op: darken;"
  );
};

InaturalistMapStyles.markersAndCircles = function( color ) {
  var style =
    "marker-width: 8; " +
    "marker-line-color: #D8D8D8; " +
    "marker-line-width: 150; " +
    "marker-line-opacity: 0.7; " +
    "marker-allow-overlap: true; " +
    "marker-file: 'lib/assets/map-marker.svg'; " +
    "marker-transform: translate(0,-21); ";
  if( color ) {
    style += "marker-fill: "+ color + "; ";
  } else {
    style += InaturalistMapStyles.taxonColorCSS( );
  }
  style +=
    "[captive='true'] { marker-fill-opacity: 0.3; marker-line-opacity: 0.4; } " +
    "[quality_grade='research'] { fg/marker-line-width: 0; fg/marker-width: 2; fg/marker-fill: #ffffff; " +
    "  fg/marker-fill-opacity: 1; fg/marker-allow-overlap: true; fg/marker-transform: translate(0,-26); "+
    "  marker-line-color: #ffffff; } " +
    "[geoprivacy='obscured'],[private_location!='']{ marker-file: ''; marker-line-width: 1.5; marker-transform: translate(0,0); "+
    "  marker-width: 10; marker-line-color: #BDBDBD; marker-fill-opacity: 0.3; fg/marker-transform: translate(0,0); } " +
    "['taxon.iconic_taxon_id'=''][geoprivacy='obscured'] { marker-file: 'lib/assets/mm_34_stemless_unknown.png'; marker-width: 11; } " +
    "['taxon.iconic_taxon_id'=''] { marker-file: 'lib/assets/mm_34_unknown.png'; marker-width: 9; } ";
  return InaturalistMapStyles.extractMMLStyle( style );
};

InaturalistMapStyles.taxonColorCSS = function( ) {
  return "" +
    "marker-fill: #585858; " +
    "['taxon.iconic_taxon_id'=1] { marker-fill: " + util.iconicTaxonColors[1] + "; } " +
    "['taxon.iconic_taxon_id'=3] { marker-fill: " + util.iconicTaxonColors[3] + "; } " +
    "['taxon.iconic_taxon_id'=20978] { marker-fill: " + util.iconicTaxonColors[20978] + "; } " +
    "['taxon.iconic_taxon_id'=26036] { marker-fill: " + util.iconicTaxonColors[26036] + "; } " +
    "['taxon.iconic_taxon_id'=40151] { marker-fill: " + util.iconicTaxonColors[40151] + "; } " +
    "['taxon.iconic_taxon_id'=47115] { marker-fill: " + util.iconicTaxonColors[47115] + "; } " +
    "['taxon.iconic_taxon_id'=47119] { marker-fill: " + util.iconicTaxonColors[47119] + "; } " +
    "['taxon.iconic_taxon_id'=47126] { marker-fill: " + util.iconicTaxonColors[47126] + "; } " +
    "['taxon.iconic_taxon_id'=47158] { marker-fill: " + util.iconicTaxonColors[47158] + "; } " +
    "['taxon.iconic_taxon_id'=47170] { marker-fill: " + util.iconicTaxonColors[47170] + "; } " +
    "['taxon.iconic_taxon_id'=47178] { marker-fill: " + util.iconicTaxonColors[47178] + "; } " +
    "['taxon.iconic_taxon_id'=47686] { marker-fill: " + util.iconicTaxonColors[47686] + "; } " +
    "['taxon.iconic_taxon_id'=48222] { marker-fill: " + util.iconicTaxonColors[48222] + "; } ";
};

module.exports = InaturalistMapStyles;
