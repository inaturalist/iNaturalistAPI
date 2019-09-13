{
  "dynamic": "true",
  "properties": {
    "admin_level": {
      "type": "short"
    },
    "ancestor_place_ids": {
      "type": "integer"
    },
    "bbox_area": {
      "type": "float"
    },
    "bounding_box_geojson": {
      "type": "geo_shape"
    },
    "display_name": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "display_name_autocomplete": {
      "type": "text",
      "analyzer": "keyword_autocomplete_analyzer",
      "search_analyzer": "keyword_analyzer"
    },
    "geometry_geojson": {
      "type": "geo_shape"
    },
    "id": {
      "type": "integer"
    },
    "location": {
      "type": "geo_point"
    },
    "name": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "observations_count": {
      "type": "integer"
    },
    "place_type": {
      "type": "integer"
    },
    "point_geojson": {
      "type": "geo_shape"
    },
    "slug": {
      "type": "keyword"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "user": {
      "properties": {
        "created_at": {
          "type": "date"
        },
        "id": {
          "type": "integer"
        },
        "login": {
          "type": "keyword"
        },
        "spam": {
          "type": "boolean"
        },
        "suspended": {
          "type": "boolean"
        }
      }
    },
    "without_check_list": {
      "type": "boolean"
    }
  }
}
