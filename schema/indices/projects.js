{
  "dynamic": "true",
  "properties": {
    "admins": {
      "properties": {
        "id": {
          "index": false,
          "type": "integer"
        },
        "project_id": {
          "index": false,
          "type": "integer"
        },
        "role": {
          "index": false,
          "type": "keyword"
        },
        "user_id": {
          "index": false,
          "type": "integer"
        }
      }
    },
    "ancestor_place_ids": {
      "type": "keyword"
    },
    "associated_place_ids": {
      "type": "keyword"
    },
    "banner_color": {
      "index": false,
      "type": "keyword"
    },
    "created_at": {
      "type": "date"
    },
    "description": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "flags": {
      "properties": {
        "comment": {
          "index": false,
          "type": "keyword"
        },
        "created_at": {
          "index": false,
          "type": "date"
        },
        "flag": {
          "index": false,
          "type": "keyword"
        },
        "id": {
          "index": false,
          "type": "integer"
        },
        "resolved": {
          "index": false,
          "type": "boolean"
        },
        "resolver_id": {
          "index": false,
          "type": "integer"
        },
        "updated_at": {
          "index": false,
          "type": "date"
        },
        "user_id": {
          "index": false,
          "type": "integer"
        }
      }
    },
    "geojson": {
      "type": "geo_shape"
    },
    "header_image_contain": {
      "index": false,
      "type": "boolean"
    },
    "header_image_file_name": {
      "index": false,
      "type": "keyword"
    },
    "header_image_url": {
      "index": false,
      "type": "keyword"
    },
    "hide_title": {
      "index": false,
      "type": "boolean"
    },
    "hide_umbrella_map_flags": {
      "type": "boolean"
    },
    "icon": {
      "index": false,
      "type": "keyword"
    },
    "icon_file_name": {
      "index": false,
      "type": "keyword"
    },
    "id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "last_post_at": {
      "type": "date"
    },
    "location": {
      "type": "geo_point"
    },
    "observation_requirements_updated_at": {
      "index": false,
      "type": "date"
    },
    "observations_count": {
      "type": "integer"
    },
    "place_id": {
      "type": "keyword"
    },
    "place_ids": {
      "type": "keyword"
    },
    "prefers_user_trust": {
      "type": "boolean"
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
              "analyzer": "ascii_snowball_analyzer",
              "type": "text"
            },
            "description_autocomplete": {
              "analyzer": "autocomplete_analyzer",
              "search_analyzer": "standard_analyzer",
              "type": "text"
            },
            "id": {
              "type": "integer"
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
      },
      "type": "nested"
    },
    "project_type": {
      "type": "keyword"
    },
    "rule_place_ids": {
      "type": "integer"
    },
    "rule_preferences": {
      "properties": {
        "field": {
          "type": "keyword"
        },
        "value": {
          "type": "text"
        }
      },
      "type": "nested"
    },
    "search_parameter_fields": {
      "properties": {
        "d1": {
          "format": "date_optional_time",
          "type": "date"
        },
        "d2": {
          "format": "date_optional_time",
          "type": "date"
        },
        "d2_date": {
          "format": "yyyy-MM-dd",
          "type": "date"
        },
        "introduced": {
          "type": "boolean"
        },
        "month": {
          "type": "byte"
        },
        "native": {
          "type": "boolean"
        },
        "not_in_place": {
          "type": "keyword"
        },
        "not_user_id": {
          "type": "keyword"
        },
        "observed_on": {
          "format": "date_optional_time",
          "type": "date"
        },
        "photos": {
          "type": "boolean"
        },
        "place_id": {
          "type": "keyword"
        },
        "project_id": {
          "type": "keyword"
        },
        "quality_grade": {
          "type": "keyword"
        },
        "sounds": {
          "type": "boolean"
        },
        "taxon_id": {
          "type": "keyword"
        },
        "term_id": {
          "type": "keyword"
        },
        "term_value_id": {
          "type": "keyword"
        },
        "user_id": {
          "type": "keyword"
        },
        "without_taxon_id": {
          "type": "keyword"
        }
      }
    },
    "search_parameters": {
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
          "format": "date_optional_time",
          "type": "date"
        },
        "value_keyword": {
          "type": "keyword"
        },
        "value_number": {
          "type": "long"
        }
      },
      "type": "nested"
    },
    "site_features": {
      "properties": {
        "featured_at": {
          "type": "date"
        },
        "noteworthy": {
          "type": "boolean"
        },
        "site_id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "short"
        },
        "updated_at": {
          "type": "date"
        }
      },
      "type": "nested"
    },
    "slug": {
      "analyzer": "keyword_analyzer",
      "type": "text"
    },
    "spam": {
      "type": "boolean"
    },
    "subproject_ids": {
      "type": "integer"
    },
    "terms": {
      "index": false,
      "type": "text"
    },
    "title": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "title_autocomplete": {
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer",
      "type": "text"
    },
    "title_exact": {
      "type": "keyword"
    },
    "umbrella_project_ids": {
      "type": "keyword"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "updated_at": {
      "type": "date"
    },
    "user_id": {
      "type": "keyword"
    },
    "user_ids": {
      "type": "keyword"
    }
  }
}
