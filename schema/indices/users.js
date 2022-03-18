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
      "index": false,
      "type": "keyword"
    },
    "id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "identifications_count": {
      "type": "integer"
    },
    "journal_posts_count": {
      "type": "integer"
    },
    "login": {
      "analyzer": "ascii_snowball_analyzer",
      "type": "text"
    },
    "login_autocomplete": {
      "analyzer": "autocomplete_analyzer",
      "search_analyzer": "standard_analyzer",
      "type": "text"
    },
    "login_exact": {
      "type": "keyword"
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
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "short"
    },
    "spam": {
      "type": "boolean"
    },
    "species_count": {
      "type": "integer"
    },
    "suspended": {
      "type": "boolean"
    },
    "universal_search_rank": {
      "type": "integer"
    },
    "uuid": {
      "type": "keyword"
    }
  }
}