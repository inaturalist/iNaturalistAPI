{
  "project" : {
    "dynamic" : "true",
    "properties" : {
      "ancestor_place_ids" : {
        "type" : "long"
      },
      "description" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "geojson" : {
        "type" : "geo_shape"
      },
      "id" : {
        "type" : "long"
      },
      "location" : {
        "type" : "geo_point",
        "lat_lon" : true
      },
      "place_ids" : {
        "type" : "long"
      },
      "title" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "title_autocomplete" : {
        "type" : "string",
        "analyzer" : "keyword_autocomplete_analyzer",
        "search_analyzer" : "keyword_analyzer"
      }
    }
  }
}
