{
  "dynamic": "false",
  "properties": {
    "ancestor_ids": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "embedding": {
      "dims": 2048,
      "index": true,
      "index_options": {
        "confidence_interval": 0,
        "ef_construction": 100,
        "m": 16,
        "type": "int4_hnsw"
      },
      "similarity": "cosine",
      "type": "dense_vector"
    },
    "id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "photo_file_updated_at": {
      "type": "date"
    },
    "photo_id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    },
    "taxon_id": {
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      },
      "type": "integer"
    }
  }
}
