const _ = require( "lodash" );
const util = require( "./util" );
const User = require( "./models/user" );

const ElasticQueryBuilder = { };

ElasticQueryBuilder.buildQuery = opts => {
  const options = {
    filters: [],
    mustNot: [],
    should: [],
    ...opts
  };
  const {
    q,
    sources,
    page,
    perPage,
    req
  } = options;
  const filter = options.filters;
  const { mustNot } = options;
  const { should } = options;
  const userLanguages = [];
  if ( req.userSession && req.userSession.taxonNamePriorities ) {
    req.userSession.taxonNamePriorities.forEach( tnp => {
      if ( tnp.lexicon ) {
        userLanguages.push( tnp.lexicon );
      }
    } );
  }
  const localeOpts = util.localeOpts( req );
  if ( localeOpts.locale ) {
    userLanguages.push( localeOpts.locale.split( "-" )[0] );
  }
  const uniqueUserLanguages = _.uniq( userLanguages );

  if ( q ) {
    const isID = Number.isInteger( Number( q ) ) && Number( q ) > 0;
    // match _autocomplete fields across all indices
    should.push( {
      constant_score: {
        filter: {
          multi_match: {
            query: q,
            fields: ["*_autocomplete", "name"],
            fuzziness: "AUTO",
            prefix_length: 5,
            max_expansions: 2,
            operator: "and"
          }
        },
        boost: 1
      }
    } );
    should.push( {
      // boost exact matches across the rest of the indices Note: this
      // isn't working perfectly. For one thing it matches more than
      // exact matches, e.g. when you search for "lepidopt" you get a
      // lot of projects about Lepidoptera. It also seems to score
      // projects with multuple mentions of lepidoptera in the desc
      // higher than the taxon Lepidoptera if you boost. Boost at 1 is
      // ok, but a better solution would be to actually do exact
      // matching and score docs equally regardless of term frequency.
      constant_score: {
        filter: {
          multi_match: {
            query: q,
            fields: ["*_autocomplete", "description"],
            type: "phrase"
          }
        },
        boost: 1
      }
    } );
    if ( isID ) {
      should.push( {
        constant_score: {
          filter: {
            term: { id: Number( q ) }
          },
          boost: 3
        }
      } );
    }

    if ( !sources || _.includes( sources, "taxa" ) ) {
      // multi-token matches, e.g. if you search "foo bar" that should match "foo barness"
      should.push( {
        constant_score: {
          filter: {
            nested: {
              path: "names",
              ignore_unmapped: true,
              query: {
                match: {
                  "names.name_autocomplete": {
                    fuzziness: "AUTO",
                    prefix_length: 5,
                    query: q,
                    operator: "and"
                  }
                }
              }
            }
          },
          boost: 2
        }
      } );
      // Exact prefix matches
      should.push( {
        constant_score: {
          filter: {
            nested: {
              path: "names",
              ignore_unmapped: true,
              query: {
                match: {
                  "names.exact_ci": {
                    query: q
                  }
                }
              }
            }
          },
          boost: 3
        }
      } );
      // extra boosting for exact prefixes of scientific names
      should.push( {
        constant_score: {
          filter: {
            nested: {
              path: "names",
              ignore_unmapped: true,
              query: {
                bool: {
                  must: [
                    {
                      prefix: {
                        "names.exact_ci": {
                          value: q.toLowerCase( )
                        }
                      }
                    },
                    {
                      term: {
                        "names.locale": "sci"
                      }
                    }
                  ]
                }
              }
            }
          },
          boost: 2
        }
      } );
      uniqueUserLanguages.forEach( localeLang => {
        should.push( {
          // Constant score allows us to boost name and locale matches higher than
          // place-specific matches. Without this we end up with queries like "bi"
          // matching names like "birds-foot trefoil" that have been added to a
          // place higher than names like "birds"
          constant_score: {
            filter: {
              // Within the should, though, we want a higher score if the taxon has a
              // name in the locale AND that name matches the query, hence the must
              nested: {
                path: "names",
                ignore_unmapped: true,
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "names.name_autocomplete": {
                            query: q,
                            operator: "and"
                          }
                        }
                      },
                      {
                        term: {
                          "names.locale": localeLang
                        }
                      }
                    ]
                  }
                }
              }
            },
            boost: 1
          }
        } );
        // ...and we need to add another boost for locale-specific prefix matches
        should.push( {
          constant_score: {
            filter: {
              nested: {
                path: "names",
                ignore_unmapped: true,
                query: {
                  bool: {
                    must: [
                      {
                        prefix: {
                          "names.exact_ci": {
                            value: q
                          }
                        }
                      },
                      {
                        term: {
                          "names.locale": localeLang
                        }
                      }
                    ]
                  }
                }
              }
            },
            boost: 2
          }
        } );
      } );
      if ( localeOpts.preferredPlace ) {
        const placeIDs = localeOpts.preferredPlace.ancestor_place_ids
          || [localeOpts.preferredPlace.id];
        should.push( {
          constant_score: {
            filter: {
              // Within the should, though, we want a higher score if the taxon has a
              // name in the locale AND that name matches the query, hence the must
              nested: {
                path: "names",
                ignore_unmapped: true,
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          "names.name_autocomplete": {
                            query: q,
                            operator: "and"
                          }
                        }
                      },
                      {
                        terms: {
                          "names.place_taxon_names.place_id": placeIDs
                        }
                      }
                    ]
                  }
                }
              }
            },
            boost: 1.5
          }
        } );
      }
    }
    if ( !sources || _.includes( sources, "users" ) ) {
      // boost exact matches in the users index
      should.push( {
        constant_score: {
          filter: {
            bool: {
              should: [
                {
                  match: {
                    login_exact: {
                      query: q
                    }
                  }
                },
                {
                  match: {
                    orcid: {
                      query: q
                    }
                  }
                }
              ]
            }
          },
          boost: 3
        }
      } );
    }
  }
  // Add the shoulds to the filter. Without this, the shoulds will operate only
  // in the query context and won't filter out non-matching documents, e.g. if
  // you search for "moth" you'll get back documents that do not contain the
  // word moth, and if they get a higher score due to higher obs count, they can
  // appear above more relevant matches
  filter.push( {
    bool: {
      should
    }
  } );

  const body = {
    from: ( perPage * page ) - perPage,
    size: perPage,
    query: {
      bool: {
        filter,
        must_not: mustNot,
        should
      }
    }
  };

  if ( options.useFunctionScore ) {
    const functionScore = {
      query: body.query,
      boost_mode: "sum"
    };
    if ( options.functionScoreFieldValueFactor ) {
      functionScore.field_value_factor = options.functionScoreFieldValueFactor;
    } else {
      functionScore.field_value_factor = {
        field: "universal_search_rank",
        factor: 1,
        missing: 3,
        modifier: "log2p"
      };
    }
    body.query = { function_score: functionScore };
  }
  if ( options.sort ) {
    body.sort = options.sort;
  }

  if ( options.source ) {
    body._source = options.source;
  } else {
    body._source = { excludes: User.elasticExcludeFields };
  }

  if ( options.highlight ) {
    const { highlight } = options;
    if ( util.isJa( q ) ) {
      highlight.fields["names.name_ja"] = { };
    }
    body.highlight = highlight;
  }
  return body;
};

module.exports = ElasticQueryBuilder;
