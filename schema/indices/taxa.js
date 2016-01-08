{
  "taxon" : {
    "dynamic" : "true",
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
      "colors" : {
        "properties" : {
          "id" : {
            "type" : "long"
          },
          "value" : {
            "type" : "string"
          }
        }
      },
      "created_at" : {
        "type" : "date",
        "format" : "epoch_millis||dateOptionalTime"
      },
      "default_photo" : {
        "properties" : {
          "attribution" : {
            "type" : "string"
          },
          "id" : {
            "type" : "long"
          },
          "license_code" : {
            "type" : "string"
          },
          "medium_url" : {
            "type" : "string"
          },
          "square_url" : {
            "type" : "string"
          },
          "url" : {
            "type" : "string"
          }
        }
      },
      "default_photo_url" : {
        "type" : "string"
      },
      "iconic_taxon_id" : {
        "type" : "long"
      },
      "id" : {
        "type" : "long"
      },
      "is_active" : {
        "type" : "boolean"
      },
      "listed_taxa" : {
        "properties" : {
          "establishment_means" : {
            "type" : "string"
          },
          "occurrence_status_level" : {
            "type" : "long"
          },
          "place_id" : {
            "type" : "long"
          },
          "user_id" : {
            "type" : "long"
          }
        }
      },
      "name" : {
        "type" : "string"
      },
      "names" : {
        "properties" : {
          "exact" : {
            "type" : "string",
            "analyzer" : "keyword_analyzer"
          },
          "is_valid" : {
            "type" : "boolean"
          },
          "locale" : {
            "type" : "string"
          },
          "name" : {
            "type" : "string",
            "analyzer" : "ascii_snowball_analyzer"
          },
          "name_autocomplete" : {
            "type" : "string",
            "analyzer" : "autocomplete_analyzer",
            "search_analyzer" : "standard_analyzer"
          },
          "name_autocomplete_ja" : {
            "type" : "string",
            "analyzer" : "autocomplete_analyzer_ja"
          },
          "name_ja" : {
            "type" : "string",
            "analyzer" : "kuromoji"
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
      "observations_count" : {
        "type" : "long"
      },
      "place_ids" : {
        "type" : "long"
      },
      "rank" : {
        "type" : "string"
      },
      "rank_level" : {
        "type" : "long"
      },
      "statuses" : {
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
      }
    }
  }
}
