{
  "dynamic": "true",
  "properties": {
    "annotations": {
      "properties": {
        "concatenated_attr_val": {
          "type": "keyword"
        },
        "controlled_attribute_id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "short"
        },
        "controlled_value_id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
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
              "index": false,
              "type": "date"
            },
            "id": {
              "index": false,
              "type": "integer"
            },
            "user_id": {
              "index": false,
              "type": "integer"
            },
            "vote_flag": {
              "index": false,
              "type": "boolean"
            }
          }
        }
      },
      "type": "nested"
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
          "analyzer": "ascii_snowball_analyzer",
          "type": "text"
        },
        "created_at": {
          "index": false,
          "type": "date"
        },
        "created_at_details": {
          "properties": {
            "date": {
              "index": false,
              "type": "date"
            },
            "day": {
              "index": false,
              "type": "byte"
            },
            "hour": {
              "index": false,
              "type": "byte"
            },
            "month": {
              "index": false,
              "type": "byte"
            },
            "week": {
              "index": false,
              "type": "byte"
            },
            "year": {
              "index": false,
              "type": "short"
            }
          }
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
        "hidden": {
          "type": "boolean"
        },
        "id": {
          "type": "integer"
        },
        "moderator_actions": {
          "properties": {
            "action": {
              "index": false,
              "type": "keyword"
            },
            "created_at": {
              "type": "date"
            },
            "created_at_details": {
              "properties": {
                "date": {
                  "index": false,
                  "type": "date"
                },
                "day": {
                  "index": false,
                  "type": "byte"
                },
                "hour": {
                  "index": false,
                  "type": "byte"
                },
                "month": {
                  "index": false,
                  "type": "byte"
                },
                "week": {
                  "index": false,
                  "type": "byte"
                },
                "year": {
                  "index": false,
                  "type": "short"
                }
              }
            },
            "id": {
              "type": "integer"
            },
            "reason": {
              "analyzer": "ascii_snowball_analyzer",
              "index": false,
              "type": "text"
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
                "site_id": {
                  "type": "integer"
                },
                "spam": {
                  "type": "boolean"
                },
                "suspended": {
                  "type": "boolean"
                }
              }
            }
          }
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
            },
            "uuid": {
              "type": "keyword"
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
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
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
      "index": false,
      "type": "keyword"
    },
    "description": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "faves_count": {
      "type": "short"
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
    "geoprivacy": {
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
    "id_please": {
      "type": "boolean"
    },
    "ident_taxon_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
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
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
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
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "num_identification_agreements": {
      "type": "short"
    },
    "num_identification_disagreements": {
      "type": "short"
    },
    "oauth_application_id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "short"
    },
    "obscured": {
      "type": "boolean"
    },
    "observed_on": {
      "format": "date_optional_time",
      "type": "date"
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
      "index": false,
      "type": "keyword"
    },
    "ofvs": {
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
          "analyzer": "keyword_analyzer",
          "type": "text"
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
          "analyzer": "keyword_analyzer",
          "type": "text"
        }
      },
      "type": "nested"
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
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "place_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "positional_accuracy": {
      "type": "integer"
    },
    "preferences": {
      "properties": {
        "name": {
          "index": false,
          "type": "keyword"
        },
        "value": {
          "index": false,
          "type": "keyword"
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
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "private_place_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "project_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
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
          "index": false,
          "type": "keyword"
        },
        "user_id": {
          "type": "integer"
        }
      }
    },
    "reviewed_by": {
      "type": "keyword"
    },
    "site_id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "sound_licenses": {
      "type": "keyword"
    },
    "sounds": {
      "properties": {
        "attribution": {
          "index": false,
          "type": "keyword"
        },
        "file_content_type": {
          "index": false,
          "type": "keyword"
        },
        "file_url": {
          "index": false,
          "type": "keyword"
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
        "id": {
          "type": "integer"
        },
        "license_code": {
          "type": "keyword"
        },
        "native_sound_id": {
          "index": false,
          "type": "keyword"
        },
        "play_local": {
          "type": "boolean"
        },
        "secret_token": {
          "index": false,
          "type": "keyword"
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
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "taxon": {
      "properties": {
        "ancestor_ids": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
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
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "integer"
        },
        "id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
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
          "analyzer": "ascii_snowball_analyzer",
          "type": "text"
        },
        "native": {
          "type": "boolean"
        },
        "parent_id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "integer"
        },
        "rank": {
          "type": "keyword"
        },
        "rank_level": {
          "scaling_factor": 100.0,
          "type": "scaled_float"
        },
        "statuses": {
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
            },
            "user_id": {
              "type": "integer"
            }
          },
          "type": "nested"
        },
        "threatened": {
          "type": "boolean"
        },
        "uuid": {
          "type": "keyword"
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
      "index": false,
      "type": "keyword"
    },
    "updated_at": {
      "type": "date"
    },
    "uri": {
      "index": false,
      "type": "keyword"
    },
    "user": {
      "properties": {
        "created_at": {
          "type": "date"
        },
        "id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "integer"
        },
        "login": {
          "type": "keyword"
        },
        "site_id": {
          "type": "integer"
        },
        "spam": {
          "type": "boolean"
        },
        "suspended": {
          "type": "boolean"
        },
        "uuid": {
          "type": "keyword"
        }
      }
    },
    "uuid": {
      "type": "keyword"
    },
    "votes": {
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
      },
      "type": "nested"
    }
  }
}
