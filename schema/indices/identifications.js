{
  "identification": {
    "dynamic": "true",
    "properties": {
      "body": {
        "type": "string",
        "analyzer": "ascii_snowball_analyzer"
      },
      "category": {
        "type": "string",
        "analyzer": "keyword_analyzer"
      },
      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "created_at_details": {
        "properties": {
          "date": {
            "type": "date",
            "format": "strict_date_optional_time||epoch_millis"
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
            "type": "date",
            "format": "strict_date_optional_time||epoch_millis"
          },
          "created_at_details": {
            "properties": {
              "date": {
                "type": "date",
                "format": "strict_date_optional_time||epoch_millis"
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
            "type": "date",
            "format": "strict_date_optional_time||epoch_millis"
          },
          "observed_on_details": {
            "properties": {
              "date": {
                "type": "date",
                "format": "strict_date_optional_time||epoch_millis"
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
            "type": "string"
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
                "type": "string"
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
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "parent_id": {
                "type": "long"
              },
              "rank": {
                "type": "string"
              },
              "rank_level": {
                "type": "long"
              }
            }
          },
          "time_observed_at": {
            "type": "date",
            "format": "strict_date_optional_time||epoch_millis"
          },
          "user": {
            "properties": {
              "id": {
                "type": "long"
              },
              "login": {
                "type": "string"
              }
            }
          },
          "uuid": {
            "type": "string"
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
            "type": "string"
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
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "parent_id": {
            "type": "long"
          },
          "rank": {
            "type": "string"
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
            "type": "string"
          }
        }
      },
      "uuid": {
        "type": "string",
        "analyzer": "keyword_analyzer"
      }
    }
  }
}