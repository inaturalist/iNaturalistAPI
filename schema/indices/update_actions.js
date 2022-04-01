{
  "dynamic": "true",
  "properties": {
    "created_at": {
      "type": "date"
    },
    "id": {
      "type": "integer"
    },
    "notification": {
      "type": "keyword"
    },
    "notifier": {
      "type": "keyword"
    },
    "notifier_id": {
      "type": "keyword"
    },
    "notifier_type": {
      "type": "keyword"
    },
    "resource_id": {
      "type": "keyword"
    },
    "resource_owner_id": {
      "type": "keyword"
    },
    "resource_type": {
      "type": "keyword"
    },
    "subscriber_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "viewed_subscriber_ids": {
      "type": "keyword"
    }
  }
}