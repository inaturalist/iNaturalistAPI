const _ = require( "lodash" );
const carto = require( "carto" );
const Taxon = require( "./models/taxon" );

const InaturalistMapStyles = { };

const scaledHitsForGrid = ( hits, zoom ) => {
  if ( hits > 200000 ) {
    hits = 100000;
  } else if ( hits > 100000 ) {
    hits = 20000;
  } else if ( hits > 50000 ) {
    hits = 10000;
  } else if ( hits > 10000 ) {
    hits = 5000;
  }
  return _.max( [_.min( [100000, hits] ) / ( 2 ** zoom ), 3] );
};

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

const geotilegridStyles = { };
InaturalistMapStyles.geotilegrid = ( color, options = { } ) => {
  const count = scaledHitsForGrid( options.totalHits, options.zoom );
  color = color || "#FF4500";
  const key = JSON.stringify( { color, count } );
  if ( geotilegridStyles[key] ) {
    return geotilegridStyles[key];
  }
  const style = `polygon-fill: ${color}; `
    + "polygon-opacity: 0.2; "
    + "line-width: 1; "
    + "line-opacity: 0.9; "
    + "line-color: white; "
    + "line-comp-op: darken; "
    + "[cellCount > 0] { polygon-opacity: 0.3; } "
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.005 )] )}] { polygon-opacity: 0.35 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.01 )] )}] { polygon-opacity: 0.4 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.02 )] )}] { polygon-opacity: 0.45 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.05 )] )}] { polygon-opacity: 0.5 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.1 )] )}] { polygon-opacity: 0.55 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.2 )] )}] { polygon-opacity: 0.6 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.3 )] )}] { polygon-opacity: 0.65 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.4 )] )}] { polygon-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.5 )] )}] { polygon-opacity: 0.75 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.8 )] )}] { polygon-opacity: 0.8 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 2 )] )}] { polygon-opacity: 0.9 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 4 )] )}] { polygon-opacity: 1 } `;
  geotilegridStyles[key] = InaturalistMapStyles.extractMMLStyle( style );
  return geotilegridStyles[key];
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

const geotilegridHeatmapStyles = { };
InaturalistMapStyles.geotilegridHeatmap = ( colors, options = { } ) => {
  const count = scaledHitsForGrid( options.totalHits, options.zoom );
  const key = JSON.stringify( { count } );
  if ( geotilegridHeatmapStyles[key] ) {
    return geotilegridHeatmapStyles[key];
  }
  colors = colors || "violet 0.4, blue 0.5, green 0.6, yellow 0.9, orange 0.95, red 0.99";
  const style = `image-filters: 'colorize-alpha(${colors})'; `
    + "marker-file: 'lib/assets/marker_15px.png'; "
    + "marker-allow-overlap: true; "
    + "marker-opacity: 0.5; "
    + "marker-height: 35; "
    + "marker-width: 35; "
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.005 )] )}] { marker-width: 37; marker-height: 37; marker-opacity: 0.6 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.01 )] )}] { marker-width: 39; marker-height: 39; marker-opacity: 0.6 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.02 )] )}] { marker-width: 40; marker-height: 40; marker-opacity: 0.6 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.05 )] )}] { marker-width: 41; marker-height: 41; marker-opacity: 0.6 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.1 )] )}] { marker-width: 42; marker-height: 42; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.2 )] )}] { marker-width: 43; marker-height: 43; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.3 )] )}] { marker-width: 44; marker-height: 44; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.4 )] )}] { marker-width: 45; marker-height: 45; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.5 )] )}] { marker-width: 46; marker-height: 46; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 1.8 )] )}] { marker-width: 47; marker-height: 47; marker-opacity: 0.7 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 2 )] )}] { marker-width: 50; marker-height: 50; marker-opacity: 0.8 } `
    + `[cellCount >= ${_.max( [1, count * Math.log10( 4 )] )}] { marker-width: 60; marker-height: 60; marker-opacity: 0.8 } `;
  geotilegridHeatmapStyles[key] = InaturalistMapStyles.extractMMLStyle( style );
  return geotilegridHeatmapStyles[key];
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

let geomodelStyle;
InaturalistMapStyles.geomodelStyle = ( ) => {
  geomodelStyle = geomodelStyle || InaturalistMapStyles.extractMMLStyle(
    "polygon-fill: [color]; "
    + "polygon-opacity: 1; "
    + "line-width: 0.2; "
    + "line-opacity: 0.8; "
    + "line-color: [color]; "
  );
  return geomodelStyle;
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
  const totalObs = _.min( [options.totalHits || 50, 200] );
  const key = JSON.stringify( { ...tileOptions, totalObs } );
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
    const width = options.width || 30;
    tileOptions.line_width = options.line_width || 2;
    tileOptions.line_opacity = options.line_opacity || 0.8;
    tileOptions.opacity = options.opacity || 0.5;
    style += "[cellCount > 0] { "
      + ` marker-line-width: ${tileOptions.line_width}; `
      + ` marker-line-opacity: ${tileOptions.line_opacity}; `
      + ` marker-fill-opacity: ${tileOptions.opacity}; } `
      + `[cellCount > 0] { marker-width: ${width * Math.log10( 1.8 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.05 )}] { marker-width: ${width * Math.log10( 2.2 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.2 )}] { marker-width: ${width * Math.log10( 2.6 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.35 )}] { marker-width: ${width * Math.log10( 3 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.6 )}] { marker-width: ${width * Math.log10( 4 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.8 )}] { marker-width: ${width * Math.log10( 5 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 2 )}] { marker-width: ${width * Math.log10( 6 )}; } `;
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
