{
  "identification": {
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
            "type": "date"
          },
          "day": {
            "type": "long"
          },
          "hour": {
            "type": "long"
          },
          "month": {
            "type": "long"
          },
          "week": {
            "type": "long"
          },
          "year": {
            "type": "long"
          }
        }
      },
      "current": {
        "type": "boolean"
      },
      "current_taxon": {
        "type": "boolean"
      },
      "id": {
        "type": "long"
      },
      "observation": {
        "properties": {
          "captive": {
            "type": "boolean"
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
                "type": "long"
              },
              "hour": {
                "type": "long"
              },
              "month": {
                "type": "long"
              },
              "week": {
                "type": "long"
              },
              "year": {
                "type": "long"
              }
            }
          },
          "id": {
            "type": "long"
          },
          "observed_on": {
            "type": "date"
          },
          "observed_on_details": {
            "properties": {
              "date": {
                "type": "date"
              },
              "day": {
                "type": "long"
              },
              "hour": {
                "type": "long"
              },
              "month": {
                "type": "long"
              },
              "week": {
                "type": "long"
              },
              "year": {
                "type": "long"
              }
            }
          },
          "place_ids": {
            "type": "long"
          },
          "quality_grade": {
            "type": "keyword"
          },
          "site_id": {
            "type": "long"
          },
          "taxon": {
            "properties": {
              "ancestor_ids": {
                "type": "long"
              },
              "ancestry": {
                "type": "keyword"
              },
              "iconic_taxon_id": {
                "type": "long"
              },
              "id": {
                "type": "long"
              },
              "is_active": {
                "type": "boolean"
              },
              "min_species_ancestry": {
                "type": "keyword"
              },
              "name": {
                "type": "text",
                "fields": {
                  "keyword": {
                    "type": "keyword",
                    "ignore_above": 256
                  }
                }
              },
              "parent_id": {
                "type": "long"
              },
              "rank": {
                "type": "keyword"
              },
              "rank_level": {
                "type": "long"
              }
            }
          },
          "time_observed_at": {
            "type": "date"
          },
          "user": {
            "properties": {
              "id": {
                "type": "long"
              },
              "login": {
                "type": "keyword"
              }
            }
          },
          "uuid": {
            "type": "keyword"
          }
        }
      },
      "own_observation": {
        "type": "boolean"
      },
      "taxon": {
        "properties": {
          "ancestor_ids": {
            "type": "long"
          },
          "ancestry": {
            "type": "keyword"
          },
          "iconic_taxon_id": {
            "type": "long"
          },
          "id": {
            "type": "long"
          },
          "is_active": {
            "type": "boolean"
          },
          "min_species_ancestors": {
            "properties": {
              "id": {
                "type": "long"
              }
            }
          },
          "min_species_ancestry": {
            "type": "keyword"
          },
          "name": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "parent_id": {
            "type": "long"
          },
          "rank": {
            "type": "keyword"
          },
          "rank_level": {
            "type": "long"
          }
        }
      },
      "user": {
        "properties": {
          "id": {
            "type": "long"
          },
          "login": {
            "type": "keyword"
          }
        }
      },
      "uuid": {
        "type": "text",
        "analyzer": "keyword_analyzer"
      }
    }
  }
}