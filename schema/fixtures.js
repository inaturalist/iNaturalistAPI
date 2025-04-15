{
  "elasticsearch": {
    "controlled_terms": {
      "controlled_term": [
        {
          "id": 1,
          "uri": "uri",
          "is_value": "false",
          "values": [ ],
          "labels": [
            {
              "id": 1,
              "locale": "en",
              "label": "The BEST Term"
            }
          ]
        },
        {
          "id": 2,
          "uri": "uri",
          "is_value": "false",
          "values": [ ],
          "labels": [
            {
              "id": 2,
              "locale": "en",
              "label": "The WORST Term"
            }
          ]
        },
        {
          "id": 3,
          "uri": "uri",
          "is_value": "false",
          "taxon_ids": [2],
          "values": [
            {
              "id": 4,
              "uri": "uri",
              "labels": [
                {
                  "id": 4,
                  "locale": "en",
                  "label": "Value 4"
                }
              ]
            },
            {
              "id": 5,
              "uri": "uri",
              "labels": [
                {
                  "id": 5,
                  "locale": "en",
                  "label": "Value 5"
                }
              ]
            }
          ],
          "labels": [
            {
              "id": 3,
              "locale": "en",
              "label": "Term with values"
            }
          ]
        },
        {
          "id": 4,
          "uri": "uri",
          "is_value": "true",
          "labels": [
            {
              "id": 4,
              "locale": "en",
              "label": "Value 4"
            }
          ]
        },
        {
          "id": 5,
          "uri": "uri",
          "is_value": "true",
          "labels": [
            {
              "id": 5,
              "locale": "en",
              "label": "Value 5"
            }
          ]
        }
      ]
    },
    "places": {
      "place": [
        {
          "id": 1,
          "uuid": "48fba6f4-8627-411b-bf38-af9e280e5cfc",
          "name": "United States",
          "slug": "united-states",
          "display_name_autocomplete": "United States",
          "location": "48.8907012939,-116.9820022583",
          "admin_level": 0,
          "bbox_area": 5500,
          "geometry_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -125, 50 ], [ -65, 50 ], [ -65, 25 ], [ -125, 25 ], [ -125, 50 ]
            ]]
          },
          "bounding_box_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -125, 50 ], [ -65, 50 ], [ -65, 25 ], [ -125, 25 ], [ -125, 50 ]
            ]]
          }
        },
        {
          "id": 2,
          "uuid": "3fc3929f-08c4-443d-9dda-52ee7609c0a5",
          "name": "Massachusetts",
          "slug": "massachusetts",
          "display_name_autocomplete": "Massachusetts",
          "location": "42.0368995667,-71.6835021973",
          "admin_level": 10,
          "bbox_area": 6,
          "geometry_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 41.5 ], [ -73.5, 42.75 ]
            ]]
          },
          "bounding_box_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 42.75 ]
            ]]
          }
        },
        {
          "id": 3,
          "uuid": "a0fc3188-85f1-4684-8855-f84e248d4b5a",
          "name": "Community",
          "slug": "community",
          "display_name_autocomplete": "Community",
          "admin_level": null,
          "bbox_area": 6,
          "geometry_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 41.5 ], [ -73.5, 42.75 ]
            ]]
          },
          "bounding_box_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 41.5 ], [ -73.5, 42.75 ]
            ]]
          }
        },
        {
          "id": 4,
          "uuid": "30d4d2a1-0fe1-46e9-a4ca-ca06afcd1048",
          "name": "Search Test Place",
          "display_name_autocomplete": "search test place",
          "admin_level": null,
          "bbox_area": 6,
          "geometry_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 41.5 ], [ -73.5, 42.75 ]
            ]]
          },
          "bounding_box_geojson": {
            "type": "Polygon",
            "coordinates": [[
              [ -73.5, 42.75 ], [ -70, 42.75 ], [ -70, 41.5 ], [ -73.5, 41.5 ], [ -73.5, 42.75 ]
            ]]
          }
        },
        {
          "id": 123,
          "uuid": "21b9dc61-b1f6-46be-84ca-75c899cdb57c",
          "name": "itsname",
          "slug": "itsname"
        },
        {
          "id": 432,
          "uuid": "06c869b1-e145-4ae9-a383-81aacdddcad0",
          "name": "a-place",
          "slug": "a-place",
          "display_name_autocomplete": "a-place"
        },
        {
          "id": 433,
          "name": "a-place-in-a-place",
          "display_name_autocomplete": "A Place In A Place",
          "ancestor_place_ids": [432, 433]
        },
        {
          "id": 696,
          "uuid": "06c859b1-e145-3ae9-a283-81aaadddcad0",
          "name": "La-Coruna-,-España",
          "display_name_autocomplete": "La Coruña, España"
        },
        {
          "id": 2020120501,
          "uuid": "9dc9c5a9-41b4-4a45-9a20-41c4a0be2ae8",
          "name": "Alameda County",
          "slug": "alameda-county",
          "display_name_autocomplete": "Alameda County",
          "location": "37.6505468421,-121.9178854495",
          "admin_level": 20,
          "bbox_area": 0.408537282384,
          "geometry_geojson": {
            "type": "MultiPolygon",
            "coordinates": [
              [
                [
                  [-122.28088,37.70723],
                  [-122.373782,37.883725],
                  [-122.264027,37.903775],
                  [-122.217376,37.871724],
                  [-122.185977,37.820726],
                  [-122.045473,37.798126],
                  [-121.997771,37.763227],
                  [-122.011771,37.747428],
                  [-121.96077,37.718629],
                  [-121.55916,37.818927],
                  [-121.556655,37.542732],
                  [-121.501475,37.525003],
                  [-121.469275,37.489093],
                  [-121.865267,37.484637],
                  [-121.925041,37.454186],
                  [-121.944914,37.469163],
                  [-122.051244,37.459007],
                  [-122.109574,37.497637],
                  [-122.28088,37.70723]
                ]
              ]
            ]
          },
          "bounding_box_geojson": {
            "type": "Polygon",
            "coordinates": [
              [
                [-122.373782,37.454186],
                [-122.373782,37.905824],
                [-121.469214,37.905824],
                [-121.469214,37.454186],
                [-122.373782,37.454186]
              ]
            ]
          }
        }
      ]
    },
    "identifications": {
      "identification": [
        {
          "id": 102,
          "uuid": "a74986ff-ebcb-4646-bc6e-f26d191df10b",
          "user": {
            "id": 123
           },
          "body": "id1",
          "category": "leading",
          "current": true,
          "current_taxon": true,
          "taxon": {
            "id": 5,
            "uuid": "e6c0f90f-8527-4b56-a552-fe2273b61ec4",
            "min_species_taxon_id": 5,
            "is_active": true,
            "iconic_taxon_id": 1,
            "ancestor_ids": [1,2,3,4,5],
            "min_species_ancestry": "1,2,3,4,5",
            "rank_level": 10,
             "min_species_ancestors": [
              { "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }, { "id": 5 }
            ]
         },
          "observation": {
            "id": 1,
            "user_id": 123,
            "taxon": {
              "id": 5,
              "iconic_taxon_id": 1,
              "ancestor_ids": [1,2,3,4,5],
              "min_species_taxon_id": 5,
              "min_species_ancestry": "1,2,3,4,5",
              "rank_level": 10
            }
          }
        },
        {
          "id": 103,
          "uuid": "928f56be-4c01-459c-ae3a-804dfc8407f1",
          "user": {
            "id": 5
           },
          "body": "id2",
          "category": "maverick",
          "current": true,
          "current_taxon": false,
          "taxon": {
            "id": 5,
            "uuid": "df5717a6-4690-4240-8411-a18e447db81c",
            "min_species_taxon_id": 5,
            "iconic_taxon_id": 101,
            "ancestor_ids": [1,2,3,4,5],
            "min_species_ancestry": "1,2,3,4,5",
            "rank_level": 10,
            "rank": "species",
            "is_active": true,
            "min_species_ancestors": [
              { "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }, { "id": 5 }
            ]
          },
          "observation": {
            "id": 1,
            "user_id": 5,
            "taxon": {
              "id": 6,
              "iconic_taxon_id": 101,
              "ancestor_ids": [1,2,3,4,6],
              "min_species_taxon_id": 6,
              "min_species_ancestry": "1,2,3,4,6",
              "rank_level": 10,
              "rank": "species",
              "is_active": true
            }
          }
        },
        {
          "id": 104,
          "user": {
            "id": 1
          },
          "current": true,
          "taxon_change": {
            "id": 1,
            "type": "TaxonSwap"
          },
          "taxon": {
            "id": 10002,
            "ancestor_ids": [10002]
          }
        },
        {
          "id": 105,
          "uuid": "9ea80970-afe8-4575-bd61-e9395c768b85",
          "user": {
            "id": 1234
           },
          "body": "id1",
          "category": "leading",
          "current": true,
          "current_taxon": true,
          "taxon": {
            "id": 5,
            "uuid": "1b945e4b-c9f4-4fd2-a149-36e05d338c80",
            "min_species_taxon_id": 5,
            "is_active": true,
            "iconic_taxon_id": 1,
            "ancestor_ids": [1,2,3,4,5],
            "min_species_ancestry": "1,2,3,4,5",
            "rank_level": 10,
            "rank": "species",
             "min_species_ancestors": [
              { "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }, { "id": 5 }
            ]
          },
          "observation": {
            "id": 1,
            "user_id": 1234,
            "quality_grade": "casual",
            "captive": true,
            "taxon": {
              "id": 5,
              "iconic_taxon_id": 1,
              "ancestor_ids": [1,2,3,4,5],
              "min_species_taxon_id": 5,
              "min_species_ancestry": "1,2,3,4,5",
              "rank_level": 10,
              "rank": "species"
            }
          }
        },
        {
          "id": 121,
          "uuid": "6351abcb-8ed4-4b7d-84ff-066ece491338",
          "current": true,
          "observation": {
            "id": 12,
            "user_id": 5
          },
          "user": {
            "id": 121,
            "login": "user121"
          }
        },
        {
          "id": 122,
          "current": true,
          "observation": {
            "id": 12,
            "user_id": 5
          },
          "user": {
            "id": 122,
            "login": "user122"
          }
        },
        {
          "id": 123,
          "current": true,
          "observation": {
            "id": 13,
            "user_id": 5
          },
          "user": {
            "id": 121,
            "login": "user122"
          }
        },
        {
          "id": 124,
          "current": true,
          "created_at": "2015-12-31T00:00:00",
          "category": "leading",
          "observation": {
            "id": 13,
            "user_id": 5
          },
          "user": {
            "id": 121,
            "login": "user122"
          }
        },
        {
          "id": 125,
          "current": true,
          "created_at": "2016-12-31T00:00:00",
          "category": "leading",
          "observation": {
            "id": 13,
            "user_id": 5
          },
          "user": {
            "id": 122,
            "login": "user122"
          }
        },
        {
          "id": 2023092501,
          "uuid": "09130216-6201-11ee-8c99-0242ac120002",
          "user": {
            "id": 2023092501,
            "login": "user2023092501",
            "spam" : false,
            "suspended" : false
           },
          "body": "2023092501",
          "category": "leading",
          "current": true,
          "current_taxon": true,
          "taxon": {
            "id": 5,
            "uuid": "e6c0f90f-8527-4b56-a552-fe2273b61ec4",
            "min_species_taxon_id": 5,
            "is_active": true,
            "iconic_taxon_id": 1,
            "ancestor_ids": [1,2,3,4,5],
            "min_species_ancestry": "1,2,3,4,5",
            "rank_level": 10,
             "min_species_ancestors": [
              { "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }, { "id": 5 }
            ]
         },
          "observation": {
            "id": 2023092501,
            "user_id": 2023092501,
            "taxon": {
              "id": 5,
              "iconic_taxon_id": 1,
              "ancestor_ids": [1,2,3,4,5],
              "min_species_taxon_id": 5,
              "min_species_ancestry": "1,2,3,4,5",
              "rank_level": 10
            }
          }
        }
      ]
    },
    "observation_fields": {
      "observation_field": [
        {
          "id": 1,
          "name": "fieldname",
          "name_autocomplete": "fieldnameautocomplete"
        }
      ]
    },
    "observations": {
      "observation": [
        {
          "id": 1,
          "uuid": "cabbd853-39c0-429c-86f1-b36063d3d475",
          "user": {
            "id": 123,
            "login": "a-user",
            "name": "A User"
          },
          "created_at": "2015-12-31T00:00:00",
          "quality_grade": "research",
          "oauth_application_id": 3,
          "identification_categories": ["leading"],
          "ident_taxon_ids": [5,6],
          "ofvs": [ {
            "name_ci": "Habitat",
            "value_ci": "marine"
          } ],
          "private_location": "1,2",
          "license_code": "cc-by",
          "taxon": {
            "id": 5,
            "uuid": "cabbd853-39c0-429c-86f1-b36063d3d475",
            "iconic_taxon_id": 1,
            "ancestor_ids": [1,2,3,4,5],
            "min_species_taxon_id": 5,
            "min_species_ancestry": "1,2,3,4,5",
            "rank_level": 10
          },
          "project_ids": [ 543, 2024072601 ],
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] }
        },
        {
          "id": 2,
          "uuid": "9a4046ff-2005-4c8c-8127-48ef2c8e3ab9",
          "user": { "id": 5 },
          "created_at": "2016-01-01T01:00:00",
          "location": "2,3",
          "taxon": {
            "id": 4,
            "ancestor_ids": [1,2,3,4],
            "min_species_taxon_id": 4,
            "min_species_ancestry": "1,2,3,4"
          },
          "identifications":[{ "user": { "id": 123 }, "own_observation": false }],
          "place_guess": "Montana",
          "private_geojson": { "type": "Point", "coordinates": [ 3, 2 ] }
        },
        {
          "id": 333,
          "uuid": "5e26217c-5a88-421b-81fc-0ce4f07f634a",
          "user": { "id": 333 },
          "created_at": "2010-01-01T02:00:00",
          "private_location": "1,2",
          "geoprivacy": "obscured",
          "place_guess": "Idaho"
        },
        {
          "id": 4,
          "uuid": "e29e68ca-0ecf-4c6b-8fd5-71a28603fb5d",
          "user": { "id": 333 },
          "created_at": "1500-01-01T05:00:00",
          "observed_on": "1500-01-01T05:00:00",
          "taxon": {
            "id": 123,
            "iconic_taxon_id": 1,
            "ancestor_ids": [11,22,33,123],
            "min_species_taxon_id": 123,
            "min_species_ancestry": "11,22,33,123",
            "rank_level": 10
          },
          "sounds": [
            {
              "id": 1,
              "license_code": "CC-BY",
              "attribution": "Slartibartfast",
              "native_sound_id": 123
            }
          ],
          "sounds_count": 1
        },
        {
          "id": 5,
          "uuid": "e60d4116-f327-4ce1-bd46-27048fdc68a0",
          "user": { "id": 333 },
          "taxon": {
            "id": 123,
            "iconic_taxon_id": 1,
            "ancestor_ids": [11,22,33,123],
            "min_species_taxon_id": 123,
            "min_species_ancestry": "11,22,33,123",
            "rank_level": 10
          },
          "location": "50,50",
          "private_location": "3,4",
          "private_geojson": { "type": "Point", "coordinates": [ 4, 3 ] },
          "place_guess": "Tangerina",
          "captive": true
        },
        {
          "id": 6,
          "uuid": "e1aabcda-0d06-4454-8959-9b000e555610",
          "user": { "id": 333 },
          "geoprivacy": "private",
          "private_location": "1.234,1.234",
          "private_geojson": { "type": "Point", "coordinates": [ 1.234, 1.234 ] }
        },
        {
          "id": 7,
          "uuid": "f88b97cf-6515-4f5b-9a94-5f484167e4a9",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "annotations": [
            {
              "id": 1,
              "uuid": "fe79f455-171c-4a60-90bd-a9b772856b60",
              "controlled_attribute_id": 1,
              "controlled_value_id": 1,
              "concatenated_attr_val": "1|1",
              "vote_score_short": 1,
              "user_id": 5,
              "votes": []
            }
          ]
        },
        {
          "id": 8,
          "uuid": "02ad4be1-9f21-41a9-82d3-444d6c1078da",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "annotations": [
            {
              "id": 2,
              "uuid": "1e203fa7-5239-4df4-a562-ffff21628cf2",
              "controlled_attribute_id": 1,
              "controlled_value_id": 2,
              "concatenated_attr_val": "1|2",
              "vote_score_short": 1,
              "user_id": 5,
              "votes": []
            }
          ]
        },
        {
          "id": 9,
          "uuid": "dc223c38-8389-44cc-8d22-8a0e77a67cbf",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "annotations": [
            {
              "id": 3,
              "uuid": "a4e0d1f7-3463-4754-b3b5-0920216a9514",
              "controlled_attribute_id": 1,
              "controlled_value_id": 2,
              "concatenated_attr_val": "1|2",
              "vote_score_short": -1,
              "user_id": 5,
              "votes": [
                {
                  "vote_flag": false,
                  "user": {
                    "id": 5
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 10,
          "uuid": "b1aa0a03-3256-4913-aef4-c308ee51dd29",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "private_location": "1,2",
          "project_ids": [ 1 ],
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] }
        },
        {
          "id": 11,
          "uuid": "5adf654d-3aef-48ee-8fd3-48b4a1e2268d",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "private_location": "1,2",
          "project_ids": [ 2 ],
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] }
        },
        {
          "id": 12,
          "uuid": "95e01721-e302-4ac7-b395-f7e4384c76a3",
          "user": { "id": 5 },
          "identifier_user_ids": [ 121, 122 ]
        },
        {
          "id": 13,
          "uuid": "97aaf567-3998-4a05-b743-a261b9e65031",
          "user": { "id": 5 },
          "identifier_user_ids": [ 121 ]
        },
        {
          "id": 14,
          "uuid": "6d59a34c-efb3-498a-9aef-eb6ef60ac0ec",
          "user": { "id": 126, "login": "totally-trusting" },
          "description": "Observation by user 126 who trusts user 125",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] }
        },
        {
          "id": 15,
          "uuid": "dba1f134-f95c-45c2-8381-22b445cf73ef",
          "user": { "id": 5 },
          "description": "Observation of an obscured taxon",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "taxon_geoprivacy": "obscured"
        },
        {
          "id": 16,
          "uuid": "0ae6884e-151e-4d5b-a916-889f01f95985",
          "user": { "id": 5 },
          "description": "Observation of an obscured taxon AND user geoprivacy",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "geoprivacy": "obscured",
          "taxon_geoprivacy": "obscured"
        },
        {
          "id": 17,
          "uuid": "450a7b9c-19f2-43ef-9cc9-38b0d6df9bde",
          "user": { "id": 5 },
          "description": "obs with a large positional_accuracy",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "positional_accuracy": 5000
        },
        {
          "id": 18,
          "uuid": "bf423b43-684a-4aed-bb0c-c8c5ded663c2",
          "user": { "id": 5 },
          "description": "obs with a small positional_accuracy",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "positional_accuracy": 5
        },
        {
          "id": 19,
          "uuid": "6e2602c7-1529-4dce-bd62-32f9d0af62f2",
          "user": { "id": 5 },
          "description": "obs with no positional_accuracy",
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] }
        },
        {
          "id": 20,
          "uuid": "50891b33-96d9-4e46-954d-6215a9ef8147",
          "description": "Has term 2",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "annotations": [
            {
              "id": 4,
              "uuid": "948ea8f3-b4ec-4cc0-b8db-f811fdd45c48",
              "controlled_attribute_id": 2,
              "controlled_value_id": 3,
              "concatenated_attr_val": "2|3",
              "vote_score_short": 1,
              "user_id": 5,
              "votes": []
            }
          ]
        },
        {
          "id": 21,
          "uuid": "048a064f-efb1-4671-afeb-a2fae902df52",
          "description": "Has term 1 and 2",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "annotations": [
            {
              "id": 5,
              "uuid": "ac7b8905-40e2-4b35-b972-b3bcc24b455e",
              "controlled_attribute_id": 1,
              "controlled_value_id": 1,
              "concatenated_attr_val": "1|1",
              "vote_score_short": 1,
              "user_id": 5,
              "votes": []
            },
            {
              "controlled_attribute_id": 2,
              "controlled_value_id": 3,
              "concatenated_attr_val": "2|3",
              "vote_score_short": 1,
              "user_id": 5,
              "votes": []
            }
          ]
        },
        {
          "id": 22,
          "uuid": "4307798e-d8d8-4030-8e08-60de0cbb8323",
          "description": "Observation field value of type numeric",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "ofvs": [ {
            "datatype": "numeric",
            "name_ci": "Count",
            "value_ci": 3
          } ]
        },
        {
          "id": 23,
          "uuid": "aded9e76-ba9a-427c-8346-5530a1dd4866",
          "description": "Observation field value of type taxon",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "ofvs": [ {
            "datatype": "taxon",
            "name_ci": "Eating",
            "value_ci": 3
          } ]
        },
        {
          "id": 24,
          "uuid": "8d863d0e-cbc8-41cc-bf99-8faa6b449541",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) by user who trusts curators with everything",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 25,
          "uuid": "b7254e49-e396-42cd-8e39-369d68c76fc2",
          "user": { "id": 6 },
          "description": "Observation of a threatened taxon in project 2005 (Massachusetts) by user who trusts curators with obs obscured by taxon",
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "taxon_geoprivacy": "obscured"
        },
        {
          "id": 26,
          "uuid": "bc688517-3cfa-4282-81f0-66784cb7dbdf",
          "user": { "id": 6 },
          "description": "Observation with geoprivacy of a threatened taxon in project 2005 (Massachusetts) by user who trusts curators with obs obscured by taxon",
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "taxon_geoprivacy": "obscured",
          "geoprivacy": "obscured"
        },
        {
          "id": 27,
          "uuid": "5d73bb4e-5052-4e1f-ae92-b1cc97ce5baa",
          "user": { "id": 6 },
          "description": "Observation with geoprivacy in project 2005 (Massachusetts) by user who trusts curators with obs obscured by taxon",
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 28,
          "uuid": "ca81b849-a052-4b12-9755-7c5d49190fb3",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) that isn't at the edge of the place by user who trusts curators with everything",
          "user": { "id": 5 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.1,-71.5",
          "private_location": "42.1,-71.5",
          "geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 29,
          "uuid": "3fef8ec3-4f4f-4b69-864e-27ebe7f1d6b7",
          "description": "Research-grade candidate without a taxon",
          "user": { "id": 5 },
          "photo_licenses": ["cc-by"],
          "created_at": "2020-08-08T17:17:10.545-07:00",
          "photos_count": 1,
          "private_location": "1,2",
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "observed_on": "2020-08-08",
          "observed_on_string": "2020-08-08 2:27:03 PM PDT",
          "observed_on_details": {
            "date": "2020-08-08",
            "week": 32,
            "month": 8,
            "hour": 14,
            "year": 2020,
            "day": 8
          }
        },
        {
          "id": 30,
          "uuid": "7f8be603-454e-42ad-b1de-c60da018770a",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) by user who is not in the project",
          "user": { "id": 2 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.7,-73.4",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured",
          "mappable": true,
          "observed_on_details": {
            "date": "2001-06-01",
            "week": 22,
            "month": 6,
            "hour": 1,
            "year": 2001,
            "day": 1
          }
        },
        {
          "id": 31,
          "uuid": "54bdcf6f-aa5e-4316-be7a-417c6a20838a",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) by user who is in the project but doesn't trust the curators",
          "user": { "id": 121 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.7,-73.4",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] }
        },
        {
          "id": 32,
          "uuid": "d17058eb-f864-49b2-8546-b46bf99c3e68",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) by user who trusts user 123, a project curator",
          "user": { "id": 127 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.1,-71.5",
          "private_location": "42.1,-71.5",
          "geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 33,
          "uuid": "3ff91940-4bda-4552-ba9e-def0570d3ac7",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) by user who does not trust user 123, a project curator",
          "user": { "id": 128 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.1,-71.5",
          "private_location": "42.1,-71.5",
          "geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 34,
          "uuid": "3ee2447c-8139-49c5-97d8-54f5d5719125",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) that is not obscured by user who does not trust user 123, a project curator",
          "user": { "id": 128 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.1,-71.5",
          "private_location": "42.1,-71.5",
          "geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -71.5, 42.1 ] }
        },
        {
          "id": 35,
          "uuid": "47748d0d-ddf2-45ac-8f56-7cb75282ebc1",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) with taxon_geoprivacy by user who is not in the project",
          "user": { "id": 2 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.7,-73.4",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "taxon_geoprivacy": "obscured"
        },
        {
          "id": 2020100101,
          "uuid": "64d02611-a44f-4247-b213-8be23e1fbd21",
          "captive": false,
          "description": "Observation in project 2020100101 (Massachusetts) by user who trusts curators with everything",
          "user": { "id": 2020100102 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 2020101501,
          "uuid": "dcccb9cd-6ffb-4a1e-bbbc-28765cf13778",
          "captive": false,
          "description": "Observation not in project 2005 (Massachusetts) b/c it is publicly outside but private inside the place boundary by user who is not in the project",
          "user": { "id": 2 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 2020101502,
          "uuid": "dcccb9cd-6ffb-4a1e-bbbc-28765cf13779",
          "captive": false,
          "description": "Observation in project 2005 (Massachusetts) b/c it is publicly outside but private inside the place boundary by user who is in the project but doesn't trust the curators",
          "user": { "id": 121 },
          "created_at": "2001-06-01T01:00:00",
          "place_ids": [1],
          "private_place_ids": [1,2],
          "location": "42.8,-73.6",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.6, 42.8 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "geoprivacy": "obscured"
        },
        {
          "id": 2020101601,
          "uuid": "03db7d8f-7fe8-44a0-a0a0-9cfe52b13405",
          "captive": false,
          "description": "Verifiable observation with an unlicensed photo",
          "user": {
            "id": 123,
            "login": "a-user",
            "name": "A User"
          },
          "created_at": "2015-12-31T00:00:00",
          "quality_grade": "needs_id",
          "oauth_application_id": 3,
          "private_location": "1,2",
          "license_code": null,
          "private_geojson": { "type": "Point", "coordinates": [ 2, 1 ] },
          "photo_licenses": [],
          "photos_count": 1
        },
        {
          "id": 2020120501,
          "uuid": "e6cc40bf-8de3-4b89-bc05-0e05e59ad6d6",
          "description": "Needs ID of taxon 6 in Massachusetts",
          "user": {
            "id": 123,
            "login": "a-user",
            "name": "A User"
          },
          "created_at": "2015-12-31T00:00:00",
          "quality_grade": "needs_id",
          "identification_categories": ["leading"],
          "ident_taxon_ids": [6],
          "license_code": "cc-by",
          "taxon": {
            "id": 6,
            "uuid": "94dbefce-e621-4aae-85e0-c2f644c99091",
            "iconic_taxon_id": 101,
            "is_active": true,
            "ancestor_ids": [1,2,3,4,6],
            "min_species_ancestry": "1,2,3,4,6",
            "min_species_taxon_id": 6,
            "rank_level": 10,
            "rank": "species"
          },
          "place_ids": [1,2],
          "private_place_ids": [1,2],
          "location": "42.7,-73.4",
          "private_location": "42.7,-73.4",
          "geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -73.4, 42.7 ] }
        },
        {
          "id": 2020120502,
          "uuid": "e6cc40bf-8de3-4b89-bc05-0e05e59ad6d7",
          "description": "Needs ID of taxon 7 in Alameda County",
          "user": {
            "id": 123,
            "login": "a-user",
            "name": "A User"
          },
          "created_at": "2015-12-31T00:00:00",
          "quality_grade": "needs_id",
          "identification_categories": ["leading"],
          "ident_taxon_ids": [6],
          "license_code": "cc-by",
          "taxon": {
            "ancestor_ids": [ 1001, 1, 2 ],
            "iconic_taxon_id": 101,
            "id": 7,
            "is_active": true,
            "min_species_ancestry": "1001,1,2,7",
            "min_species_taxon_id": 7,
            "name": "Los",
            "parent_id": 1,
            "rank": "species",
            "rank_level": 10,
            "uuid": "81bbc106-b372-4df5-af7d-50452cf9956e"
          },
          "place_ids": [2020120501],
          "private_place_ids": [2020120501],
          "location": "37.6505468421,-121.9178854495,",
          "private_location": "37.6505468421,-121.9178854495,",
          "geojson": { "type": "Point", "coordinates": [ -121.9178854495, 42.7 ] },
          "private_geojson": { "type": "Point", "coordinates": [ -121.9178854495, 37.6505468421 ] }
        },
        {
          "id": 2021100801,
          "uuid": "c7a22c2d-f4ca-4daa-8139-9bfa2f411f5d",
          "captive": false,
          "description": "Has photos flagged for copyright violation",
          "user": { "id": 1 },
          "created_at": "2021-10-08T01:00:00",
          "photos_count": 1
        },
        {
          "id": 2021121601,
          "uuid": "b568967d-4f0e-430c-9cb9-e28db5004c37",
          "user": { "id": 2021121602 },
          "created_at": "2021-12-08T01:00:00",
          "description": "Obs by a user who blocks user 2021121601"
        },
        {
          "id": 2023092501,
          "uuid": "78e0b6e4-61fa-11ee-8c99-0242ac120002",
          "user": { 
            "id": 2023092501,
            "login": "user2023092501",
            "spam" : false,
            "suspended" : false
          },
          "location": "50,50",
          "private_location": "3,4",
          "private_geojson": { "type": "Point", "coordinates": [ 4, 3 ] },
          "place_guess": "Tangerina",
          "captive": true
        },
        {
          "id": 2024111201,
          "uuid": "2450abff-8007-46a8-ae88-45808f5dc83a ",
          "user": {
            "id": 123,
            "login": "a-user",
            "name": "A User"
          },
          "taxon_geoprivacy": "private"
        },
        {
          "id": 2025012201,
          "uuid": "cc646758-039d-4b54-a9c9-72adef454379",
          "user": { "id": 123 },
          "photo_licenses": ["cc-by"],
          "photos_count": 1,
          "description": "Observation with media with moderator actions with no users",
          "sounds": [
            {
              "id": 2025012201,
              "license_code": "CC-BY"
            }
          ],
          "sounds_count": 1
        },
        {
          "id": 2025012202,
          "uuid": "537d9290-df3c-404f-a26d-ffe07156908c",
          "user": { "id": 123 },
          "photo_licenses": ["cc-by"],
          "photos_count": 1,
          "description": "Observation with media with moderator actions",
          "sounds": [
            {
              "id": 2025012202,
              "license_code": "CC-BY"
            }
          ],
          "sounds_count": 1
        }
      ]
    },
    "projects": {
      "project": [
        {
          "id": 1,
          "title": "Project One",
          "title_autocomplete": "Project One",
          "title_exact": "Project One",
          "location": "11,12",
          "slug": "project-one",
          "user_ids": [ 1, 5, 123 ],
          "site_features":[{
            "site_id": 1,
            "noteworthy": true,
            "featured_at": "2018-04-20T20:57:17.137Z"
          }]
        },
        {
          "id": 2,
          "title": "Project Two",
          "title_autocomplete": "Project Two",
          "title_exact": "Project Two",
          "location": "21,22",
          "slug": "project-two",
          "user_ids": [ 123 ]
        },
        {
          "id": 543,
          "title": "A Project",
          "title_autocomplete": "A Project",
          "title_exact": "A Project",
          "location": "22,33",
          "slug": "a-project",
          "user_ids": [ 6 ]
        },
        {
          "id": 3,
          "title": "Search Test Project",
          "title_autocomplete": "search test project",
          "title_exact": "Search Test Project",
          "location": "11,12",
          "user_ids": [ 1 ]
        },
        {
          "id": 2000,
          "title": "First New Project",
          "slug": "first-new-project",
          "project_type": "collection",
          "search_parameters": [
            {
              "field": "quality_grade",
              "value": "research,needs_id"
            },
            {
              "field": "taxon_id",
              "value": 1
            }
          ]
        },
        {
          "id": 2001,
          "title": "Second New Project",
          "slug": "second-new-project",
          "project_type": "collection",
          "search_parameters": [
            {
              "field": "user_id",
              "value": 1
            },
            {
              "field": "taxon_id",
              "value": 1
            }
          ]
        },
        {
          "id": 2003,
          "title": "First Umbrella",
          "slug": "first-umbrella",
          "project_type": "umbrella",
          "project_observation_rules": [
            {
              "id": 100,
              "operand_id": 2000,
              "operand_type": "Project",
              "operator": "in_project?"
            },
            {
              "id": 100,
              "operand_id": 2001,
              "operand_type": "Project",
              "operator": "in_project?"
            }
          ]
        },
        {
          "id": 2004,
          "title": "Spammiest Spam Project",
          "title_autocomplete": "Spammiest Spam Project",
          "title_exact": "Spammiest Spam Project",
          "slug": "spammiest-spam-project",
          "user_ids": [5],
          "spam": true
        },
        {
          "id": 2005,
          "project_type": "collection",
          "title": "Observations in Massachusetts",
          "title_autocomplete": "Observations in Massachusetts",
          "title_exact": "Observations in Massachusetts",
          "slug": "observations-in-massachusetts",
          "search_parameters": [
            {
              "field": "place_id",
              "value": 2
            }
          ],
          "search_parameter_fields": {
            "place_id": 2
          },
          "user_id": 1,
          "user_ids": [1, 5, 6, 123, 121],
          "prefers_user_trust": true,
          "observation_requirements_updated_at": "2021-01-01T00:00:00"
        },
        {
          "id": 2006,
          "project_type": "collection",
          "title": "Redundant Observations in Massachusetts",
          "title_autocomplete": "Redundant Observations in Massachusetts",
          "title_exact": "Redundant Observations in Massachusetts",
          "slug": "redundant-observations-in-massachusetts",
          "search_parameters": [
            {
              "field": "place_id",
              "value": 2
            }
          ],
          "search_parameter_fields": {
            "place_id": 2
          }
        },
        {
          "id": 2020100101,
          "project_type": "collection",
          "title": "Redundant Observations in Massachusetts With Disabled Trust",
          "title_autocomplete": "Redundant Observations in Massachusetts With Disabled Trust",
          "title_exact": "Redundant Observations in Massachusetts With Disabled Trust",
          "slug": "redundant-observations-in-massachusetts-with-disabled-trust",
          "search_parameters": [
            {
              "field": "place_id",
              "value": 2
            }
          ],
          "search_parameter_fields": {
            "place_id": 2
          },
          "user_id": 2020100101,
          "user_ids": [2020100101, 2020100102],
          "prefers_user_trust": false
        },
        {
          "id": 2023092501,
          "title": "project-2023092501",
          "title_autocomplete": "project-2023092501",
          "title_exact": "project-2023092501",
          "slug": "project-2023092501",
          "search_parameters": [
            {
              "field": "place_id",
              "value": 2
            }
          ],
          "search_parameter_fields": {
            "place_id": 2
          },
          "user_id": 2023092501,
          "user_ids": [2023092501, 2023092502, 2023092503],
          "admins" : [
            {
              "id" : 2023092501,
              "user_id" : 2023092501,
              "project_id" : 2023092501,
              "role" : "manager"
            }
          ],
          "prefers_user_trust": false
        },
        {
          "id": 2024072601,
          "title": "Proyecto águilas",
          "title_autocomplete": "Proyecto águilas",
          "title_exact": "Proyecto águilas",
          "slug": "proyecto-águilas",
          "slug_keyword": "proyecto-águilas"
        },
        {
          "id": 2024111101,
          "title": "Umbrella Project 2005",
          "slug": "umbrella-project-2005",
          "project_type": "umbrella",
          "project_observation_rules": [
            {
              "id": 2024111101,
              "operand_id": 2005,
              "operand_type": "Project",
              "operator": "in_project?"
            }
          ]
        },
        {
          "id": 2024111102,
          "title": "Project 696",
          "title_autocomplete": "Project 696",
          "title_exact": "Project 696",
          "location": "21,22",
          "slug": "project-696",
          "user_ids": [ 123 ]
        }
      ]
    },
    "taxa": {
      "taxon": [
        {
          "id": 1001,
          "uuid": "9cdac31a-87fa-4361-8b7f-348ccebbe2f1",
          "ancestor_ids": [ 1001 ],
          "min_species_ancestry": "1001",
          "name": "Life",
          "names": [{
            "name_autocomplete": "Life",
            "exact": "Life",
            "exact_ci": "Life"
          }],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 1,
          "uuid": "94c3e33b-ad67-41af-96cd-a91a58a2c4eb",
          "name": "Los",
          "ancestor_ids": [ 1001, 1 ],
          "min_species_ancestry": "1001,1",
          "names": [{
            "name_autocomplete": "Los",
            "exact": "Los",
            "exact_ci": "Los"
          }],
          "observations_count": 50,
          "is_active": true,
          "statuses": [ { "place_id": 432, "iucn": 30, "authority": "IUCN Red List", "status": "VU" } ],
          "listed_taxa": [ { "place_id": 432, "establishment_means": "endemic" } ]
        },
        {
          "id": 2,
          "uuid": "a23748a0-65e3-40e8-a455-40a233ce7587",
          "name": "Los",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "min_species_ancestry": "1001,1,2",
          "names": [{
            "name_autocomplete": "Los",
            "exact": "Los",
            "exact_ci": "Los"
          }],
          "observations_count": 50,
          "is_active": false
        },
        {
          "id": 3,
          "uuid": "5a1320aa-96c0-4118-b705-fcbb7430d1db",
          "name": "Los lobos",
          "parent_id": 2,
          "ancestor_ids": [ 1001, 1, 2, 3 ],
          "min_species_ancestry": "1001,1,2,3",
          "names": [{
            "name_autocomplete": "Los lobos",
            "exact": "Los lobos",
            "exact_ci": "Los lobos"
          }],
          "observations_count": 100,
          "is_active": true,
          "taxon_changes_count": 1,
          "taxon_schemes_count": 1
        },
        {
          "id": 4,
          "uuid": "6da04f2f-8906-4589-83a8-5d77a104b993",
          "names": [{
            "name_autocomplete": "眼紋疏廣蠟蟬",
            "exact": "眼紋疏廣蠟蟬",
            "exact_ci": "眼紋疏廣蠟蟬"
          }],
          "observations_count": 200,
          "is_active": true
        },
        {
          "id": 5,
          "uuid": "e5567150-66fd-4e20-b291-662701e9d4c1",
          "iconic_taxon_id": 101,
          "is_active": true,
          "ancestor_ids": [1,2,3,4,5],
          "min_species_ancestry": "1,2,3,4,5",
          "rank_level": 10,
          "rank": "species"
        },
        {
          "id": 6,
          "uuid": "94dbefce-e621-4aae-85e0-c2f644c99091",
          "iconic_taxon_id": 101,
          "is_active": true,
          "ancestor_ids": [1,2,3,4,6],
          "min_species_ancestry": "1,2,3,4,6",
          "rank_level": 10,
          "rank": "species"
        },
        {
          "id": 123,
          "uuid": "083ced86-f44c-4876-81c1-23dd45badb0f",
          "name": "itsname",
          "names": [
            { "name": "BestEnglish", "locale": "en" },
            { "name": "BestInAmerica", "locale": "en", "place_taxon_names": [
              { "place_id": 111 }
            ] },
            { "name": "BestInCalifornia", "locale": "en", "place_taxon_names": [
              { "place_id": 222 } ] },
            { "name": "BestInAmericaES", "locale": "es", "place_taxon_names": [
              { "place_id": 111 }
            ] },
            { "name": "BestInCaliforniaES", "locale": "es", "place_taxon_names": [
              { "place_id": 222 } ] } ],
          "statuses": [
            { "place_id": null, "iucn": 20 },
            { "place_id": 111, "iucn": 30 },
            { "place_id": 222, "iucn": 50 } ],
          "listed_taxa": [
            { "place_id": 111, "establishment_means": "endemic" },
            { "place_id": 444 },
            { "place_id": 222, "establishment_means": "introduced" }
          ]
        },
        {
          "id": 999,
          "uuid": "6a33f840-aba6-4026-9883-a20dca4f71e7",
          "name": "ataxon"
        },
        {
          "id": 9898,
          "uuid": "07be3740-55ad-41d6-9ad6-fc2d6e8dfe39",
          "name": "ataxon"
        },
        {
          "id": 10001,
          "uuid": "ffb95782-59b0-4fac-930a-6dbe150691e0",
          "name": "DetailsTaxon",
          "ancestor_ids": [ 10001 ]
        },
        {
          "id": 10002,
          "uuid": "899c70b3-5045-48ca-8872-b7fa352357d9",
          "name": "Taxon for a swap"
        },
        {
          "id": 10003,
          "uuid": "122f0605-a520-440e-9226-bd5c44d096d8",
          "name": "Inactive, replaced by 123",
          "is_active": false,
          "current_synonymous_taxon_ids": [123]
        },
        {
          "id": 10004,
          "uuid": "1b0fa776-8792-456b-9c15-e7eab0774f90",
          "name": "Inactive, unreplaced",
          "is_active": false
        },
        {
          "id": 10005,
          "uuid": "dfa4d3bd-d453-41b6-b5eb-bd5106fe6e3e",
          "name": "Inactive, replaced by 1 and 2",
          "is_active": false,
          "current_synonymous_taxon_ids": [1,2]
        },
        {
          "id": 7,
          "uuid": "81bbc106-b372-4df5-af7d-50452cf9956e",
          "name": "Los",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [{
            "name_autocomplete": "Los",
            "exact": "Los",
            "exact_ci": "Los"
          }],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 8,
          "uuid": "95d84231-4e6b-4e4c-b9e2-4efad455f4ce",
          "name": "Mimulus guttatus",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [
            {
              "name_autocomplete": "Mimulus guttatus",
              "exact": "Mimulus guttatus",
              "exact_ci": "Mimulus guttatus",
              "locale": "sci"
            },
            {
              "name_autocomplete": "seep monkeyflower",
              "exact": "seep monkeyflower",
              "exact_ci": "seep monkeyflower",
              "locale": "en"
            }
          ],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 9,
          "uuid": "2365b7d1-e4ab-4f54-a9af-f879d809409c",
          "name": "Ulva intestinalis",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [
            {
              "name_autocomplete": "Ulva intestinalis",
              "exact": "Ulva intestinalis",
              "exact_ci": "Ulva intestinaliss",
              "locale": "sci"
            },
            {
              "name_autocomplete": "Gutweed",
              "exact": "Gutweed",
              "exact_ci": "Gutweed",
              "locale": "en"
            }
          ],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 10,
          "uuid": "e1290908-66c0-4207-89db-bb55f1195b28",
          "name": "Viola pedunculata",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [
            {
              "name_autocomplete": "Viola pedunculata",
              "exact": "Viola pedunculata",
              "exact_ci": "Viola pedunculata",
              "locale": "sci"
            },
            {
              "name_autocomplete": "California Golden Violet",
              "exact": "California Golden Violet",
              "exact_ci": "California Golden Violet",
              "locale": "en"
            },
            {
              "name_autocomplete": "yellow pansy",
              "exact": "yellow pansy",
              "exact_ci": "yellow pansy",
              "locale": "en"
            }
          ],
          "observations_count": 51,
          "is_active": true
        },
        {
          "id": 11,
          "uuid": "042b6588-7b63-41e9-98d2-c38b93a8b6f4",
          "name": "Junonia hierta",
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [
            {
              "name_autocomplete": "Junonia hierta",
              "exact": "Junonia hierta",
              "exact_ci": "Junonia hierta",
              "locale": "sci"
            },
            {
              "name_autocomplete": "Yellow Pansy",
              "exact": "Yellow Pansy",
              "exact_ci": "Yellow Pansy",
              "locale": "en",
              "place_taxon_names": [
                {
                  "place_id": 433,
                  "position": 0
                }
              ]
            }
          ],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 12,
          "uuid": "3d489440-b79e-4a1a-9b5c-4dbc594339ae",
          "name": "Search test taxon",
          "rank": "species",
          "rank_level": 10,
          "parent_id": 1,
          "ancestor_ids": [ 1001, 1, 2 ],
          "names": [{
            "name_autocomplete": "Search test taxon",
            "exact": "Search test taxon",
            "exact_ci": "Search test taxon"
          }],
          "observations_count": 50,
          "is_active": true
        },
        {
          "id": 2022020301,
          "uuid": "b35eb7a4-670a-45f5-a12b-2e71f64ec801",
          "name": "Frendopila burgescens",
          "names": [
            {
              "name": "Frendopila burgescens",
              "name_autocomplete": "Frendopila burgescens",
              "exact": "Frendopila burgescens",
              "exact_ci": "Frendopila burgescens",
              "locale": "sci"
            },
            {
              "name": "franglepop",
              "name_autocomplete": "franglepop",
              "exact": "franglepop",
              "exact_ci": "franglepop",
              "locale": "en"
            },
            {
              "name": "נשר",
              "name_autocomplete": "נשר",
              "exact": "נשר",
              "exact_ci": "נשר",
              "locale": "he"
            }
          ],
          "is_active": true
        },
        {
          "id": 101,
          "uuid": "21441033-24f6-4d8b-9bd3-b2718292b776",
          "name": "Actinopterygii",
          "is_active": true,
          "iconic_taxon_id": 101
        },
        {
          "id": 102,
          "uuid": "ffa18900-408e-4c34-bcfe-802086f0c5a8",
          "name": "Amphibia",
          "is_active": true,
          "iconic_taxon_id": 102
        },
        {
          "id": 103,
          "uuid": "3037d958-0456-468b-ba6f-551adbb53105",
          "name": "Animalia",
          "is_active": true,
          "iconic_taxon_id": 103
        },
        {
          "id": 104,
          "uuid": "1decf1b7-e97d-483a-b1e3-7d9424a4b3ac",
          "name": "Arachnida",
          "is_active": true,
          "iconic_taxon_id": 104
        },
        {
          "id": 105,
          "uuid": "ad3adcf8-0fa5-45c4-9bde-bedd77f740c1",
          "name": "Aves",
          "ancestry": "1001/103",
          "is_active": true,
          "iconic_taxon_id": 105
        },
        {
          "id": 106,
          "uuid": "d18908c7-6cab-4a41-af72-d0e1453820cd",
          "name": "Chromista",
          "is_active": true,
          "iconic_taxon_id": 106
        },
        {
          "id": 107,
          "uuid": "15d05eb3-cba7-480a-a77c-00a1961e9c25",
          "name": "Insecta",
          "is_active": true,
          "iconic_taxon_id": 107
        },
        {
          "id": 108,
          "uuid": "f8eb356d-8169-4425-b6b2-b997f4a5cbc6",
          "name": "Fungi",
          "is_active": true,
          "iconic_taxon_id": 108
        },
        {
          "id": 109,
          "uuid": "bd3fba7d-28cf-4bc7-995b-da3e92067fef",
          "name": "Mammalia",
          "is_active": true,
          "iconic_taxon_id": 109
        },
        {
          "id": 110,
          "uuid": "c15a8a6d-769c-4931-bee3-ab7a6a36a433",
          "name": "Mollusca",
          "is_active": true,
          "iconic_taxon_id": 110
        },
        {
          "id": 111,
          "uuid": "b2dccdb0-a85f-46e2-bda1-4cb904d090e9",
          "name": "Plantae",
          "is_active": true,
          "iconic_taxon_id": 111
        },
        {
          "id": 112,
          "uuid": "0f5d4e84-618c-48db-8515-7c3e67b8727f",
          "name": "Protozoa",
          "is_active": true,
          "iconic_taxon_id": 112
        },
        {
          "id": 113,
          "uuid": "9779a5d3-6b7c-43fe-8168-10c6744fe35c",
          "name": "Reptilia",
          "is_active": true,
          "iconic_taxon_id": 113
        },
        {
          "id": 696,
          "uuid": "c5e7f8a3-2b4d-4c98-87f1-9a6d3e5b1c72",
          "name": "Chelicerata",
          "is_active": true,
          "iconic_taxon_id": 696
        }
      ]
    },
    "users": {
      "user": [
        {
          "id": 1,
          "login": "userlogin",
          "login_autocomplete": "userloginautocomplete",
          "name": "username",
          "name_autocomplete": "usernameautocomplete",
          "site_id": 1,
          "suspended": false
        },
        {
          "id": 2,
          "login": "search_test_user",
          "login_autocomplete": "search_test_user",
          "name": "Search Test User",
          "name_autocomplete": "Search Test User",
          "suspended": false
        },
        {
          "id": 5,
          "login": "b-user",
          "name": "B User",
          "suspended": false
        },
        {
          "id": 6,
          "login": "z-user",
          "name": "Z User",
          "suspended": false
        },
        {
          "id": 121,
          "login": "user121",
          "name": "user121",
          "suspended": false
        },
        {
          "id": 122,
          "login": "user122",
          "name": "user122",
          "suspended": false
        },
        {
          "id": 123,
          "login": "a-user",
          "name": "A User",
          "orcid": "0000-0001-0002-0004",
          "suspended": false
        },
        {
          "id": 124,
          "login": "es-user",
          "name": "ES User",
          "locale": "es",
          "place_id": 222,
          "suspended": false
        },
        {
          "id": 125,
          "login": "totally-trustworthy",
          "suspended": false
        },
        {
          "id": 126,
          "login": "totally-trusting",
          "suspended": false
        },
        {
          "id": 127,
          "login": "user127",
          "name": "Observer that trusts user 123",
          "suspended": false
        },
        {
          "id": 128,
          "login": "user125",
          "name": "Observer that does NOT trust user 123",
          "suspended": false
        },
        {
          "id": 2,
          "login": "search_test_user",
          "login_autocomplete": "search_test_user",
          "name": "Search Test User",
          "name_autocomplete": "Search Test User",
          "suspended": false
        },
        {
          "id": 129,
          "login": "prefers-no-common-names",
          "name": "Prefers No Common Names",
          "suspended": false
        },
        {
          "id": 1234,
          "login": "user1234",
          "name": "user1234",
          "suspended": false
        },
        {
          "id": 2020110501,
          "login": "user2020110501",
          "name": "User that follows user 126 and trusts them",
          "suspended": false
        },
        {
          "id": 2020111201,
          "login": "user2020111201",
          "name": "User that follows user 126 and does NOT trusts them",
          "suspended": false
        },
        {
          "id": 2021111401,
          "login": "user2021111401",
          "name": "User 2021111401",
          "suspended": true
        },
        {
          "id": 2021121601,
          "login": "user2021121601",
          "name": "User that will be blocked",
          "suspended": false
        },
        {
          "id": 2021121602,
          "login": "user2021121602",
          "name": "User that blocks user2021121601",
          "suspended": false
        },
        {
          "id": 2023092501,
          "login": "user2023092501",
          "name": "User2023092501 with email and IP",
          "email": "user2023092501@gmail.com",
          "last_ip": "192.168.0.1",
          "suspended": false
        },
        {
          "id": 2023092502,
          "login": "user2023092502",
          "name": "User2023092502 with email and IP",
          "email": "user2023092502@gmail.com",
          "last_ip": "192.168.0.2",
          "suspended": false
        },
        {
          "id": 2023092503,
          "login": "user2023092503",
          "name": "User2023092503 with email and IP",
          "email": "user2023092503@gmail.com",
          "last_ip": "192.168.0.3",
          "suspended": false
        }
      ]
    },
    "update_actions": {
      "update_action": [
        {
          "id": 1,
          "subscriber_ids": [123],
          "resource_id": 1,
          "resource_type": "Observation",
          "notifier_type": "Comment",
          "notifier_id": 1,
          "notification": "activity",
          "resource_owner_id": 123,
          "viewed_subscriber_ids": []
        },
        {
          "id": 2,
          "subscriber_ids": [123],
          "resource_id": 2,
          "resource_type": "Observation",
          "notifier_type": "Comment",
          "notifier_id": 2,
          "notification": "activity",
          "resource_owner_id": 5,
          "viewed_subscriber_ids": []
        }
      ]
    }
  },
  "postgresql": {
    "announcements": [
      {
        "id": 1,
        "body": "Inactive announcement with no locale",
        "start": "2023-01-01 00:00:00",
        "end": "2023-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}"
      },
      {
        "id": 2,
        "body": "Active announcement with no locale",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}"
      },
      {
        "id": 3,
        "body": "Active announcement with multiple locales",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{en-US,fr}",
        "dismissible": true,
        "clients": "{}"
      },
      {
        "id": 4,
        "body": "Active announcement with en locale",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{en}",
        "dismissible": true,
        "clients": "{}"
      },
      {
        "id": 5,
        "body": "Active announcement for inat-ios and inat-android",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{inat-ios,inat-android}"
      },
      {
        "id": 6,
        "body": "Active announcement targeting even user_ids",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "target_group_type": "user_id_parity",
        "target_group_partition": "even"
      },
      {
        "id": 7,
        "body": "Active announcement targeting even created seconds",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "target_group_type": "created_second_parity",
        "target_group_partition": "even"
      },
      {
        "id": 8,
        "body": "Active announcement targeting even user_id digit sums",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "target_group_type": "user_id_digit_sum_parity",
        "target_group_partition": "even"
      },
      {
        "id": 9,
        "body": "Active announcement targeting 2024 donors",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "include_donor_start_date": "2024-01-01",
        "include_donor_end_date":  "2024-12-31"
      },
      {
        "id": 10,
        "body": "Active announcement excluding 2024 donors",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "mobile/home",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "exclude_donor_start_date": "2024-01-01",
        "exclude_donor_end_date":  "2024-12-31"
      },
      {
        "id": 11,
        "body": "Active announcement targeting welcome/index placement",
        "start": "2023-01-01 00:00:00",
        "end": "2100-01-01 00:00:00",
        "created_at": "2023-01-01 00:00:00",
        "updated_at": "2023-01-01 00:00:00",
        "placement": "welcome/index",
        "locales": "{}",
        "dismissible": true,
        "clients": "{}",
        "exclude_donor_start_date": "2024-01-01",
        "exclude_donor_end_date":  "2024-12-31"
      }
    ],
    "comments": [
      {
        "id": 1,
        "parent_type": "Observation",
        "parent_id": 1,
        "body": "I am the very model of a modern major general",
        "created_at": "2016-01-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      },
      {
        "id": 2,
        "parent_type": "Observation",
        "parent_id": 2,
        "body": "I've information animal, mineral, and vegetable'",
        "created_at": "2016-01-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      }
    ],
    "conservation_statuses": [
      {
        "taxon_id": 10001,
        "place_id": 432,
        "authority": "cs-authority",
        "status": "cs-status",
        "iucn": 20,
        "description": "cs-description",
        "created_at": "2016-01-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      }
    ],
    "deleted_observations": [
      {
        "user_id": 1,
        "observation_id": 1000,
        "created_at": "2016-01-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      },
      {
        "user_id": 1,
        "observation_id": 1001,
        "created_at": "2016-02-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      },
      {
        "user_id": 1,
        "observation_id": 1002,
        "created_at": "2016-03-01 00:00:00",
        "updated_at": "2016-01-01 00:00:00"
      }
    ],
    "file_extensions": [
      {
        "id": 1,
        "extension": "jpeg",
        "created_at": "2021-07-08 00:00:00",
        "updated_at": "2021-07-08 00:00:00"
      }
    ],
    "file_prefixes": [
      {
        "id": 1,
        "prefix": "https://static.inaturalist.org/photos",
        "created_at": "2021-07-08 00:00:00",
        "updated_at": "2021-07-08 00:00:00"
      }
    ],
    "flags": [
      {
        "flag": "copyright infringement",
        "flaggable_id": 2021100801,
        "flaggable_type": "Photo",
        "uuid": "c1a05f79-4133-4a7f-8d58-fdad9d4c3806",
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      }
    ],
    "friendships": [
      {
        "id": 1,
        "user_id": 126,
        "friend_id": 125,
        "trust": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      },
      {
        "id": 2,
        "user_id": 127,
        "friend_id": 123,
        "trust": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      },
      {
        "id": 3,
        "user_id": 126,
        "friend_id": 2020110501,
        "trust": false,
        "following": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      },
      {
        "id": 4,
        "user_id": 2020110501,
        "friend_id": 126,
        "trust": true,
        "following": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      },
      {
        "id": 5,
        "user_id": 126,
        "friend_id": 2020111201,
        "trust": true,
        "following": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      },
      {
        "id": 6,
        "user_id": 2020111201,
        "friend_id": 126,
        "trust": false,
        "following": true,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00"
      }
    ],
    "identifications": [
      {
        "id": 102,
        "uuid": "a74986ff-ebcb-4646-bc6e-f26d191df10b",
        "observation_id": 1,
        "taxon_id": 5,
        "user_id": 123,
        "body": "id1",
        "category": "leading",
        "current": true
      },
      {
        "id": 103,
        "uuid": "4a4d2853-1d89-4f97-9cba-9b8c930534b9",
        "observation_id": 1,
        "taxon_id": 5,
        "user_id": 5,
        "body": "id2"
      },
      {
        "id": 105,
        "uuid": "9ea80970-afe8-4575-bd61-e9395c768b85",
        "current": true,
        "body": "id1",
        "category": "leading",
        "user_id": 1234,
        "taxon_id": 5,
        "observation_id": 1
      },
      {
        "id": 121,
        "uuid": "6351abcb-8ed4-4b7d-84ff-066ece491338",
        "current": true,
        "user_id": 121,
        "observation_id": 12
      },
      {
        "id": 122,
        "current": true,
        "user_id": 122,
        "observation_id": 12
      },
      {
        "id": 124,
        "current": true,
        "created_at": "2015-12-31 00:00:00",
        "category": "leading",
        "user_id": 121,
        "observation_id": 13
      },
      {
        "id": 125,
        "current": true,
        "created_at": "2016-12-31 00:00:00",
        "category": "leading",
        "user_id": 122,
        "observation_id": 13
      },
      {
        "id": 2023092501,
        "current": true,
        "created_at": "2023-09-25 00:00:00",
        "category": "leading",
        "user_id": 2023092501,
        "observation_id": 2023092501
      }
    ],
    "lists": [
      {
        "id": 301,
        "title": "A List"
      },
      {
        "id": 999,
        "title": "AProjectList",
        "project_id": 543,
        "type": "ProjectList"
      },
      {
        "id": 1000,
        "title": "DetailsListedTaxonList"
      }
    ],
    "listed_taxa": [
      {
        "taxon_id": 401,
        "list_id": 301
      },
      {
        "taxon_id": 402,
        "list_id": 301
      },
      {
        "taxon_id": 987,
        "list_id": 999
      },
      {
        "taxon_id": 876,
        "list_id": 999
      },
      {
        "taxon_id": 10001,
        "list_id": 1000,
        "place_id": 432,
        "establishment_means": "endemic"
      }
    ],
    "messages": [
      {
        "id": 1,
        "from_user_id": 1,
        "to_user_id": 123,
        "user_id": 123,
        "created_at": "2023-12-12 00:00:00",
        "updated_at": "2023-12-12 00:00:00"
      }
    ],
    "moderator_actions": [
      {
        "id": 2025012201,
        "resource_type": "Photo",
        "resource_id": 2025012201,
        "user_id": -1,
        "action": "hide",
        "reason": "reason for hiding content",
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00"
      },
      {
        "id": 2025012202,
        "resource_type": "Sound",
        "resource_id": 2025012201,
        "user_id": -1,
        "action": "hide",
        "reason": "reason for hiding content",
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00"
      },
      {
        "id": 2025012203,
        "resource_type": "Photo",
        "resource_id": 2025012202,
        "user_id": 1,
        "action": "hide",
        "reason": "reason for hiding content",
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00"
      },
      {
        "id": 2025012204,
        "resource_type": "Sound",
        "resource_id": 2025012202,
        "user_id": 1,
        "action": "hide",
        "reason": "reason for hiding content",
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00"
      }
    ],
    "oauth_applications": [
      {
        "id": 3,
        "name": "iNaturalist iPhone App",
        "uid": "uid",
        "secret": "secret",
        "official": true,
        "redirect_uri": "redirect_uri",
        "created_at": "2018-04-01 01:00:00",
        "updated_at": "2018-04-01 01:00:00"
      },
      {
        "id": 2020102901,
        "name": "Totally Trustworthy Endeavor",
        "uid": "sdkjgha3934",
        "secret": "dshghkjgh395",
        "official": false,
        "redirect_uri": "redirect_uri",
        "created_at": "2020-10-29 01:00:00",
        "updated_at": "2020-10-29 01:00:00"
      }
    ],
    "oauth_access_tokens": [
      {
        "id": 2020102801,
        "resource_owner_id": 123,
        "application_id": 3,
        "token": "sdjgnaldkfjfg",
        "expires_in": 600,
        "created_at": "2020-10-28 11:54:15.314522",
        "revoked_at": null,
        "scopes": "write login"
      },
      {
        "id": 2020102901,
        "resource_owner_id": 1,
        "application_id": 3,
        "token": "g2sdgdjgndgsdfgdsaldkfjfg",
        "expires_in": 600,
        "created_at": "2020-10-28 11:54:15.314522",
        "revoked_at": null,
        "scopes": "write login"
      },
      {
        "id": 2020102902,
        "resource_owner_id": 123,
        "application_id": 2020102901,
        "token": "alskhkjsdghlakjgh",
        "expires_in": 600,
        "created_at": "2020-10-20 01:54:15.314522",
        "revoked_at": "2020-10-20 03:54:15.314522",
        "scopes": "write login"
      }
    ],
    "observation_accuracy_samples": [
      {
        "id": 1,
        "observation_accuracy_experiment_id": 1,
        "observation_id": 1,
        "created_at": "2024-05-01T00:00:00",
        "updated_at": "2024-05-01T00:00:00"
      },
      {
        "id": 2,
        "observation_accuracy_experiment_id": 1,
        "observation_id": 10,
        "created_at": "2024-05-01T00:00:00",
        "updated_at": "2024-05-01T00:00:00"
      }
    ],
    "observation_fields": [
      {
        "id": 1,
        "name": "fieldname",
        "description": "fieldname description",
        "datatype": "text",
        "allowed_values": "one|two|three",
        "values_count": 1
      }
    ],
    "observation_field_values": [
      {
        "id": 1,
        "observation_id": 1,
        "observation_field_id": 1,
        "value": "one",
        "created_at": "2024-02-01T00:00:00",
        "updated_at": "2024-02-01T00:00:00",
        "user_id": 1,
        "uuid": "b027f2ff-c913-470e-a1da-a3e2f3ec2359"
      }
    ],
    "observations": [
      {
        "id": 1,
        "uuid": "cabbd853-39c0-429c-86f1-b36063d3d475"
      },
      {
        "id": 2,
        "uuid": "9a4046ff-2005-4c8c-8127-48ef2c8e3ab9"
      },
      {
        "id": 333,
        "uuid": "5e26217c-5a88-421b-81fc-0ce4f07f634a"
      },
      {
        "id": 4,
        "uuid": "e29e68ca-0ecf-4c6b-8fd5-71a28603fb5d"
      },
      {
        "id": 5,
        "uuid": "e60d4116-f327-4ce1-bd46-27048fdc68a0"
      },
      {
        "id": 6,
        "uuid": "e1aabcda-0d06-4454-8959-9b000e555610"
      },
      {
        "id": 7,
        "uuid": "f88b97cf-6515-4f5b-9a94-5f484167e4a9"
      },
      {
        "id": 8,
        "uuid": "02ad4be1-9f21-41a9-82d3-444d6c1078da"
      },
      {
        "id": 9,
        "uuid": "dc223c38-8389-44cc-8d22-8a0e77a67cbf"
      },
      {
        "id": 10,
        "uuid": "b1aa0a03-3256-4913-aef4-c308ee51dd29"
      },
      {
        "id": 11,
        "uuid": "5adf654d-3aef-48ee-8fd3-48b4a1e2268d"
      },
      {
        "id": 12,
        "uuid": "95e01721-e302-4ac7-b395-f7e4384c76a3"
      },
      {
        "id": 13,
        "uuid": "97aaf567-3998-4a05-b743-a261b9e65031"
      },
      {
        "id": 14,
        "uuid": "6d59a34c-efb3-498a-9aef-eb6ef60ac0ec"
      },
      {
        "id": 15,
        "uuid": "dba1f134-f95c-45c2-8381-22b445cf73ef"
      },
      {
        "id": 16,
        "uuid": "0ae6884e-151e-4d5b-a916-889f01f95985"
      },
      {
        "id": 17,
        "uuid": "450a7b9c-19f2-43ef-9cc9-38b0d6df9bde"
      },
      {
        "id": 18,
        "uuid": "bf423b43-684a-4aed-bb0c-c8c5ded663c2"
      },
      {
        "id": 19,
        "uuid": "6e2602c7-1529-4dce-bd62-32f9d0af62f2"
      },
      {
        "id": 20,
        "uuid": "50891b33-96d9-4e46-954d-6215a9ef8147"
      },
      {
        "id": 21,
        "uuid": "048a064f-efb1-4671-afeb-a2fae902df52"
      },
      {
        "id": 22,
        "uuid": "4307798e-d8d8-4030-8e08-60de0cbb8323"
      },
      {
        "id": 23,
        "uuid": "aded9e76-ba9a-427c-8346-5530a1dd4866"
      },
      {
        "id": 24,
        "uuid": "8d863d0e-cbc8-41cc-bf99-8faa6b449541"
      },
      {
        "id": 25,
        "uuid": "b7254e49-e396-42cd-8e39-369d68c76fc2"
      },
      {
        "id": 26,
        "uuid": "bc688517-3cfa-4282-81f0-66784cb7dbdf"
      },
      {
        "id": 27,
        "uuid": "5d73bb4e-5052-4e1f-ae92-b1cc97ce5baa"
      },
      {
        "id": 28,
        "uuid": "ca81b849-a052-4b12-9755-7c5d49190fb3"
      },
      {
        "id": 29,
        "uuid": "3fef8ec3-4f4f-4b69-864e-27ebe7f1d6b7"
      },
      {
        "id": 30,
        "uuid": "7f8be603-454e-42ad-b1de-c60da018770a"
      },
      {
        "id": 31,
        "uuid": "54bdcf6f-aa5e-4316-be7a-417c6a20838a"
      },
      {
        "id": 32,
        "uuid": "d17058eb-f864-49b2-8546-b46bf99c3e68"
      },
      {
        "id": 33,
        "uuid": "3ff91940-4bda-4552-ba9e-def0570d3ac7"
      },
      {
        "id": 34,
        "uuid": "3ee2447c-8139-49c5-97d8-54f5d5719125"
      },
      {
        "id": 35,
        "uuid": "47748d0d-ddf2-45ac-8f56-7cb75282ebc1"
      },
      {
        "id": 2020100101,
        "uuid": "64d02611-a44f-4247-b213-8be23e1fbd21"
      },
      {
        "id": 2020101501,
        "uuid": "dcccb9cd-6ffb-4a1e-bbbc-28765cf13778"
      },
      {
        "id": 2020101502,
        "uuid": "dcccb9cd-6ffb-4a1e-bbbc-28765cf13779"
      },
      {
        "id": 2020101601,
        "uuid": "03db7d8f-7fe8-44a0-a0a0-9cfe52b13405"
      },
      {
        "id": 2020120501,
        "uuid": "e6cc40bf-8de3-4b89-bc05-0e05e59ad6d6"
      },
      {
        "id": 2020120502,
        "uuid": "e6cc40bf-8de3-4b89-bc05-0e05e59ad6d7"
      },
      {
        "id": 2021121601,
        "uuid": "b568967d-4f0e-430c-9cb9-e28db5004c37"
      },
      {
        "id": 2023092501,
        "uuid": "78e0b6e4-61fa-11ee-8c99-0242ac120002"
      },
      {
        "id": 2025012201,
        "uuid": "cc646758-039d-4b54-a9c9-72adef454379"
      },
      {
        "id": 2025012202,
        "uuid": "537d9290-df3c-404f-a26d-ffe07156908c"
      }
    ],
    "observation_photos": [
      {
        "id": 1,
        "observation_id": 29,
        "photo_id": 1,
        "position": 0,
        "created_at": "2020-03-13 16:50:17.98273",
        "updated_at": "2020-03-13 16:50:17.98273",
        "uuid": "8d841055-5850-42ee-be5e-d9068c5f31fd"
      },
      {
        "id": 2020101601,
        "observation_id": 2020101601,
        "photo_id": 2020101601,
        "position": 0,
        "created_at": "2020-10-15 16:50:17.98273",
        "updated_at": "2020-10-15 16:50:17.98273",
        "uuid": "79b758eb-b0c3-4879-b8c0-f642a7104802"
      },
      {
        "id": 2021100801,
        "observation_id": 2021100801,
        "photo_id": 2021100801,
        "position": 0,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00",
        "uuid": "677e1bbb-6782-4166-aed7-ee14124d8216"
      },
      {
        "id": 2025012201,
        "observation_id": 2025012201,
        "photo_id": 2025012201,
        "position": 0,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "uuid": "5c44e86f-ac79-4d4c-9f55-1b54d8d3b681"
      },
      {
        "id": 2025012202,
        "observation_id": 2025012202,
        "photo_id": 2025012202,
        "position": 0,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "uuid": "ad529a09-97df-4daa-bc88-8eff4881d872"
      }
    ],
    "observation_sounds": [
      {
        "id": 2025012201,
        "observation_id": 2025012201,
        "sound_id": 2025012201,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "uuid": "cf8c7f16-8680-4545-85e8-be258068a9fa"
      },
      {
        "id": 2025012202,
        "observation_id": 2025012202,
        "sound_id": 2025012202,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "uuid": "5eef64b4-7ca6-49c1-abe7-57fbb77c06fe"
      }
    ],
    "photos": [
      {
        "id": 1,
        "user_id": 5,
        "native_photo_id": 1,
        "created_at": "2019-12-30 19:37:52.986735",
        "updated_at": "2019-12-30 19:37:52.986735",
        "native_page_url": "https://www.inaturalist.org/photos/58769366",
        "native_username": "b-user",
        "native_realname": "B User",
        "license": 4,
        "type": "LocalPhoto",
        "file_content_type": "image/jpeg",
        "file_file_name": "091a1e05-aecc-4b9c-b99f-81163f46191f.jpeg",
        "file_file_size": 2040108,
        "file_updated_at": "2019-12-30 19:37:51.542313",
        "uuid": "e1a058c7-258b-4250-90a8-6902aa310312",
        "file_prefix_id": 1,
        "file_extension_id": 1,
        "width": 400,
        "height": 300
      },
      {
        "id": 2020101601,
        "user_id": 123,
        "native_photo_id": 2020101601,
        "created_at": "2020-10-15 19:37:52.986735",
        "updated_at": "2020-10-15 19:37:52.986735",
        "native_page_url": "https://www.inaturalist.org/photos/2020101601",
        "native_username": "b-user",
        "native_realname": "B User",
        "license": 0,
        "type": "LocalPhoto",
        "file_content_type": "image/jpeg",
        "file_file_name": "091a1e05-aecc-4b9c-b99f-81163f46191f.jpeg",
        "file_file_size": 2040108,
        "file_updated_at": "2019-12-30 19:37:51.542313",
        "uuid": "a24ccc42-fb8a-4585-972b-7cd4f5ffcbad",
        "file_prefix_id": 1,
        "file_extension_id": 1,
        "width": 400,
        "height": 300
      },
      {
        "id": 2021100801,
        "user_id": 1,
        "native_photo_id": 2021100801,
        "created_at": "2021-10-08 01:00:00",
        "updated_at": "2021-10-08 01:00:00",
        "native_page_url": "https://www.inaturalist.org/photos/2021100801",
        "license": 0,
        "type": "LocalPhoto",
        "file_content_type": "image/jpeg",
        "file_file_name": "2021100801.jpeg",
        "file_file_size": 2040108,
        "file_updated_at": "2021-10-08 01:00:00",
        "uuid": "a9d9a70f-caf0-4a04-9a3a-037cb8ba842d",
        "file_prefix_id": 1,
        "file_extension_id": 1,
        "width": 400,
        "height": 300
      },
      {
        "id": 2025012201,
        "user_id": 123,
        "native_photo_id": 2025012201,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "native_page_url": "https://www.inaturalist.org/photos/2025012201",
        "license": 4,
        "type": "LocalPhoto",
        "file_content_type": "image/jpeg",
        "file_file_name": "2025012201.jpeg",
        "file_file_size": 12201,
        "file_updated_at": "2025-01-22 01:00:00",
        "uuid": "0f252785-4bf0-4455-9793-9350acca1ebd",
        "file_prefix_id": 1,
        "file_extension_id": 1,
        "width": 400,
        "height": 300
      },
      {
        "id": 2025012202,
        "user_id": 123,
        "native_photo_id": 2025012202,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "native_page_url": "https://www.inaturalist.org/photos/2025012202",
        "license": 4,
        "type": "LocalPhoto",
        "file_content_type": "image/jpeg",
        "file_file_name": "2025012202.jpeg",
        "file_file_size": 12202,
        "file_updated_at": "2025-01-22 01:00:00",
        "uuid": "933d40cb-fde1-4f50-bfe4-a9dc2f9a34ae",
        "file_prefix_id": 1,
        "file_extension_id": 1,
        "width": 400,
        "height": 300
      }
    ],
    "places": [
      {
        "id": 1,
        "uuid": "48fba6f4-8627-411b-bf38-af9e280e5cfc",
        "name": "United States"
      },
      {
        "id": 111,
        "name": "United States",
        "ancestry": ""
      },
      {
        "id": 222,
        "name": "California",
        "ancestry": "111"
      },
      {
        "id": 333,
        "name": "Nevada",
        "ancestry": "111"
      },
      {
        "id": 432,
        "name": "a-place",
        "display_name": "a-place"
      },
      {
        "id": 433,
        "name": "a-place-in-a-place",
        "display_name": "A Place In A Place",
        "ancestry": "432"
      },
      {
        "id": 511,
        "name": "locale-place",
        "code": "LP",
        "admin_level": 0,
        "ancestry": "111"
      },
      {
        "id": 512,
        "name": "locale-place-admin-level-1",
        "code": "LPA",
        "admin_level": 10
      }
    ],
    "preferences": [
      {
        "id": 101,
        "name": "curator_coordinate_access",
        "owner_id": 101,
        "owner_type": "ProjectObservation",
        "value": "t"
      },
      {
        "id": 111,
        "name": "curator_coordinate_access",
        "owner_id": 111,
        "owner_type": "ProjectObservation",
        "value": "f"
      },
      {
        "id": 200,
        "name": "locale",
        "owner_id": 1,
        "owner_type": "Site",
        "value": "en"
      },
      {
        "id": 201,
        "name": "site_name_short",
        "owner_id": 1,
        "owner_type": "Site",
        "value": "iNat"
      },
      {
        "id": 301,
        "name": "scientific_name_first",
        "owner_id": 1,
        "owner_type": "User",
        "value": "t"
      },
      {
        "id": 302,
        "name": "curator_coordinate_access_for",
        "owner_type": "ProjectUser",
        "owner_id": 1,
        "value": "taxon"
      },
      {
        "id": 303,
        "name": "curator_coordinate_access_for",
        "owner_type": "ProjectUser",
        "owner_id": 7,
        "value": "any"
      },
      {
        "id": 304,
        "name": "curator_coordinate_access_for",
        "owner_type": "ProjectUser",
        "owner_id": 8,
        "value": "taxon"
      },
      {
        "id": 305,
        "name": "curator_coordinate_access_for",
        "owner_type": "ProjectUser",
        "owner_id": 9,
        "value": "none"
      },
      {
        "id": 306,
        "name": "common_names",
        "owner_id": 129,
        "owner_type": "User",
        "value": "f"
      },
      {
        "id": 2020100101,
        "name": "curator_coordinate_access_for",
        "owner_type": "ProjectUser",
        "owner_id": 2020100102,
        "value": "any"
      },
      {
        "id": 2020100102,
        "name": "user_trust",
        "owner_type": "Project",
        "owner_id": 2020100101,
        "value": "f"
      },
      {
        "id": 2020100103,
        "name": "user_trust",
        "owner_type": "Project",
        "owner_id": 2005,
        "value": "t"
      }
    ],
    "project_observations": [
      {
        "id": 101,
        "observation_id": 10,
        "user_id": 1,
        "uuid": "8cf0282d-c6f3-4947-9905-4937def371f4",
        "project_id": 1
      },
      {
        "id": 111,
        "observation_id": 11,
        "user_id": 1,
        "uuid": "902996e7-6d0d-40b8-9dc7-1384d0bc2ec7",
        "project_id": 2
      },
      {
        "id": 909090,
        "observation_id": 1,
        "user_id": 1,
        "uuid": "07e60a0a-db6d-48b1-8424-5d5c3f9d2bc3",
        "project_id": 543
      }
    ],
    "project_users": [
      {
        "id": 1,
        "project_id": 543,
        "user_id": 5,
        "observations_count": 1000
      },
      {
        "id": 2,
        "project_id": 543,
        "user_id": 6,
        "observations_count": 800
      },
      {
        "id": 3,
        "project_id": 543,
        "user_id": 123,
        "role": "curator",
        "observations_count": 900
      },
      {
        "id": 4,
        "project_id": 1,
        "user_id": 123,
        "role": "curator"
      },
      {
        "id": 5,
        "project_id": 2,
        "user_id": 123,
        "role": "curator"
      },
      {
        "id": 6,
        "project_id": 2005,
        "user_id": 123,
        "role": "curator"
      },
      {
        "id": 7,
        "project_id": 2005,
        "user_id": 5
      },
      {
        "id": 8,
        "project_id": 2005,
        "user_id": 6
      },
      {
        "id": 9,
        "project_id": 2005,
        "user_id": 121
      },
      {
        "id": 2020100101,
        "project_id": 2020100101,
        "user_id": 2020100101,
        "role": "curator"
      },
      {
        "id": 2020100102,
        "project_id": 2020100101,
        "user_id": 2020100102
      },
      {
        "id": 2023092501,
        "project_id": 2023092501,
        "user_id": 2023092501,
        "role": "manager"
      },
      {
        "id": 2023092502,
        "project_id": 2023092501,
        "user_id": 2023092502,
        "role": "curator"
      },
      {
        "id": 2023092503,
        "project_id": 2023092501,
        "user_id": 2023092503
      },
      {
        "id": 2024111101,
        "project_id": 2024111101,
        "user_id": 123,
        "role": "curator"
      },
      {
        "id": 2024111102,
        "project_id": 2024111101,
        "user_id": 5
      },
      {
        "id": 2024111103,
        "project_id": 2024111101,
        "user_id": 6
      },
      {
        "id": 2024111104,
        "project_id": 2024111101,
        "user_id": 121
      }
    ],
    "projects": [
      {
        "id": 543,
        "slug": "a-project",
        "title": "A Project",
        "user_id": 6,
        "start_time": "2016-02-02 2:22:22",
        "end_time": "2016-05-05 5:55:55"
      },
      {
        "id": 1,
        "slug": "project-one",
        "title": "Project One",
        "user_id": 123
      },
      {
        "id": 2,
        "slug": "project-two",
        "title": "Project Two",
        "user_id": 123
      },
      {
        "id": 2005,
        "project_type": "collection",
        "title": "Observations in Massachusetts",
        "slug": "observations-in-massachusetts",
        "observation_requirements_updated_at": "2020-01-01 00:00:00"
      },
      {
        "id": 2020100101,
        "project_type": "collection",
        "title": "Redundant Observations in Massachusetts With Disabled Trust",
        "slug": "redundant-observations-in-massachusetts-with-disabled-trust"
      },
      {
        "id": 2023092501,
        "slug": "project-2023092501",
        "title": "project-2023092501",
        "user_id": 2023092501
      }
    ],
    "provider_authorizations": [
      {
        "id": 1234,
        "provider_name": "orcid",
        "provider_uid": "0000-0001-0002-0004",
        "user_id": 123,
        "created_at": "2020-11-12 21:40:02.779904",
        "updated_at": "2020-11-12 21:40:02.779904",
        "scope": ""
      }
    ],
    "posts": [
      {
        "id": 1,
        "parent_id": 543,
        "parent_type": "Project",
        "published_at": "2018-04-01 01:00:00",
        "title": "post 1 title",
        "body": "post 1 body",
        "user_id": 1
      },
      {
        "id": 2,
        "parent_id": 543,
        "parent_type": "Project",
        "published_at": "2018-04-01 02:00:00",
        "title": "post 2 title",
        "body": "post 2 body2",
        "user_id": 1
      },
      {
        "id": 2023092501,
        "parent_id": 2023092501,
        "parent_type": "Project",
        "published_at": "2023-09-25 02:00:00",
        "title": "2023092501 title",
        "body": "2023092501 body",
        "user_id": 2023092501
      },
      {
        "id": 2023092502,
        "parent_id": 2023092501,
        "parent_type": "Project",
        "published_at": "2023-09-25 02:00:00",
        "title": "2023092502 title",
        "body": "2023092502 body",
        "user_id": 2023092502
      },
      {
        "id": 2023092503,
        "parent_id": 2023092501,
        "parent_type": "Project",
        "published_at": "2023-09-25 02:00:00",
        "title": "2023092503 title",
        "body": "2023092503 body",
        "user_id": 2023092503
      }
    ],
    "roles": [
      {
        "id": 1,
        "name": "admin"
      }
    ],
    "roles_users": [
      {
        "user_id": 1,
        "role_id": 1
      }
    ],
    "rules": [
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operand_type": "Place",
        "operand_id": 222,
        "operator": "observed_in_place?"
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operand_type": "Place",
        "operand_id": 333,
        "operator": "observed_in_place?"
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operand_type": "Taxon",
        "operand_id": 444,
        "operator": "in_taxon?"
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operand_type": "Taxon",
        "operand_id": 555,
        "operator": "in_taxon?"
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "on_list?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "identified?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "georeferenced?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "has_a_photo?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "has_a_sound?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "identified?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "wild?", "operand_id": 1
      },
      {
        "type": "ProjectObservationRule", "ruler_type": "Project", "ruler_id": 543,
        "operator": "verifiable?", "operand_id": 1
      }
    ],
    "sites": [
      {
        "id": 1,
        "name": "iNaturalist",
        "place_id": 1,
        "url": "https://www.inaturalist.org",
        "draft": "f",
        "created_at": "2018-12-31T00:00:00",
        "updated_at": "2018-12-31T00:00:00"
      },
      {
        "id": 2,
        "name": "NaturaLista",
        "place_id": 6793,
        "url": "https://www.naturalista.mx/",
        "draft": "f",
        "created_at": "2018-12-31T00:00:00",
        "updated_at": "2018-12-31T00:00:00"
      }
    ],
    "sounds": [
      {
        "id": 2025012201,
        "user_id": 123,
        "native_sound_id": 2025012201,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "native_page_url": "https://www.inaturalist.org/sounds/2025012201",
        "license": 4,
        "type": "LocalSound",
        "file_content_type": "audio/mp4",
        "file_file_name": "2025012201.m4a",
        "file_file_size": 12201,
        "file_updated_at": "2025-01-22 01:00:00",
        "uuid": "953e64da-181f-481f-9e5e-af9fd344695e"
      },
      {
        "id": 2025012202,
        "user_id": 123,
        "native_sound_id": 2025012202,
        "created_at": "2025-01-22 01:00:00",
        "updated_at": "2025-01-22 01:00:00",
        "native_page_url": "https://www.inaturalist.org/sounds/2025012202",
        "license": 4,
        "type": "LocalSound",
        "file_content_type": "audio/mp4",
        "file_file_name": "2025012202.m4a",
        "file_file_size": 12202,
        "file_updated_at": "2025-01-22 01:00:00",
        "uuid": "3e36c900-b554-4297-ae66-dbe1b11b1bf5"
      }
    ],
    "subscriptions": [
      {
        "id": 1,
        "resource_id": 543,
        "resource_type": "Project",
        "user_id": 1
      }
    ],
    "taxa": [
      {
        "id": 1001,
        "uuid": "9cdac31a-87fa-4361-8b7f-348ccebbe2f1",
        "name": "Life"
      },
      {
        "id": 1,
        "uuid": "94c3e33b-ad67-41af-96cd-a91a58a2c4eb",
        "name": "Los"
      },
      {
        "id": 2,
        "uuid": "a23748a0-65e3-40e8-a455-40a233ce7587",
        "name": "Los",
        "ancestry": "1"
      },
      {
        "id": 4,
        "uuid": "a23748a0-65e3-40e8-a455-40a433ce7587",
        "ancestry": "1/2/3"
      },
      {
        "id": 5,
        "uuid": "a23748a0-65e3-40e8-a455-40a533ce7587",
        "ancestry": "1/2/3/4"
      },
      {
        "id": 101,
        "uuid": "21441033-24f6-4d8b-9bd3-b2718292b776",
        "name": "Actinopterygii",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 101
      },
      {
        "id": 102,
        "uuid": "ffa18900-408e-4c34-bcfe-802086f0c5a8",
        "name": "Amphibia",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 102
      },
      {
        "id": 103,
        "uuid": "3037d958-0456-468b-ba6f-551adbb53105",
        "name": "Animalia",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 103
      },
      {
        "id": 104,
        "uuid": "1decf1b7-e97d-483a-b1e3-7d9424a4b3ac",
        "name": "Arachnida",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 104
      },
      {
        "id": 105,
        "uuid": "ad3adcf8-0fa5-45c4-9bde-bedd77f740c1",
        "name": "Aves",
        "ancestry": "1001/103",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 105
      },
      {
        "id": 106,
        "uuid": "d18908c7-6cab-4a41-af72-d0e1453820cd",
        "name": "Chromista",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 106
      },
      {
        "id": 107,
        "uuid": "15d05eb3-cba7-480a-a77c-00a1961e9c25",
        "name": "Insecta",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 107
      },
      {
        "id": 108,
        "uuid": "f8eb356d-8169-4425-b6b2-b997f4a5cbc6",
        "name": "Fungi",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 108
      },
      {
        "id": 109,
        "uuid": "bd3fba7d-28cf-4bc7-995b-da3e92067fef",
        "name": "Mammalia",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 109
      },
      {
        "id": 110,
        "uuid": "c15a8a6d-769c-4931-bee3-ab7a6a36a433",
        "name": "Mollusca",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 110
      },
      {
        "id": 111,
        "uuid": "b2dccdb0-a85f-46e2-bda1-4cb904d090e9",
        "name": "Plantae",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 111
      },
      {
        "id": 112,
        "uuid": "0f5d4e84-618c-48db-8515-7c3e67b8727f",
        "name": "Protozoa",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 112
      },
      {
        "id": 113,
        "uuid": "9779a5d3-6b7c-43fe-8168-10c6744fe35c",
        "name": "Reptilia",
        "is_active": true,
        "is_iconic": true,
        "iconic_taxon_id": 113
      }
    ],
    "users": [
      {
        "id": 1,
        "login": "userlogin",
        "name": "username",
        "site_id": 1,
        "description": "a very original user",
        "last_active": "2022-03-01",
        "created_at": "2020-01-01 00:00:00",
        "updated_at": "2020-01-01 00:00:00"
      },
      {
        "id": 5,
        "login": "b-user",
        "name": "B User"
      },
      {
        "id": 6,
        "login": "z-user",
        "name": "Z User",
        "icon_content_type": "image/jpeg",
        "icon_file_name": "img.jpg"
      },
      {
        "id": 121,
        "login": "user121",
        "name": "user121",
        "icon_content_type": "image/jpeg",
        "icon_file_name": "img.jpg"
      },
      {
        "id": 122,
        "login": "user122",
        "name": "user122",
        "icon_content_type": "image/jpeg",
        "icon_file_name": "img.jpg"
      },
      {
        "id": 123,
        "login": "a-user",
        "name": "A User",
        "icon_content_type": "image/jpeg",
        "icon_file_name": "img.jpg",
        "created_at": "2020-01-01 00:00:00",
        "updated_at": "2020-01-01 00:00:00"
      },
      {
        "id": 124,
        "login": "es-user",
        "name": "ES User",
        "locale": "es",
        "place_id": 222
      },
      {
        "id": 125,
        "login": "totally-trustworthy"
      },
      {
        "id": 126,
        "login": "totally-trusting"
      },
      {
        "id": 127,
        "login": "user127",
        "name": "Observer that trusts user 123",
        "description": "Observer that trusts user 123",
        "site_id": 1
      },
      {
        "id": 128,
        "login": "user125",
        "name": "Observer that does NOT trust user 123",
        "description": "Observer that does NOT trust user 123"
      },
      {
        "id": 129,
        "login": "prefers-no-common-names"
      },
      {
        "id": 1234,
        "login": "user1234"
      },
      {
        "id": 2020100101,
        "login": "project_2020100101_admin"
      },
      {
        "id": 2020100102,
        "login": "project_2020100101_trusting"
      },
      {
        "id": 2020110501,
        "login": "user2020110501",
        "name": "User that follows user 126 and trusts them",
        "description": "User that follows user 126 and trusts them"
      },
      {
        "id": 2020111201,
        "login": "user2020111201",
        "name": "User that follows user 126 and does NOT trusts them",
        "description": "User that follows user 126 and does NOT trusts them"
      },
      {
        "id": 2021111401,
        "login": "user2021111401",
        "name": "User 2021111401",
        "suspended_at": "2021-11-14T00:00:00",
        "description": "Suspended user"
      },
      {
        "id": 2021121601,
        "login": "user2021121601",
        "name": "User that will be blocked",
        "description": "User that will be blocked"
      },
      {
        "id": 2021121602,
        "login": "user2021121602",
        "name": "User that blocks user2021121601",
        "description": "User that blocks user2021121601"
      },
      {
        "id": 2023092501,
        "login": "user2023092501",
        "name": "User2023092501 with email and IP",
        "email": "user2023092501@gmail.com",
        "last_ip": "192.168.0.1",
        "created_at": "2020-01-01",
        "updated_at": "2020-01-01",
        "last_active": "2023-01-01"
      },
      {
        "id": 2023092502,
        "login": "user2023092502",
        "name": "User2023092502 with email and IP",
        "email": "user2023092502@gmail.com",
        "last_ip": "192.168.0.2",
        "created_at": "2020-01-01",
        "updated_at": "2020-01-01",
        "last_active": "2023-01-01"
      },
      {
        "id": 2023092503,
        "login": "user2023092503",
        "name": "User2023092503 with email and IP",
        "email": "user2023092503@gmail.com",
        "last_ip": "192.168.0.3",
        "created_at": "2020-01-01",
        "updated_at": "2020-01-01",
        "last_active": "2023-01-01"
      },
      {
        "id": 2024071501,
        "login": "user2024071501",
        "name": "User2024071501 with even created_at second",
        "created_at": "2020-01-01 00:00:00"
      },
      {
        "id": 2024071502,
        "login": "user2024071502",
        "name": "User2024071502 with odd created_at second",
        "created_at": "2020-01-01 00:00:01"
      },
      {
        "id": 2024071701,
        "login": "user2024071701",
        "name": "User2024071701 with 2024 donation",
        "created_at": "2020-01-01 00:00:00"
      },
      {
        "id": 2024071702,
        "login": "user2024071702",
        "name": "User2024071702 with 2023 donation",
        "created_at": "2020-01-01 00:00:00"
      }
    ],
    "user_blocks": [
      {
        "id": 2021121601,
        "user_id": 2021121602,
        "blocked_user_id": 2021121601,
        "created_at": "2021-11-15T00:00:00",
        "updated_at": "2021-11-15T00:00:00"
      }
    ],
    "user_donations": [
      {
        "id": 2024071701,
        "user_id": 2024071701,
        "donated_at": "2024-04-01 00:00:00",
        "created_at": "2024-04-01 00:00:00",
        "updated_at": "2024-04-01 00:00:00"
      },
      {
        "id": 2024071702,
        "user_id": 2024071702,
        "donated_at": "2023-04-01 00:00:00",
        "created_at": "2023-04-01 00:00:00",
        "updated_at": "2023-04-01 00:00:00"
      }
    ],
    "user_privileges": [
      {
        "id": 1,
        "user_id": 1,
        "privilege": "speech"
      }
    ]
  }
}
