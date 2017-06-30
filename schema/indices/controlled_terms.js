{
  "controlled_term": {
    "dynamic": "true",
    "properties": {
      "id": {
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
            "type": "long"
          },
          "label": {
            "analyzer": "ascii_snowball_analyzer",
            "type": "text"
          },
          "locale": {
            "type": "keyword"
          },
          "valid_within_clade": {
            "type": "long"
          }
        }
      },
      "multivalued": {
        "type": "boolean"
      },
      "ontology_uri": {
        "index": false,
        "type": "keyword"
      },
      "uri": {
        "index": false,
        "type": "keyword"
      },
      "uuid": {
        "type": "keyword"
      },
      "valid_within_clade": {
        "type": "long"
      },
      "values": {
        "properties": {
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
                "type": "long"
              },
              "label": {
                "analyzer": "ascii_snowball_analyzer",
                "type": "text"
              },
              "locale": {
                "type": "keyword"
              },
              "valid_within_clade": {
                "type": "long"
              }
            }
          },
          "ontology_uri": {
            "index": false,
            "type": "keyword"
          },
          "uri": {
            "index": false,
            "type": "keyword"
          },
          "uuid": {
            "type": "keyword"
          },
          "valid_within_clade": {
            "type": "long"
          }
        }
      }
    }
  }
}