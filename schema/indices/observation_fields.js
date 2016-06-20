{
  "observation_field" : {
    "dynamic" : "true",
    "properties" : {
      "allowed_values" : {
        "type" : "string"
      },
      "datatype" : {
        "type" : "string"
      },
      "description" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "description_autocomplete" : {
        "type" : "string",
        "analyzer" : "autocomplete_analyzer",
        "search_analyzer" : "standard_analyzer"
      },
      "id" : {
        "type" : "long"
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
      "users_count" : {
        "type" : "long"
      },
      "values_count" : {
        "type" : "long"
      }
    }
  }
}
