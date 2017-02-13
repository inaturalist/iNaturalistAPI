{
  "update_action" : {
    "dynamic" : "true",
    "properties" : {
      "created_at" : {
        "type" : "date",
        "format" : "strict_date_optional_time||epoch_millis"
      },
      "id" : {
        "type" : "long"
      },
      "notification" : {
        "type" : "string",
        "analyzer" : "keyword_analyzer"
      },
      "notifier" : {
        "type" : "string",
        "analyzer" : "keyword_analyzer"
      },
      "notifier_id" : {
        "type" : "long"
      },
      "notifier_type" : {
        "type" : "string"
      },
      "resource_id" : {
        "type" : "long"
      },
      "resource_owner_id" : {
        "type" : "long"
      },
      "resource_type" : {
        "type" : "string",
        "analyzer" : "keyword_analyzer"
      },
      "subscriber_ids" : {
        "type" : "long"
      },
      "viewed_subscriber_ids" : {
        "type" : "long"
      }
    }
  }
}