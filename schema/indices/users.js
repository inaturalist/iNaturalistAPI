{
  "dynamic": "true",
  "properties": {
    "activity_count": {
      "type": "integer"
    },
    "created_at": {
      "type": "date"
    },
    "icon": {
      "type": "keyword",
      "index": false
    },
    "id": {
      "type": "integer"
    },
    "identifications_count": {
      "type": "integer"
    },
    "journal_posts_count": {
      "type": "integer"
    },
    "login": {
      "type": "text",
      "analyzer": "ascii_snowball_analyzer"
    },
    "login_autocomplete": {
      "type": "text",
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer"
    },
    "login_exact": {
      "type": "keyword"
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
    "observations_count": {
      "type": "integer"
    },
    "orcid": {
      "type": "keyword"
    },
    "roles": {
      "type": "keyword"
    },
    "site_id": {
      "type": "short"
    },
    "spam": {
      "type": "boolean"
    },
    "suspended": {
      "type": "boolean"
    },
    "universal_search_rank": {
      "type": "integer"
    }
  }
}
