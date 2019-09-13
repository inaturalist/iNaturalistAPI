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
          "type": "byte",
          "index": false
        },
        "value": {
          "type": "keyword",
          "index": false
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
          "type": "keyword",
          "index": false
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
        "id": {
          "type": "integer"
        },
        "license_code": {
          "type": "keyword",
          "index": false
        },
        "medium_url": {
          "type": "keyword",
          "index": false
        },
        "original_dimensions": {
          "properties": {
            "height": {
              "type": "short",
              "index": false
            },
            "width": {
              "type": "short",
              "index": false
            }
          }
        },
        "square_url": {
          "type": "keyword",
          "index": false
        },
        "url": {
          "type": "keyword",
          "index": false
        }
      }
    },
    "extinct": {
      "type": "boolean"
    },
    "flag_counts": {
      "properties": {
        "resolved": {
          "type": "short",
          "index": false
        },
        "unresolved": {
          "type": "short",
          "index": false
        }
      }
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
    "listed_taxa": {
      "properties": {
        "establishment_means": {
          "type": "keyword",
          "index": false
        },
        "id": {
          "type": "integer",
          "index": false
        },
        "occurrence_status_level": {
          "type": "byte",
          "index": false
        },
        "place_id": {
          "type": "integer",
          "index": false
        },
        "user_id": {
          "type": "integer",
          "index": false
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
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "names": {
      "type": "nested",
      "properties": {
        "exact": {
          "type": "keyword"
        },
        "exact_ci": {
          "type": "text",
          "analyzer": "keyword_analyzer"
        },
        "is_valid": {
          "type": "boolean"
        },
        "locale": {
          "type": "keyword"
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
        "name_autocomplete_ja": {
          "type": "text",
          "analyzer": "autocomplete_analyzer_ja"
        },
        "name_ja": {
          "type": "text",
          "analyzer": "kuromoji"
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
      }
    },
    "observations_count": {
      "type": "integer"
    },
    "parent_id": {
      "type": "integer"
    },
    "place_ids": {
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
    "taxon_changes_count": {
      "type": "byte"
    },
    "taxon_photos": {
      "properties": {
        "license_code": {
          "type": "keyword",
          "index": false
        },
        "photo": {
          "properties": {
            "attribution": {
              "type": "keyword",
              "index": false
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
            "id": {
              "type": "integer"
            },
            "large_url": {
              "type": "keyword",
              "index": false
            },
            "license_code": {
              "type": "keyword",
              "index": false
            },
            "medium_url": {
              "type": "keyword",
              "index": false
            },
            "native_page_url": {
              "type": "keyword",
              "index": false
            },
            "native_photo_id": {
              "type": "keyword",
              "index": false
            },
            "original_dimensions": {
              "properties": {
                "height": {
                  "type": "short",
                  "index": false
                },
                "width": {
                  "type": "short",
                  "index": false
                }
              }
            },
            "original_url": {
              "type": "keyword",
              "index": false
            },
            "small_url": {
              "type": "keyword",
              "index": false
            },
            "square_url": {
              "type": "keyword",
              "index": false
            },
            "type": {
              "type": "keyword",
              "index": false
            },
            "url": {
              "type": "keyword",
              "index": false
            }
          }
        },
        "taxon_id": {
          "type": "integer",
          "index": false
        }
      }
    },
    "taxon_schemes_count": {
      "type": "byte"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "wikipedia_url": {
      "type": "keyword",
      "index": false
    }
  }
}
