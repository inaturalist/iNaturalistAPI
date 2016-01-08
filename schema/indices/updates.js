{
  "update" : {
    "dynamic" : "true",
    "properties" : {
      "created_at" : {
        "type" : "date",
        "format" : "epoch_millis||dateOptionalTime"
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
      "query" : {
        "properties" : {
          "range" : {
            "properties" : {
              "id" : {
                "properties" : {
                  "lte" : {
                    "type" : "long"
                  }
                }
              }
            }
          }
        }
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
      "subscriber_id" : {
        "type" : "long"
      },
      "updated_at" : {
        "type" : "date",
        "format" : "epoch_millis||dateOptionalTime"
      },
      "viewed_at" : {
        "type" : "date",
        "format" : "epoch_millis||dateOptionalTime"
      }
    }
  }
}
