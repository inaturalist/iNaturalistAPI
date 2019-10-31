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

InaturalistMapStyles.geotilegrid = options => {
  let style = `polygon-fill: ${options.color || "#6e6e6e"}; `
    + "polygon-opacity: 0.2; "
    + "line-width: 1; "
    + "line-opacity: 0.5; "
    + "line-color: white; ";
    + "line-comp-op: overlay; ";
  let minRange = Math.log2( 0.1 ); // -3.322
  const maxRange = Math.log2( 10.1 ) + Math.abs( minRange ); // 3 + 3.322
  minRange = 0;
  const tier1 = options.totalHits / 10;
  style += "[cellCount > 0] { polygon-opacity: 0.2; } "
    + `[cellCount > ${( ( Math.pow( 10, 0.005 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.35 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.01 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.4 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.02 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.5 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.03 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.6 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.04 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.65 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.06 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.7 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.08 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.8 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.1 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 0.9 } `
    + `[cellCount > ${( ( Math.pow( 10, 0.2 ) - 1 ) / 100 ) * options.totalHits}] { polygon-opacity: 1 } `;
  return InaturalistMapStyles.extractMMLStyle( style );
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
  const totalObs = _.min( [options.totalHits || 50, 200] );
  const key = JSON.stringify( Object.assign( { }, tileOptions, { totalObs } ) );
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
    width = options.width || 30;
    tileOptions.line_width = options.line_width || 2;
    tileOptions.line_opacity = options.line_opacity || 0.8;
    tileOptions.opacity = options.opacity || 0.5;
    style += `[cellCount > 0] { `
      + ` marker-line-width: ${tileOptions.line_width}; `
      + ` marker-line-opacity: ${tileOptions.line_opacity}; `
      + ` marker-fill-opacity: ${tileOptions.opacity}; } `
      + `[cellCount > 0] { marker-width: ${width * Math.log10( 1.8 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.05 ) }] { marker-width: ${width * Math.log10( 2.2 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.2 ) }] { marker-width: ${width * Math.log10( 2.6 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.35 ) }] { marker-width: ${width * Math.log10( 3 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.6 ) }] { marker-width: ${width * Math.log10( 4 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 1.8 ) }] { marker-width: ${width * Math.log10( 5 )}; } `
      + `[cellCount > ${totalObs * Math.log10( 2 ) }] { marker-width: ${width * Math.log10( 6 )}; } `;
      + `[cellCount > ${totalObs * Math.log10( 2.5 ) }] { marker-width: ${width * Math.log10( 7 )}; } `;
      + `[cellCount > ${totalObs * Math.log10( 4 ) }] { marker-width: ${width}; } `;
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
