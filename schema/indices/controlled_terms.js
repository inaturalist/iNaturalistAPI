{
  "dynamic": "true",
  "properties": {
    "blocking": {
      "type": "boolean"
    },
    "excepted_taxon_ids": {
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
    "is_value": {
      "type": "boolean"
    },
    "labels": {
      "properties": {
        "definition": {
          "analyzer": "ascii_snowball_analyzer",
          "type": "text"
        },
        "id": {
          "type": "integer"
        },
        "label": {
          "analyzer": "ascii_snowball_analyzer",
          "type": "text"
        },
        "locale": {
          "type": "keyword"
        },
        "valid_within_clade": {
          "type": "integer"
        }
      }
    },
    "multivalues": {
      "type": "boolean"
    },
    "ontology_uri": {
      "index": false,
      "type": "keyword"
    },
    "taxon_ids": {
      "type": "keyword"
    },
    "uri": {
      "index": false,
      "type": "keyword"
    },
    "uuid": {
      "type": "keyword"
    },
    "values": {
      "properties": {
        "blocking": {
          "type": "boolean"
        },
        "excepted_taxon_ids": {
          "type": "integer"
        },
        "id": {
          "type": "integer"
        },
        "labels": {
          "properties": {
            "definition": {
              "analyzer": "ascii_snowball_analyzer",
              "type": "text"
            },
            "id": {
              "type": "integer"
            },
            "label": {
              "analyzer": "ascii_snowball_analyzer",
              "type": "text"
            },
            "locale": {
              "type": "keyword"
            },
            "valid_within_clade": {
              "type": "integer"
            }
          }
        },
        "ontology_uri": {
          "index": false,
          "type": "keyword"
        },
        "taxon_ids": {
          "type": "keyword"
        },
        "uri": {
          "index": false,
          "type": "keyword"
        },
        "uuid": {
          "type": "keyword"
        }
      }
    }
  }
}