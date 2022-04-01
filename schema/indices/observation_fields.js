{
  "dynamic": "true",
  "properties": {
    "allowed_values": {
      "type": "keyword"
    },
    "datatype": {
      "type": "keyword"
    },
    "description": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "description_autocomplete": {
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer",
      "type": "text"
    },
    "id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "name": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "name_autocomplete": {
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer",
      "type": "text"
    },
    "users_count": {
      "type": "integer"
    },
    "values_count": {
      "type": "integer"
    }
  }
}