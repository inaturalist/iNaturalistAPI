const _ = require( "lodash" );
const carto = require( "carto" );
const Taxon = require( "./models/taxon" );

const InaturalistMapStyles = { };

InaturalistMapStyles.mmlForStyle = style => (
  {
    Layer: [{ id: "style" }],
    Stylesheet: [{ id: "style.mss", data: `#style{ ${style} }` }]
  }
);

InaturalistMapStyles.extractMMLStyle = style => {
  try {
    const mml = InaturalistMapStyles.mmlForStyle( style );
    const cartoRenderer = new carto.Renderer( { } );
    const xml = cartoRenderer.render( mml ).data;
    const styleMatch = xml.match( /<Style[\s\S]*<\/Style>/ );
    if ( styleMatch ) {
      return styleMatch[0].replace( "\n", "" );
    }
  } catch ( err ) {
    // do nothing
  }
  return null;
};

InaturalistMapStyles.heatmap = colors => {
  colors = colors || "violet 0.4, blue 0.5, green 0.6, yellow 0.9, orange 0.97, red 0.99";
  return `
  <Style name='style' image-filters='colorize-alpha(${colors})' opacity='0.7'>\
    <Rule>\
      <MarkersSymbolizer file='lib/assets/marker_15px.png' allow-overlap='true' opacity='0.4' />\
    </Rule>\
  </Style>`;
};

let placesStyle;
InaturalistMapStyles.places = ( ) => {
  placesStyle = placesStyle || InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: #daa520; "
    + "polygon-opacity: 0.3; "
    + "line-width: 2; "
    + "line-opacity: 0.9; "
    + "line-color: #daa520;"
  );
  return placesStyle;
};

const taxonRangeStyles = { };
InaturalistMapStyles.taxonRange = color => {
  color = color || "#ff5eb0";
  if ( taxonRangeStyles[color] ) {
    return taxonRangeStyles[color];
  }
  taxonRangeStyles[color] = InaturalistMapStyles.extractMMLStyle(
    `polygon-fill: ${color}; `
    + "polygon-opacity: 0.4; "
    + "line-width: 1; "
    + "line-opacity: 0.9; "
    + `line-color: ${color};`
  );
  return taxonRangeStyles[color];
};

let taxonPlacesStyle;
InaturalistMapStyles.taxonPlaces = ( ) => {
  taxonPlacesStyle = taxonPlacesStyle || InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: #daa520; "
    + "polygon-opacity: 0.3; "
    + "line-width: 1; "
    + "line-opacity: 0.9; "
    + "line-color: #daa520; "
    + "[last_observation_id > 0] { polygon-fill: #73ac13; line-color: #73ac13; } "
    + "[occurrence_status_level=10] { polygon-fill:#2E2E2E; line-color: #2E2E2E; } "
    + "[establishment_means='introduced'] { line-dasharray: 10, 6; }"
  );
  return taxonPlacesStyle;
};

const coloredHeatmapStyles = { };
InaturalistMapStyles.coloredHeatmap = options => {
  const tileOptions = { };
  options = options || { };
  tileOptions.width = options.width || 14;
  tileOptions.color = options.color || "#6E6E6E";
  tileOptions.opacity = options.opacity || 0.35;
  tileOptions.line_color = options.line_color || "#ffffff";
  tileOptions.line_width = options.line_width || 2;
  tileOptions.line_opacity = options.line_opacity || 1;
  tileOptions.comp_op = options.comp_op || "darken";
  tileOptions.scaled = options.scaled;
  const key = JSON.stringify( tileOptions );
  if ( coloredHeatmapStyles[key] ) {
    return coloredHeatmapStyles[key];
  }
  let style = `marker-width: ${tileOptions.width}; `
    + `marker-fill: ${tileOptions.color}; `
    + `marker-fill-opacity: ${tileOptions.opacity}; `
    + `marker-line-color: ${tileOptions.line_color}; `
    + `marker-line-width: ${tileOptions.line_width}; `
    + `marker-line-opacity: ${tileOptions.line_opacity}; `
    + `marker-comp-op: ${tileOptions.comp_op}; `
    + "marker-allow-overlap: true; ";
  if ( options.scaled ) {
    tileOptions.width = options.width || 30;
    tileOptions.opacity = options.opacity || 0.4;
    const maxCount = options.maxCount || 50;
    const tier9 = maxCount * Math.pow( 0.8, 3 );
    const tier8 = maxCount * Math.pow( 0.7, 3 );
    let tier7 = maxCount * Math.pow( 0.3, 3 );
    let tier6 = maxCount * Math.pow( 0.23, 3 );
    let tier5 = maxCount * Math.pow( 0.18, 3 );
    let tier4 = maxCount * Math.pow( 0.14, 3 );
    let tier3 = maxCount * Math.pow( 0.11, 3 );
    let tier2 = maxCount * Math.pow( 0.09, 3 );
    if ( tier2 < 2 ) { tier2 = 2; }
    if ( tier3 < tier2 + 1 ) { tier3 = tier2 + 1; }
    if ( tier4 < tier3 + 1 ) { tier4 = tier3 + 1; }
    if ( tier5 < tier4 + 1 ) { tier5 = tier4 + 1; }
    if ( tier6 < tier5 + 1 ) { tier6 = tier5 + 1; }
    if ( tier7 < tier6 + 1 ) { tier7 = tier6 + 1; }
    style += `[cellCount > 0] { marker-fill-opacity: ${tileOptions.opacity}; } `
      + `[cellCount > 0] { marker-width: ${tileOptions.width * 0.3}; } `
      + `[cellCount > ${tier2}] { marker-width: ${tileOptions.width * 0.35}; } `
      + `[cellCount > ${tier3}] { marker-width: ${tileOptions.width * 0.4}; } `
      + `[cellCount > ${tier4}] { marker-width: ${tileOptions.width * 0.5}; } `
      + `[cellCount > ${tier5}] { marker-width: ${tileOptions.width * 0.6}; } `
      + `[cellCount > ${tier6}] { marker-width: ${tileOptions.width * 0.7}; } `
      + `[cellCount > ${tier7}] { marker-width: ${tileOptions.width * 0.85}; } `
      + `[cellCount > ${tier8}] { marker-width: ${tileOptions.width}; } `
      + `[cellCount > ${tier9}] { marker-width: ${tileOptions.width * 1.2}; } `;
  }
  coloredHeatmapStyles[key] = InaturalistMapStyles.extractMMLStyle( style );
  return coloredHeatmapStyles[key];
};

let markersAndCirclesStyles = { };
InaturalistMapStyles.markersAndCircles = ( color, options ) => {
  options = options || { };
  if ( options.resetCache ) { markersAndCirclesStyles = { }; }
  if ( markersAndCirclesStyles[color] ) {
    return markersAndCirclesStyles[color];
  }
  let style = "marker-width: 8; "
    + "marker-line-color: #D8D8D8; "
    + "marker-line-width: 150; "
    + "marker-line-opacity: 0.7; "
    + "marker-allow-overlap: true; "
    + "marker-file: 'lib/assets/map-marker.svg'; "
    + "marker-transform: translate(0,-8); ";
  if ( color ) {
    style += `marker-fill: ${color}; `;
  } else {
    style += InaturalistMapStyles.taxonColorCSS( options );
  }
  style += "[captive='true'] { marker-fill-opacity: 0.3; marker-line-opacity: 0.4; } "
    + "[quality_grade='research'] { fg/marker-line-width: 0; fg/marker-width: 2; fg/marker-fill: #ffffff; "
    + "  fg/marker-fill-opacity: 1; fg/marker-allow-overlap: true; fg/marker-transform: translate(0,-10); "
    + "  marker-line-color: #ffffff; } "
    + "[geoprivacy='obscured'],[private_location!='']{ marker-file: ''; marker-line-width: 1.5; marker-transform: translate(0,0); "
    + "  marker-width: 10; marker-line-color: #BDBDBD; marker-fill-opacity: 0.3; fg/marker-transform: translate(0,0); } "
    + "['taxon.iconic_taxon_id'=''][geoprivacy='obscured'],['taxon.iconic_taxon_id'=''][private_location!=''] { "
    + "  marker-file: 'lib/assets/mm_34_stemless_unknown.png'; marker-width: 11; marker-opacity: 0.6; } "
    + "['taxon.iconic_taxon_id'=''] { marker-file: 'lib/assets/mm_34_unknown.png'; marker-width: 9; } ";
  markersAndCirclesStyles[color] = InaturalistMapStyles.extractMMLStyle( style );
  return markersAndCirclesStyles[color];
};

let taxonColorStyle;
InaturalistMapStyles.taxonColorCSS = options => {
  options = options || { };
  if ( options.resetCache ) { taxonColorStyle = null; }
  taxonColorStyle = taxonColorStyle || `marker-fill: ${Taxon.defaultColor}; `;
  _.each( Taxon.iconicTaxaByID, ( t, id ) => {
    taxonColorStyle += `['taxon.iconic_taxon_id'=${id}] { marker-fill: ${Taxon.iconicTaxonColor( id )}; } `;
  } );
  return taxonColorStyle;
};

module.exports = InaturalistMapStyles;
