{
  "index" : {
    "analysis" : {
      "filter" : {
        "edge_ngram_filter" : {
          "type" : "edge_ngram",
          "min_gram" : "2",
          "max_gram" : "15"
        }
      },
      "analyzer" : {
        "keyword_analyzer" : {
          "filter" : [ "lowercase", "asciifolding" ],
          "tokenizer" : "keyword"
        },
        "ascii_snowball_analyzer" : {
          "filter" : [ "lowercase", "asciifolding", "stop", "snowball" ],
          "tokenizer" : "standard"
        },
        "standard_analyzer" : {
          "filter" : [ "lowercase", "asciifolding" ],
          "tokenizer" : "standard"
        },
        "autocomplete_analyzer" : {
          "filter" : [ "lowercase", "asciifolding", "edge_ngram_filter" ],
          "tokenizer" : "standard"
        },
        "autocomplete_analyzer_ja" : {
          "filter" : [ "cjk_width", "kuromoji_readingform" ],
          "tokenizer" : "kuromoji_tokenizer"
        },
        "keyword_autocomplete_analyzer" : {
          "filter" : [ "lowercase", "asciifolding", "stop", "edge_ngram_filter" ],
          "tokenizer" : "keyword"
        }
      }
    }
  }
}
