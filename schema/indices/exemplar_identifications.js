{
  "dynamic": "false",
  "properties": {
    "active": {
      "type": "boolean"
    },
    "cached_votes_total": {
      "type": "short"
    },
    "created_at": {
      "type": "date"
    },
    "id": {
      "type": "integer",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    },
    "identification": {
      "properties": {
        "body": {
          "type": "text",
          "analyzer": "ascii_snowball_analyzer"
        },
        "body_character_length": {
          "type": "integer"
        },
        "body_word_length": {
          "type": "integer"
        },
        "created_at": {
          "type": "date"
        },
        "id": {
          "type": "integer",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          }
        },
        "observation": {
          "properties": {
            "annotations": {
              "type": "nested",
              "properties": {
                "concatenated_attr_val": {
                  "type": "keyword"
                },
                "controlled_attribute_id": {
                  "type": "short",
                  "fields": {
                    "keyword": {
                      "type": "keyword"
                    }
                  }
                },
                "controlled_value_id": {
                  "type": "short",
                  "fields": {
                    "keyword": {
                      "type": "keyword"
                    }
                  }
                },
                "uuid": {
                  "type": "keyword"
                }
              }
            },
            "discussion_count": {
              "type": "short"
            },
            "id": {
              "type": "integer"
            },
            "taxon": {
              "properties": {
                "ancestor_ids": {
                  "type": "integer",
                  "fields": {
                    "keyword": {
                      "type": "keyword"
                    }
                  }
                },
                "id": {
                  "type": "integer",
                  "fields": {
                    "keyword": {
                      "type": "keyword"
                    }
                  }
                }
              }
            }
          }
        },
        "taxon": {
          "properties": {
            "ancestor_ids": {
              "type": "integer",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            },
            "id": {
              "type": "integer",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "user": {
          "properties": {
            "id": {
              "type": "integer",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "uuid": {
          "type": "keyword"
        }
      }
    },
    "nominated_at": {
      "type": "date"
    },
    "nominated_by_user_id": {
      "type": "integer",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
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
        }
      }
    }
  }
}
