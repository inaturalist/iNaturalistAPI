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
      "type": "integer"
    },
    "is_value": {
      "type": "boolean"
    },
    "labels": {
      "properties": {
        "definition": {
          "type": "text",
          "analyzer": "ascii_snowball_analyzer"
        },
        "id": {
          "type": "integer"
        },
        "label": {
          "type": "text",
          "analyzer": "ascii_snowball_analyzer"
        },
        "locale": {
          "type": "keyword"
        },
        "valid_within_clade": {
          "type": "integer"
        }
      }
    },
    "multivalued": {
      "type": "boolean"
    },
    "multivalues": {
      "type": "boolean"
    },
    "ontology_uri": {
      "type": "keyword",
      "index": false
    },
    "taxon_ids": {
      "type": "integer"
    },
    "uri": {
      "type": "keyword",
      "index": false
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
              "type": "text",
              "analyzer": "ascii_snowball_analyzer"
            },
            "id": {
              "type": "integer"
            },
            "label": {
              "type": "text",
              "analyzer": "ascii_snowball_analyzer"
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
          "type": "keyword",
          "index": false
        },
        "taxon_ids": {
          "type": "integer"
        },
        "uri": {
          "type": "keyword",
          "index": false
        },
        "uuid": {
          "type": "keyword"
        }
      }
    }
  }
}
