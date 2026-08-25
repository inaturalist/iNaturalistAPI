#!/usr/bin/env bash
# ObservationsController.taxonomy
#   v1: GET /v1/observations/taxonomy        (route option defaultTTL: 300)
#   v2: GET /v2/observations/taxonomy        (v2 wrapper adds page/per_page/total_results;
#                                             x-default-ttl 300, x-unpublished: true)
# Params:  full observations_search set. NOTHING is required -- always filter.
# Notes:   count_without_taxon is only computed when taxon_id is absent (extra ES query).
# Pagination: NONE. v1 returns { count_without_taxon, size, results }; v2 drops `size`.
# HOST BUILD WARNING (checked 2026-07-31): the API on host.docker.internal:4000 predates
#          this branch. The v2 calls below 422 with a *response*-shaped error
#          ("uuid.0 must match format uuid" / "id.0 must be integer") because the request
#          falls through to /v2/observations/{uuid} or /v2/taxa/{id}. Restart the host API
#          on this branch to exercise them. The v1 calls are verified working.
set -x
BASE=${BASE:-http://host.docker.internal:4000}
USER=${USER_ID:-383144}

curl -s "$BASE/v1/observations/taxonomy?user_id=$USER"
curl -s "$BASE/v1/observations/taxonomy?user_id=$USER&taxon_id=47126"  # no count_without_taxon work

curl -s "$BASE/v2/observations/taxonomy?user_id=$USER&fields=all"
