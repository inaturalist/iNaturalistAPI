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
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "description_autocomplete": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer"
    },
    "id": {
      "type": "integer"
    },
    "name": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "name_autocomplete": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer"
    },
    "users_count": {
      "type": "integer"
    },
    "values_count": {
      "type": "integer"
    }
  }
}
