{
  "dynamic": "true",
  "properties": {
    "ancestor_ids": {
      "type": "integer"
    },
    "ancestry": {
      "type": "keyword"
    },
    "atlas_id": {
      "type": "integer"
    },
    "colors": {
      "properties": {
        "id": {
          "index": false,
          "type": "byte"
        },
        "value": {
          "index": false,
          "type": "keyword"
        }
      }
    },
    "complete_rank": {
      "type": "keyword"
    },
    "complete_species_count": {
      "type": "integer"
    },
    "created_at": {
      "type": "date"
    },
    "current_synonymous_taxon_ids": {
      "type": "integer"
    },
    "default_photo": {
      "properties": {
        "attribution": {
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
          "index": false,
          "type": "keyword"
        },
        "medium_url": {
          "index": false,
          "type": "keyword"
        },
        "original_dimensions": {
          "properties": {
            "height": {
              "index": false,
              "type": "short"
            },
            "width": {
              "index": false,
              "type": "short"
            }
          }
        },
        "square_url": {
          "index": false,
          "type": "keyword"
        },
        "url": {
          "index": false,
          "type": "keyword"
        }
      }
    },
    "extinct": {
      "type": "boolean"
    },
    "flag_counts": {
      "properties": {
        "resolved": {
          "index": false,
          "type": "short"
        },
        "unresolved": {
          "index": false,
          "type": "short"
        }
      }
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
    "is_active": {
      "type": "boolean"
    },
    "listed_taxa": {
      "properties": {
        "establishment_means": {
          "index": false,
          "type": "keyword"
        },
        "id": {
          "index": false,
          "type": "integer"
        },
        "occurrence_status_level": {
          "index": false,
          "type": "byte"
        },
        "place_id": {
          "index": false,
          "type": "integer"
        },
        "user_id": {
          "index": false,
          "type": "integer"
        }
      }
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
    "names": {
      "properties": {
        "exact": {
          "type": "keyword"
        },
        "exact_ci": {
          "analyzer": "keyword_analyzer",
          "type": "text"
        },
        "is_valid": {
          "type": "boolean"
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
        },
        "place_taxon_names": {
          "properties": {
            "place_id": {
              "type": "integer"
            },
            "position": {
              "type": "short"
            }
          }
        },
        "position": {
          "type": "short"
        }
      },
      "type": "nested"
    },
    "observations_count": {
      "type": "integer"
    },
    "parent_id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "photos_locked": {
      "index": false,
      "type": "boolean"
    },
    "place_ids": {
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
      }
    },
    "taxon_changes_count": {
      "type": "byte"
    },
    "taxon_photos": {
      "properties": {
        "license_code": {
          "index": false,
          "type": "keyword"
        },
        "photo": {
          "properties": {
            "attribution": {
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
            "large_url": {
              "index": false,
              "type": "keyword"
            },
            "license_code": {
              "index": false,
              "type": "keyword"
            },
            "medium_url": {
              "index": false,
              "type": "keyword"
            },
            "native_page_url": {
              "index": false,
              "type": "keyword"
            },
            "native_photo_id": {
              "index": false,
              "type": "keyword"
            },
            "original_dimensions": {
              "properties": {
                "height": {
                  "index": false,
                  "type": "short"
                },
                "width": {
                  "index": false,
                  "type": "short"
                }
              }
            },
            "original_url": {
              "index": false,
              "type": "keyword"
            },
            "small_url": {
              "index": false,
              "type": "keyword"
            },
            "square_url": {
              "index": false,
              "type": "keyword"
            },
            "type": {
              "index": false,
              "type": "keyword"
            },
            "url": {
              "index": false,
              "type": "keyword"
            }
          }
        },
        "taxon_id": {
          "index": false,
          "type": "integer"
        }
      }
    },
    "taxon_schemes_count": {
      "type": "byte"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "uuid": {
      "type": "keyword"
    },
    "wikipedia_url": {
      "index": false,
      "type": "keyword"
    }
  }
}