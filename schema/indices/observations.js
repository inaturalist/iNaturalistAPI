{
  "observation" : {
    "dynamic" : "true",
    "properties" : {
      "cached_votes_total" : {
        "type" : "long"
      },
      "captive" : {
        "type" : "boolean"
      },
      "comments" : {
        "properties" : {
          "body" : {
            "type" : "string"
          },
          "created_at" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "created_at_details" : {
            "properties" : {
              "day" : {
                "type" : "long"
              },
              "hour" : {
                "type" : "long"
              },
              "month" : {
                "type" : "long"
              },
              "week" : {
                "type" : "long"
              },
              "year" : {
                "type" : "long"
              }
            }
          },
          "id" : {
            "type" : "long"
          },
          "user" : {
            "properties" : {
              "icon_url" : {
                "type" : "string"
              },
              "id" : {
                "type" : "long"
              },
              "login" : {
                "type" : "string"
              }
            }
          }
        }
      },
      "comments_count" : {
        "type" : "long"
      },
      "created_at" : {
        "type" : "date",
        "format" : "dateOptionalTime"
      },
      "created_at_details" : {
        "properties" : {
          "day" : {
            "type" : "long"
          },
          "hour" : {
            "type" : "long"
          },
          "month" : {
            "type" : "long"
          },
          "week" : {
            "type" : "long"
          },
          "year" : {
            "type" : "long"
          }
        }
      },
      "description" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "faves_count" : {
        "type" : "long"
      },
      "field_values" : {
        "properties" : {
          "name" : {
            "type" : "string"
          },
          "value" : {
            "type" : "string"
          }
        }
      },
      "geojson" : {
        "type" : "geo_shape"
      },
      "geoprivacy" : {
        "type" : "string"
      },
      "id" : {
        "type" : "long"
      },
      "id_please" : {
        "type" : "boolean"
      },
      "identifications" : {
        "properties" : {
          "current" : {
            "type" : "boolean"
          },
          "id" : {
            "type" : "long"
          },
          "user" : {
            "properties" : {
              "id" : {
                "type" : "long"
              },
              "login" : {
                "type" : "string"
              }
            }
          }
        }
      },
      "identifications_count" : {
        "type" : "long"
      },
      "identifications_most_agree" : {
        "type" : "boolean"
      },
      "identifications_most_disagree" : {
        "type" : "boolean"
      },
      "identifications_some_agree" : {
        "type" : "boolean"
      },
      "ids" : {
        "properties" : {
          "body" : {
            "type" : "string"
          },
          "created_at" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "created_at_details" : {
            "properties" : {
              "day" : {
                "type" : "long"
              },
              "hour" : {
                "type" : "long"
              },
              "month" : {
                "type" : "long"
              },
              "week" : {
                "type" : "long"
              },
              "year" : {
                "type" : "long"
              }
            }
          },
          "id" : {
            "type" : "long"
          },
          "user" : {
            "properties" : {
              "icon_url" : {
                "type" : "string"
              },
              "id" : {
                "type" : "long"
              },
              "login" : {
                "type" : "string"
              }
            }
          }
        }
      },
      "lat" : {
        "type" : "double"
      },
      "latitude" : {
        "type" : "string"
      },
      "license_code" : {
        "type" : "string",
        "analyzer" : "keyword_analyzer"
      },
      "lng" : {
        "type" : "double"
      },
      "location" : {
        "type" : "geo_point",
        "lat_lon" : true,
        "geohash" : true,
        "geohash_precision" : 10
      },
      "longitude" : {
        "type" : "string"
      },
      "mappable" : {
        "type" : "boolean"
      },
      "non_owner_ids" : {
        "type" : "nested",
        "properties" : {
          "body" : {
            "type" : "string"
          },
          "created_at" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "created_at_details" : {
            "properties" : {
              "day" : {
                "type" : "long"
              },
              "hour" : {
                "type" : "long"
              },
              "month" : {
                "type" : "long"
              },
              "week" : {
                "type" : "long"
              },
              "year" : {
                "type" : "long"
              }
            }
          },
          "id" : {
            "type" : "long"
          },
          "user" : {
            "properties" : {
              "id" : {
                "type" : "long"
              },
              "login" : {
                "type" : "string"
              }
            }
          }
        }
      },
      "num_identification_agreements" : {
        "type" : "long"
      },
      "num_identification_disagreements" : {
        "type" : "long"
      },
      "observation_field_values" : {
        "properties" : {
          "name" : {
            "type" : "string"
          },
          "value" : {
            "type" : "string"
          }
        }
      },
      "observed_on" : {
        "type" : "date",
        "format" : "dateOptionalTime"
      },
      "observed_on_details" : {
        "properties" : {
          "day" : {
            "type" : "long"
          },
          "hour" : {
            "type" : "long"
          },
          "month" : {
            "type" : "long"
          },
          "week" : {
            "type" : "long"
          },
          "year" : {
            "type" : "long"
          }
        }
      },
      "observed_on_string" : {
        "type" : "string"
      },
      "ofvs" : {
        "type" : "nested",
        "properties" : {
          "name" : {
            "type" : "string",
            "analyzer" : "keyword_analyzer"
          },
          "value" : {
            "type" : "string",
            "analyzer" : "keyword_analyzer"
          }
        }
      },
      "others_ids" : {
        "type" : "nested",
        "properties" : {
          "body" : {
            "type" : "string"
          },
          "created_at" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "created_at_details" : {
            "properties" : {
              "day" : {
                "type" : "long"
              },
              "hour" : {
                "type" : "long"
              },
              "month" : {
                "type" : "long"
              },
              "week" : {
                "type" : "long"
              },
              "year" : {
                "type" : "long"
              }
            }
          },
          "id" : {
            "type" : "long"
          },
          "user" : {
            "properties" : {
              "icon_url" : {
                "type" : "string"
              },
              "id" : {
                "type" : "long"
              },
              "login" : {
                "type" : "string"
              }
            }
          }
        }
      },
      "out_of_range" : {
        "type" : "boolean"
      },
      "photos" : {
        "properties" : {
          "attribution" : {
            "type" : "string"
          },
          "id" : {
            "type" : "long"
          },
          "license_code" : {
            "type" : "string",
            "analyzer" : "keyword_analyzer"
          },
          "url" : {
            "type" : "string"
          }
        }
      },
      "place_guess" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "place_ids" : {
        "type" : "long"
      },
      "private_geojson" : {
        "type" : "geo_shape"
      },
      "private_location" : {
        "type" : "geo_point",
        "lat_lon" : true
      },
      "project_ids" : {
        "type" : "long"
      },
      "project_ids_with_curator_id" : {
        "type" : "long"
      },
      "project_ids_without_curator_id" : {
        "type" : "long"
      },
      "quality_grade" : {
        "type" : "string"
      },
      "reviewed_by" : {
        "type" : "long"
      },
      "site_id" : {
        "type" : "long"
      },
      "sounds" : {
        "properties" : {
          "attribution" : {
            "type" : "string"
          },
          "id" : {
            "type" : "long"
          },
          "license_code" : {
            "type" : "string",
            "analyzer" : "keyword_analyzer"
          },
          "native_sound_id" : {
            "type" : "string"
          }
        }
      },
      "species_guess" : {
        "type" : "string",
        "analyzer" : "keyword_analyzer"
      },
      "tags" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "taxon" : {
        "properties" : {
          "ancestor_ids" : {
            "type" : "long"
          },
          "ancestors" : {
            "type" : "string"
          },
          "ancestry" : {
            "type" : "string"
          },
          "conservation_statuses" : {
            "properties" : {
              "authority" : {
                "type" : "string"
              },
              "geoprivacy" : {
                "type" : "string"
              },
              "iucn" : {
                "type" : "long"
              },
              "place_id" : {
                "type" : "long"
              },
              "source_id" : {
                "type" : "long"
              },
              "status" : {
                "type" : "string"
              }
            }
          },
          "endemic" : {
            "type" : "boolean"
          },
          "iconic_taxon_id" : {
            "type" : "long"
          },
          "id" : {
            "type" : "long"
          },
          "introduced" : {
            "type" : "boolean"
          },
          "is_active" : {
            "type" : "boolean"
          },
          "name" : {
            "type" : "string"
          },
          "names" : {
            "properties" : {
              "locale" : {
                "type" : "string"
              },
              "name" : {
                "type" : "string",
                "analyzer" : "ascii_snowball_analyzer"
              },
              "place_taxon_names" : {
                "properties" : {
                  "place_id" : {
                    "type" : "long"
                  },
                  "position" : {
                    "type" : "long"
                  }
                }
              },
              "position" : {
                "type" : "long"
              }
            }
          },
          "native" : {
            "type" : "boolean"
          },
          "rank" : {
            "type" : "string"
          },
          "rank_level" : {
            "type" : "long"
          },
          "statuses" : {
            "type" : "nested",
            "properties" : {
              "authority" : {
                "type" : "string",
                "analyzer" : "keyword_analyzer"
              },
              "geoprivacy" : {
                "type" : "string"
              },
              "iucn" : {
                "type" : "long"
              },
              "place_id" : {
                "type" : "long"
              },
              "source_id" : {
                "type" : "long"
              },
              "status" : {
                "type" : "string",
                "analyzer" : "keyword_analyzer"
              }
            }
          },
          "threatened" : {
            "type" : "boolean"
          }
        }
      },
      "time_observed_at" : {
        "type" : "date",
        "format" : "dateOptionalTime"
      },
      "time_zone" : {
        "type" : "string"
      },
      "time_zone_offset" : {
        "type" : "string"
      },
      "updated_at" : {
        "type" : "date",
        "format" : "dateOptionalTime"
      },
      "uri" : {
        "type" : "string"
      },
      "user" : {
        "properties" : {
          "icon_url" : {
            "type" : "string"
          },
          "id" : {
            "type" : "long"
          },
          "login" : {
            "type" : "string"
          }
        }
      },
      "verifiable" : {
        "type" : "boolean"
      }
    }
  }
}
