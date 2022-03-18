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
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "display_name_autocomplete": {
      "analyzer": "keyword_autocomplete_analyzer",
      "search_analyzer": "keyword_analyzer",
      "type": "text"
    },
    "geometry_geojson": {
      "type": "geo_shape"
    },
    "id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "location": {
      "type": "geo_point"
    },
    "name": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "names": {
      "properties": {
        "exact": {
          "type": "keyword"
        },
        "exact_ci": {
          "analyzer": "keyword_analyzer",
          "type": "text"
        },
        "locale": {
          "type": "keyword"
        },
        "name": {
          "analyzer": "ascii_snowball_analyzer",
          "type": "text"
        },
        "name_autocomplete": {
          "analyzer": "autocomplete_analyzer",
          "search_analyzer": "standard_analyzer",
          "type": "text"
        },
        "name_autocomplete_ja": {
          "analyzer": "autocomplete_analyzer_ja",
          "type": "text"
        },
        "name_ja": {
          "analyzer": "kuromoji",
          "type": "text"
        }
      },
      "type": "nested"
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
    "uuid": {
      "fields": {
        "keyword": {
          "ignore_above": 256,
          "type": "keyword"
        }
      },
      "type": "text"
    },
    "without_check_list": {
      "type": "boolean"
    }
  }
}