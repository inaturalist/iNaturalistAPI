{
  "dynamic": "true",
  "properties": {
    "annotations": {
      "type": "nested",
      "properties": {
        "concatenated_attr_val": {
          "type": "keyword"
        },
        "controlled_attribute_id": {
          "type": "short"
        },
        "controlled_value_id": {
          "type": "short"
        },
        "resource_type": {
          "type": "keyword"
        },
        "user_id": {
          "type": "keyword"
        },
        "uuid": {
          "type": "keyword"
        },
        "vote_score": {
          "type": "byte"
        },
        "votes": {
          "properties": {
            "created_at": {
              "type": "date",
              "index": false
            },
            "id": {
              "type": "integer",
              "index": false
            },
            "user_id": {
              "type": "integer",
              "index": false
            },
            "vote_flag": {
              "type": "boolean",
              "index": false
            }
          }
        }
      }
    },
    "cached_votes_total": {
      "type": "short"
    },
    "captive": {
      "type": "boolean"
    },
    "comments": {
      "properties": {
        "body": {
          "type": "text",
          "analyzer": "ascii_snowball_analyzer"
        },
        "created_at": {
          "type": "date",
          "index": false
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
        }
      }
    },
    "comments_count": {
      "type": "short"
    },
    "community_taxon_id": {
      "type": "integer"
    },
    "context_geoprivacy": {
      "type": "keyword"
    },
    "context_taxon_geoprivacy": {
      "type": "keyword"
    },
    "context_user_geoprivacy": {
      "type": "keyword"
    },
    "created_at": {
      "type": "date"
    },
    "created_at_details": {
      "properties": {
        "date": {
          "type": "date"
        },
        "day": {
          "type": "byte"
        },
        "hour": {
          "type": "byte"
        },
        "month": {
          "type": "byte"
        },
        "week": {
          "type": "byte"
        },
        "year": {
          "type": "short"
        }
      }
    },
    "created_time_zone": {
      "type": "keyword",
      "index": false
    },
    "description": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "faves_count": {
      "type": "short"
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
    "geoprivacy": {
      "type": "keyword"
    },
    "id": {
      "type": "integer"
    },
    "id_please": {
      "type": "boolean"
    },
    "ident_taxon_ids": {
      "type": "integer"
    },
    "identification_categories": {
      "type": "keyword"
    },
    "identifications_count": {
      "type": "short"
    },
    "identifications_most_agree": {
      "type": "boolean"
    },
    "identifications_most_disagree": {
      "type": "boolean"
    },
    "identifications_some_agree": {
      "type": "boolean"
    },
    "identifier_user_ids": {
      "type": "integer"
    },
    "license_code": {
      "type": "keyword"
    },
    "location": {
      "type": "geo_point"
    },
    "map_scale": {
      "type": "byte"
    },
    "mappable": {
      "type": "boolean"
    },
    "non_owner_identifier_user_ids": {
      "type": "integer"
    },
    "num_identification_agreements": {
      "type": "short"
    },
    "num_identification_disagreements": {
      "type": "short"
    },
    "oauth_application_id": {
      "type": "short"
    },
    "obscured": {
      "type": "boolean"
    },
    "observed_on": {
      "type": "date",
      "format": "date_optional_time"
    },
    "observed_on_details": {
      "properties": {
        "date": {
          "type": "date"
        },
        "day": {
          "type": "byte"
        },
        "hour": {
          "type": "byte"
        },
        "month": {
          "type": "byte"
        },
        "week": {
          "type": "byte"
        },
        "year": {
          "type": "short"
        }
      }
    },
    "observed_on_string": {
      "type": "text"
    },
    "observed_time_zone": {
      "type": "keyword",
      "index": false
    },
    "ofvs": {
      "type": "nested",
      "properties": {
        "datatype": {
          "type": "keyword"
        },
        "field_id": {
          "type": "integer"
        },
        "id": {
          "type": "integer"
        },
        "name": {
          "type": "keyword"
        },
        "name_ci": {
          "type": "text",
          "analyzer": "keyword_analyzer"
        },
        "taxon_id": {
          "type": "integer"
        },
        "user_id": {
          "type": "integer"
        },
        "uuid": {
          "type": "keyword"
        },
        "value": {
          "type": "keyword"
        },
        "value_ci": {
          "type": "text",
          "analyzer": "keyword_analyzer"
        }
      }
    },
    "out_of_range": {
      "type": "boolean"
    },
    "outlinks": {
      "properties": {
        "source": {
          "type": "keyword"
        },
        "url": {
          "type": "keyword"
        }
      }
    },
    "owners_identification_from_vision": {
      "type": "boolean"
    },
    "photo_licenses": {
      "type": "keyword"
    },
    "photos_count": {
      "type": "short"
    },
    "place_guess": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "place_ids": {
      "type": "integer"
    },
    "positional_accuracy": {
      "type": "integer"
    },
    "preferences": {
      "properties": {
        "name": {
          "type": "keyword",
          "index": false
        },
        "value": {
          "type": "keyword",
          "index": false
        }
      }
    },
    "private_geojson": {
      "type": "geo_shape"
    },
    "private_location": {
      "type": "geo_point"
    },
    "private_place_guess": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "private_place_ids": {
      "type": "integer"
    },
    "project_ids": {
      "type": "integer"
    },
    "project_ids_with_curator_id": {
      "type": "integer"
    },
    "project_ids_without_curator_id": {
      "type": "integer"
    },
    "public_positional_accuracy": {
      "type": "integer"
    },
    "quality_grade": {
      "type": "keyword"
    },
    "quality_metrics": {
      "properties": {
        "agree": {
          "type": "boolean"
        },
        "id": {
          "type": "integer"
        },
        "metric": {
          "type": "keyword",
          "index": false
        },
        "user_id": {
          "type": "integer"
        }
      }
    },
    "reviewed_by": {
      "type": "integer"
    },
    "site_id": {
      "type": "integer"
    },
    "sound_licenses": {
      "type": "keyword"
    },
    "sounds": {
      "properties": {
        "attribution": {
          "type": "keyword",
          "index": false
        },
        "file_content_type": {
          "type": "keyword",
          "index": false
        },
        "file_url": {
          "type": "keyword",
          "index": false
        },
        "id": {
          "type": "integer"
        },
        "license_code": {
          "type": "keyword"
        },
        "native_sound_id": {
          "type": "keyword",
          "index": false
        },
        "play_local": {
          "type": "boolean"
        },
        "secret_token": {
          "type": "keyword",
          "index": false
        },
        "subtype": {
          "type": "keyword"
        }
      }
    },
    "sounds_count": {
      "type": "short"
    },
    "spam": {
      "type": "boolean"
    },
    "species_guess": {
      "type": "keyword"
    },
    "tags": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "taxon": {
      "properties": {
        "ancestor_ids": {
          "type": "integer"
        },
        "ancestry": {
          "type": "keyword"
        },
        "endemic": {
          "type": "boolean"
        },
        "extinct": {
          "type": "boolean"
        },
        "iconic_taxon_id": {
          "type": "integer"
        },
        "id": {
          "type": "integer"
        },
        "introduced": {
          "type": "boolean"
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
        "name": {
          "type": "text",
          "analyzer": "ascii_snowball_analyzer"
        },
        "native": {
          "type": "boolean"
        },
        "parent_id": {
          "type": "integer"
        },
        "rank": {
          "type": "keyword"
        },
        "rank_level": {
          "type": "scaled_float",
          "scaling_factor": 100.0
        },
        "statuses": {
          "type": "nested",
          "properties": {
            "authority": {
              "type": "keyword"
            },
            "geoprivacy": {
              "type": "keyword"
            },
            "iucn": {
              "type": "byte"
            },
            "place_id": {
              "type": "integer"
            },
            "source_id": {
              "type": "short"
            },
            "status": {
              "type": "keyword"
            },
            "status_name": {
              "type": "keyword"
            }
          }
        },
        "threatened": {
          "type": "boolean"
        }
      }
    },
    "taxon_geoprivacy": {
      "type": "keyword"
    },
    "time_observed_at": {
      "type": "date"
    },
    "time_zone_offset": {
      "type": "keyword",
      "index": false
    },
    "updated_at": {
      "type": "date"
    },
    "uri": {
      "type": "keyword",
      "index": false
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
    "votes": {
      "type": "nested",
      "properties": {
        "created_at": {
          "type": "date"
        },
        "id": {
          "type": "integer"
        },
        "user_id": {
          "type": "integer"
        },
        "vote_flag": {
          "type": "boolean"
        },
        "vote_scope": {
          "type": "keyword"
        }
      }
    }
  }
}
