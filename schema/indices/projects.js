{
  "project": {
    "dynamic": "true",
    "properties": {
      "ancestor_place_ids": {
        "type": "long"
      },
      "description": {
        "type": "string",
        "analyzer": "ascii_snowball_analyzer"
      },
      "geojson": {
        "type": "geo_shape"
      },
      "id": {
        "type": "long"
      },
      "location": {
        "type": "geo_point"
      },
      "place_ids": {
        "type": "long"
      },
      "project_observation_rules" : {
        "properties" : {
          "id" : {
            "type" : "long"
          },
          "operand_id" : {
            "type" : "long"
          },
          "operand_type" : {
            "type" : "keyword"
          },
          "operator" : {
            "type" : "keyword"
          }
        }
      },
      "project_type" : {
        "type" : "keyword"
      },
      "search_parameters" : {
        "type" : "nested",
        "properties" : {
          "field" : {
            "type" : "keyword"
          },
          "value" : {
            "type" : "text"
          },
          "value_boolean" : {
            "type" : "boolean"
          },
          "value_date" : {
            "type" : "date",
            "format" : "dateOptionalTime"
          },
          "value_number" : {
            "type" : "long"
          }
        }
      },
      "slug": {
        "type": "string",
        "analyzer": "keyword_analyzer"
      },
      "title": {
        "type": "string",
        "analyzer": "ascii_snowball_analyzer"
      },
      "title_exact": {
        "type": "keyword"
      },
      "title_autocomplete": {
        "type": "string",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "standard_analyzer"
      }
    }
  }
}
