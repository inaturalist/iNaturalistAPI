var InaturalistMapStyles = { };

InaturalistMapStyles.heatmap = function( color ) {
  color = color || "violet, violet, violet, blue, blue, blue, green, green, green, yellow, yellow, yellow, yellow, yellow, orange, orange, orange, red";
  return "\
  <Style name='style' image-filters='colorize-alpha(" + color + ")' opacity='0.8'>\
    <Rule>\
      <MarkersSymbolizer file='lib/assets/marker_30px.png' allow-overlap='true' opacity='0.4' />\
    </Rule>\
  </Style>";
};

InaturalistMapStyles.geogrid = function( ) {
  return "\
  <Style name='style'>\
    <Rule>\
      <MarkersSymbolizer placement='point' marker-type='ellipse' fill='#666666' multi-policy='whole' fill-opacity='1' width='5' stroke='#d8d8d8' stroke-width='0.5' stroke-opacity='1' allow-overlap='true' comp-op='src' />\
    </Rule>\
  </Style>";
};

InaturalistMapStyles.grid = function( ) {
  return "\
  <Style name='style'>\
    <Rule>\
      <LineSymbolizer stroke='#6e6e6e' stroke-opacity='0.3' />\
      <PolygonSymbolizer fill='#6e6e6e' fill-opacity='0.8' />\
    </Rule>\
  </Style>";
};

InaturalistMapStyles.points = function( ) {
  return "\
  <Style name='style' filter-mode='first'>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#993300' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#993300' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#993300' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#993300' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#993300' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#993300' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#993300' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#993300' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#993300' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#993300' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#993300' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#993300' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#8b008b' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#8b008b' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#8b008b' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#8b008b' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#8b008b' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#8b008b' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#8b008b' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#8b008b' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#8b008b' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#8b008b' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#8b008b' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff1493' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff1493' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff1493' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff1493' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff1493' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff1493' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff1493' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff1493' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff1493' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff1493' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff1493' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#73ac13' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#73ac13' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#73ac13' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#73ac13' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#73ac13' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#73ac13' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#73ac13' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#73ac13' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#73ac13' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#73ac13' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#73ac13' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#ff4500' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#ff4500' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='0.2' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#1e90ff' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#1e90ff' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill-opacity='0.2' fill='#585858' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill-opacity='0.2' fill='#585858' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill-opacity='0.2' fill='#585858' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill-opacity='0.2' fill='#585858' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill-opacity='0.2' fill='#585858' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research') and ([captive] = true)</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill-opacity='0.2' fill='#585858' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='20' stroke-width='2.5' fill='#585858' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='16' stroke-width='1' fill='#585858' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='12' stroke-width='1' fill='#585858' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='10' stroke-width='1' fill='#585858' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' width='9' stroke-width='1' fill='#585858' fill-opacity='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([quality_grade] = 'research')</Filter>\
      <MarkersSymbolizer stroke='#ffffff' multi-policy='whole' fill='#585858' fill-opacity='1' width='8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#993300' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#993300' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#993300' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#993300' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 48222)</Filter>\
      <MarkersSymbolizer fill='#993300' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#8b008b' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#8b008b' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#8b008b' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47686)</Filter>\
      <MarkersSymbolizer fill='#8b008b' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47178)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#ff1493' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff1493' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff1493' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47170)</Filter>\
      <MarkersSymbolizer fill='#ff1493' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47158)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#73ac13' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#73ac13' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#73ac13' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47126)</Filter>\
      <MarkersSymbolizer fill='#73ac13' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47119)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#ff4500' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 47115)</Filter>\
      <MarkersSymbolizer fill='#ff4500' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 40151)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 26036)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 20978)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 3)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='0.2' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1) and ([captive] = true)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='0.2' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#1e90ff' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([iconic_taxon_id] = 1)</Filter>\
      <MarkersSymbolizer fill='#1e90ff' multi-policy='whole' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill-opacity='0.2' fill='#585858' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill-opacity='0.2' fill='#585858' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill-opacity='0.2' fill='#585858' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill-opacity='0.2' fill='#585858' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill-opacity='0.2' fill='#585858' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <Filter>([captive] = true)</Filter>\
      <MarkersSymbolizer fill-opacity='0.2' multi-policy='whole' fill='#585858' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>750</MaxScaleDenominator>\
      <MarkersSymbolizer width='20' stroke-width='2.5' multi-policy='whole' fill='#585858' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>1500</MaxScaleDenominator>\
      <MinScaleDenominator>750</MinScaleDenominator>\
      <MarkersSymbolizer width='16' stroke-width='1' multi-policy='whole' fill='#585858' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>2500</MaxScaleDenominator>\
      <MinScaleDenominator>1500</MinScaleDenominator>\
      <MarkersSymbolizer width='12' stroke-width='1' multi-policy='whole' fill='#585858' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>5000</MaxScaleDenominator>\
      <MinScaleDenominator>2500</MinScaleDenominator>\
      <MarkersSymbolizer width='10' stroke-width='1' multi-policy='whole' fill='#585858' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MaxScaleDenominator>12500</MaxScaleDenominator>\
      <MinScaleDenominator>5000</MinScaleDenominator>\
      <MarkersSymbolizer width='9' stroke-width='1' multi-policy='whole' fill='#585858' fill-opacity='1' stroke='#d8d8d8' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
    <Rule>\
      <MinScaleDenominator>12500</MinScaleDenominator>\
      <MarkersSymbolizer fill='#585858' fill-opacity='1' width='8' stroke='#d8d8d8' stroke-width='1' stroke-opacity='1' placement='point' marker-type='ellipse' allow-overlap='true' comp-op='src' />\
    </Rule>\
  </Style>";
};

module.exports = InaturalistMapStyles;
