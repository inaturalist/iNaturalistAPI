{
  "observation": {
    "dynamic": "true",
    "properties": {
      "annotations": {
        "type": "nested",
        "properties": {
          "concatenated_attr_val": {
            "type": "keyword"
          },
          "controlled_attribute_id": {
            "type": "long"
          },
          "controlled_value_id": {
            "type": "long"
          },
          "resource_type": {
            "type": "keyword"
          },
          "uuid": {
            "type": "keyword"
          },
          "vote_score": {
            "type": "long"
          }
        }
      },
      "cached_votes_total": {
        "type": "long"
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
      "comments_count": {
        "type": "long"
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
      "created_time_zone": {
        "type": "keyword"
      },
      "description": {
        "type": "text",
        "analyzer": "ascii_snowball_analyzer"
      },
      "faves_count": {
        "type": "long"
      },
      "field_change_times": {
        "type": "nested",
        "properties": {
          "changed_at": {
            "type": "date"
          },
          "field_name": {
            "type": "keyword"
          },
          "project_id": {
            "type": "long"
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
      "identifications_count": {
        "type": "long"
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
      "license_code": {
        "type": "keyword"
      },
      "location": {
        "type": "geo_point"
      },
      "mappable": {
        "type": "boolean"
      },
      "identifications": {
        "type": "nested",
        "properties": {
          "body": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
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
          "id": {
            "type": "long"
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
      "num_identification_agreements": {
        "type": "long"
      },
      "num_identification_disagreements": {
        "type": "long"
      },
      "obscured": {
        "type": "boolean"
      },
      "observation_photos": {
        "properties": {
          "photo_id": {
            "type": "long"
          },
          "position": {
            "type": "long"
          },
          "uuid": {
            "type": "keyword"
          }
        }
      },
      "observed_on": {
        "type": "date",
        "format": "dateOptionalTime"
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
      "observed_on_string": {
        "type": "text"
      },
      "observed_time_zone": {
        "type": "keyword"
      },
      "ofvs": {
        "type": "nested",
        "properties": {
          "name": {
            "type": "keyword"
          },
          "name_ci": {
            "type": "text",
            "analyzer": "keyword_analyzer"
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
      "photos": {
        "properties": {
          "attribution": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "id": {
            "type": "long"
          },
          "license_code": {
            "type": "keyword"
          },
          "url": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
        }
      },
      "place_guess": {
        "type": "text",
        "analyzer": "ascii_snowball_analyzer"
      },
      "place_ids": {
        "type": "long"
      },
      "private_geojson": {
        "type": "geo_shape"
      },
      "private_location": {
        "type": "geo_point"
      },
      "project_ids": {
        "type": "long"
      },
      "project_ids_with_curator_id": {
        "type": "long"
      },
      "project_ids_without_curator_id": {
        "type": "long"
      },
      "project_observations": {
        "properties": {
          "project_id": {
            "type": "long"
          },
          "uuid": {
            "type": "keyword"
          }
        }
      },
      "quality_grade": {
        "type": "keyword"
      },
      "reviewed_by": {
        "type": "long"
      },
      "site_id": {
        "type": "long"
      },
      "sounds": {
        "properties": {
          "attribution": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "id": {
            "type": "long"
          },
          "license_code": {
            "type": "keyword"
          },
          "native_sound_id": {
            "type": "keyword"
          }
        }
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
            "type": "long"
          },
          "ancestry": {
            "type": "keyword"
          },
          "endemic": {
            "type": "boolean"
          },
          "iconic_taxon_id": {
            "type": "long"
          },
          "id": {
            "type": "long"
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
          "name": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "names": {
            "properties": {
              "locale": {
                "type": "keyword"
              },
              "name": {
                "type": "text",
                "analyzer": "ascii_snowball_analyzer"
              },
              "place_taxon_names": {
                "properties": {
                  "place_id": {
                    "type": "long"
                  },
                  "position": {
                    "type": "long"
                  }
                }
              },
              "position": {
                "type": "long"
              }
            }
          },
          "native": {
            "type": "boolean"
          },
          "parent_id": {
            "type": "long"
          },
          "rank": {
            "type": "keyword"
          },
          "rank_level": {
            "type": "long"
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
                "type": "long"
              },
              "place_id": {
                "type": "long"
              },
              "source_id": {
                "type": "long"
              },
              "status": {
                "type": "keyword"
              }
            }
          },
          "threatened": {
            "type": "boolean"
          }
        }
      },
      "time_observed_at": {
        "type": "date"
      },
      "time_zone_offset": {
        "type": "keyword"
      },
      "updated_at": {
        "type": "date"
      },
      "uri": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
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
        "type": "keyword"
      }
    }
  }
}
