{
  "user" : {
    "dynamic" : "true",
    "properties" : {
      "activity_count" : {
        "type" : "long"
      },
      "icon" : {
        "type" : "string"
      },
      "id" : {
        "type" : "long"
      },
      "identifications_count" : {
        "type" : "long"
      },
      "journal_posts_count" : {
        "type" : "long"
      },
      "login" : {
        "type" : "string",
        "analyzer" : "ascii_snowball_analyzer"
      },
      "login_autocomplete" : {
        "type" : "string",
        "analyzer" : "autocomplete_analyzer",
        "search_analyzer" : "standard_analyzer"
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
      "observations_count" : {
        "type" : "long"
      }
    }
  }
}
