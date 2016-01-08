{
  "place" : {
    "dynamic" : "true",
    "properties" : {
      "admin_level" : {
        "type" : "long"
      },
      "ancestor_place_ids" : {
        "type" : "long"
      },
      "bbox_area" : {
        "type" : "double"
      },
      "display_name" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "display_name_autocomplete" : {
        "type" : "string",
        "analyzer" : "keyword_autocomplete_analyzer",
        "search_analyzer" : "keyword_analyzer"
      },
      "geometry_geojson" : {
        "type" : "geo_shape"
      },
      "id" : {
        "type" : "integer"
      },
      "location" : {
        "type" : "geo_point",
        "lat_lon" : true
      },
      "name" : {
        "type" : "string"
      },
      "place_type" : {
        "type" : "integer"
      },
      "point_geojson" : {
        "type" : "geo_shape"
      },
      "simplified_geometry_geojson" : {
        "type" : "geo_shape"
      },
      "user" : {
        "properties" : {
          "id" : {
            "type" : "long"
          },
          "login" : {
            "type" : "string"
          }
        }
      }
    }
  }
}
