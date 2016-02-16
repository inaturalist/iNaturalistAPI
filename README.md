iNaturalistAPI
==============

[![Build Status](https://travis-ci.org/inaturalist/iNaturalistAPI.svg?branch=master)](https://travis-ci.org/inaturalist/iNaturalistAPI)
[![Coverage Status](https://coveralls.io/repos/github/inaturalist/iNaturalistAPI/badge.svg?branch=master)](https://coveralls.io/github/inaturalist/iNaturalistAPI?branch=master)

A Node.js map tile and data API for the iNaturalist.org website

Installation
------------
```
npm install
```

API
---
### Standard Parameters

Name | Required | Type | Description
-----|----------|------|-------------
taxon_id||integer|identified to the taxon and its descendants
user_id||integer|created by the user
place_id||integer|observed in the place
project_id||integer|in the project
d1||datetime|observed on or after the date
d2||datetime|observed on or before the date

### Render Points Tile
```
/geohash/:z/:x/:y.png
```
Render a PNG tile with points showing every observation matching the request parameters. Colors are [based on the taxon represented](http://www.inaturalist.org/pages/help#mapsymbols).

```
/geohash/:z/:x/:y.grid.json
```
Return a [UTFGrid](https://github.com/mapbox/utfgrid-spec) representation of geohash tile data.

### Render Heatmap Tile
```
/heatmap/:z/:x/:y.png
```
Render a PNG tile with points showing a heatmap summary of all pbservations matching the request parameters.

```
/heatmap/:z/:x/:y.grid.json
```
Return a [UTFGrid](https://github.com/mapbox/utfgrid-spec) representation of heatmap tile data.

Caching
-------

This app does not perform any caching asside from setting relevant `Cache-
Control` HTTP headers that can be used by a caching layer elsewhere in the
stack.
