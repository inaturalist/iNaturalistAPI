{
  "dynamic": "true",
  "properties": {
    "admins": {
      "properties": {
        "id": {
          "type": "integer",
          "index": false
        },
        "project_id": {
          "type": "integer",
          "index": false
        },
        "role": {
          "type": "keyword",
          "index": false
        },
        "user_id": {
          "type": "integer",
          "index": false
        }
      }
    },
    "ancestor_place_ids": {
      "type": "integer"
    },
    "associated_place_ids": {
      "type": "integer"
    },
    "banner_color": {
      "type": "keyword",
      "index": false
    },
    "created_at": {
      "type": "date"
    },
    "description": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "flags": {
      "properties": {
        "comment": {
          "type": "keyword",
          "index": false
        },
        "created_at": {
          "type": "date",
          "index": false
        },
        "flag": {
          "type": "keyword",
          "index": false
        },
        "id": {
          "type": "integer",
          "index": false
        },
        "resolved": {
          "type": "boolean",
          "index": false
        },
        "resolver_id": {
          "type": "integer",
          "index": false
        },
        "updated_at": {
          "type": "date",
          "index": false
        },
        "user_id": {
          "type": "integer",
          "index": false
        }
      }
    },
    "geojson": {
      "type": "geo_shape"
    },
    "header_image_contain": {
      "type": "boolean",
      "index": false
    },
    "header_image_file_name": {
      "type": "keyword",
      "index": false
    },
    "header_image_url": {
      "type": "keyword",
      "index": false
    },
    "hide_title": {
      "type": "boolean",
      "index": false
    },
    "hide_umbrella_map_flags": {
      "type": "boolean"
    },
    "icon": {
      "type": "keyword",
      "index": false
    },
    "icon_file_name": {
      "type": "keyword",
      "index": false
    },
    "id": {
      "type": "integer"
    },
    "last_post_at": {
      "type": "date"
    },
    "location": {
      "type": "geo_point"
    },
    "observations_count": {
      "type": "integer"
    },
    "place_id": {
      "type": "integer"
    },
    "place_ids": {
      "type": "integer"
    },
    "project_observation_fields": {
      "properties": {
        "id": {
          "type": "integer"
        },
        "observation_field": {
          "properties": {
            "allowed_values": {
              "type": "keyword"
            },
            "datatype": {
              "type": "keyword"
            },
            "description": {
              "type": "text",
              "analyzer": "ascii_snowball_analyzer"
            },
            "description_autocomplete": {
              "type": "text",
              "analyzer": "autocomplete_analyzer",
              "search_analyzer": "standard_analyzer"
            },
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "text",
              "analyzer": "ascii_snowball_analyzer"
            },
            "name_autocomplete": {
              "type": "text",
              "analyzer": "autocomplete_analyzer",
              "search_analyzer": "standard_analyzer"
            },
            "users_count": {
              "type": "integer"
            },
            "values_count": {
              "type": "integer"
            }
          }
        },
        "position": {
          "type": "short"
        },
        "required": {
          "type": "boolean"
        }
      }
    },
    "project_observation_rules": {
      "type": "nested",
      "properties": {
        "id": {
          "type": "integer"
        },
        "operand_id": {
          "type": "integer"
        },
        "operand_type": {
          "type": "keyword"
        },
        "operator": {
          "type": "keyword"
        }
      }
    },
    "project_type": {
      "type": "keyword"
    },
    "rule_place_ids": {
      "type": "integer"
    },
    "rule_preferences": {
      "type": "nested",
      "properties": {
        "field": {
          "type": "keyword"
        },
        "value": {
          "type": "text"
        }
      }
    },
    "search_parameter_fields": {
      "properties": {
        "d1": {
          "type": "date",
          "format": "date_optional_time"
        },
        "d2": {
          "type": "date",
          "format": "date_optional_time"
        },
        "d2_date": {
          "type": "date",
          "format": "yyyy-MM-dd"
        },
        "month": {
          "type": "byte"
        },
        "not_in_place": {
          "type": "long"
        },
        "not_user_id": {
          "type": "long"
        },
        "observed_on": {
          "type": "date",
          "format": "date_optional_time"
        },
        "photos": {
          "type": "boolean"
        },
        "place_id": {
          "type": "integer"
        },
        "project_id": {
          "type": "integer"
        },
        "quality_grade": {
          "type": "keyword"
        },
        "sounds": {
          "type": "boolean"
        },
        "taxon_id": {
          "type": "integer"
        },
        "term_id": {
          "type": "long"
        },
        "term_value_id": {
          "type": "long"
        },
        "user_id": {
          "type": "integer"
        },
        "without_taxon_id": {
          "type": "long"
        }
      }
    },
    "search_parameters": {
      "type": "nested",
      "properties": {
        "field": {
          "type": "keyword"
        },
        "value": {
          "type": "text"
        },
        "value_bool": {
          "type": "boolean"
        },
        "value_date": {
          "type": "date",
          "format": "date_optional_time"
        },
        "value_keyword": {
          "type": "keyword"
        },
        "value_number": {
          "type": "long"
        }
      }
    },
    "site_features": {
      "type": "nested",
      "properties": {
        "featured_at": {
          "type": "date"
        },
        "noteworthy": {
          "type": "boolean"
        },
        "site_id": {
          "type": "short"
        },
        "updated_at": {
          "type": "date"
        }
      }
    },
    "slug": {
      "type": "text",
      "analyzer": "keyword_analyzer"
    },
    "spam": {
      "type": "boolean"
    },
    "subproject_ids": {
      "type": "long"
    },
    "terms": {
      "type": "text",
      "index": false
    },
    "title": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "title_autocomplete": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer"
    },
    "title_exact": {
      "type": "keyword"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "updated_at": {
      "type": "date"
    },
    "user_id": {
      "type": "integer"
    },
    "user_ids": {
      "type": "integer"
    }
  }
}
