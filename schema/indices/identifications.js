{
  "dynamic": "true",
  "properties": {
    "body": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "category": {
      "type": "keyword"
    },
    "created_at": {
      "type": "date"
    },
    "created_at_details": {
      "properties": {
        "date": {
          "type": "date",
          "index": false
        },
        "day": {
          "type": "byte",
          "index": false
        },
        "hour": {
          "type": "byte",
          "index": false
        },
        "month": {
          "type": "byte",
          "index": false
        },
        "week": {
          "type": "byte",
          "index": false
        },
        "year": {
          "type": "short",
          "index": false
        }
      }
    },
    "current": {
      "type": "boolean"
    },
    "current_taxon": {
      "type": "boolean"
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
    "hidden": {
      "type": "boolean"
    },
    "id": {
      "type": "integer"
    },
    "observation": {
      "properties": {
        "created_at": {
          "type": "date"
        },
        "created_at_details": {
          "properties": {
            "date": {
              "type": "date",
              "index": false
            },
            "day": {
              "type": "byte",
              "index": false
            },
            "hour": {
              "type": "byte",
              "index": false
            },
            "month": {
              "type": "byte",
              "index": false
            },
            "week": {
              "type": "byte",
              "index": false
            },
            "year": {
              "type": "short",
              "index": false
            }
          }
        },
        "id": {
          "type": "integer"
        },
        "observed_on": {
          "type": "date",
          "format": "date_optional_time"
        },
        "observed_on_details": {
          "properties": {
            "date": {
              "type": "date",
              "index": false
            },
            "day": {
              "type": "byte",
              "index": false
            },
            "hour": {
              "type": "byte",
              "index": false
            },
            "month": {
              "type": "byte",
              "index": false
            },
            "week": {
              "type": "byte",
              "index": false
            },
            "year": {
              "type": "short",
              "index": false
            }
          }
        },
        "place_ids": {
          "type": "integer"
        },
        "quality_grade": {
          "type": "keyword"
        },
        "site_id": {
          "type": "integer"
        },
        "taxon": {
          "properties": {
            "ancestor_ids": {
              "type": "integer"
            },
            "iconic_taxon_id": {
              "type": "integer"
            },
            "id": {
              "type": "integer"
            },
            "is_active": {
              "type": "boolean"
            },
            "min_species_ancestry": {
              "type": "keyword"
            },
            "min_species_taxon_id": {
              "type": "integer"
            },
            "rank": {
              "type": "keyword"
            },
            "rank_level": {
              "type": "scaled_float",
              "scaling_factor": 100.0
            }
          }
        },
        "time_observed_at": {
          "type": "date"
        },
        "user_id": {
          "type": "integer"
        }
      }
    },
    "own_observation": {
      "type": "boolean"
    },
    "previous_observation_taxon_id": {
      "type": "integer"
    },
    "spam": {
      "type": "boolean"
    },
    "taxon": {
      "properties": {
        "ancestor_ids": {
          "type": "integer"
        },
        "iconic_taxon_id": {
          "type": "integer"
        },
        "id": {
          "type": "integer"
        },
        "is_active": {
          "type": "boolean"
        },
        "min_species_ancestry": {
          "type": "keyword"
        },
        "min_species_taxon_id": {
          "type": "integer"
        },
        "rank": {
          "type": "keyword"
        },
        "rank_level": {
          "type": "scaled_float",
          "scaling_factor": 100.0
        }
      }
    },
    "taxon_change": {
      "properties": {
        "id": {
          "type": "integer"
        },
        "type": {
          "type": "keyword"
        }
      }
    },
    "taxon_id": {
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
      "type": "keyword"
    },
    "vision": {
      "type": "boolean"
    }
  }
}
