#!/usr/bin/env bash
# ObservationsController.taxa
#   v1: GET /v1/observations/taxa            (lib/inaturalist_api.js, no route options)
#   v2: GET /v2/observations/taxa            (openapi/paths/v2/observations/taxa.js -> v1 taxa)
# Params:  full observations_search set (110 keys); v2 schema = observations_taxa.js,
#          which is observations_search with user_id REQUIRED.
# Pagination: NONE. Controller forces per_page:0 and returns page:1,
#          per_page:<bucket count>. terms agg capped at size 700000.
# 422:     missing user_id.
# HOST BUILD WARNING (checked 2026-07-31): the API on host.docker.internal:4000 predates
#          this branch. The v2 calls below 422 with a *response*-shaped error
#          ("uuid.0 must match format uuid" / "id.0 must be integer") because the request
#          falls through to /v2/observations/{uuid} or /v2/taxa/{id}. Restart the host API
#          on this branch to exercise them. The v1 calls are verified working.
set -x
BASE=${BASE:-http://host.docker.internal:4000}
USER=${USER_ID:-383144}

curl -s "$BASE/v1/observations/taxa?user_id=$USER"
curl -s "$BASE/v1/observations/taxa?user_id=$USER&quality_grade=research&d1=2024-01-01"
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/v1/observations/taxa"   # -> 422

curl -s "$BASE/v2/observations/taxa?user_id=$USER&fields=all"
curl -s "$BASE/v2/observations/taxa?user_id=$USER&place_id=1&fields=all"
