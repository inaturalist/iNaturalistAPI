{
  "dynamic": "true",
  "properties": {
    "body": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
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
    "current": {
      "type": "boolean"
    },
    "current_taxon": {
      "type": "boolean"
    },
    "disagreement": {
      "type": "boolean"
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
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
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
    "observation": {
      "properties": {
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
        "observed_on": {
          "format": "date_optional_time",
          "type": "date"
        },
        "observed_on_details": {
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
        "place_ids": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "integer"
        },
        "quality_grade": {
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
              "scaling_factor": 100.0,
              "type": "scaled_float"
            }
          }
        },
        "time_observed_at": {
          "type": "date"
        },
        "user_id": {
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
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
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          },
          "type": "integer"
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
          "scaling_factor": 100.0,
          "type": "scaled_float"
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