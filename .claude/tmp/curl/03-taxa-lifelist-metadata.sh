#!/usr/bin/env bash
# TaxaController.lifelistMetadata
#   v1: GET /v1/taxa/lifelist_metadata       (route option defaultTTL: 300)
#   v2: GET /v2/taxa/lifelist_metadata       (v2 wrapper adds page/per_page/total_results)
# Params:  observed_by_user_id (REQUIRED), locale, preferred_place_id, fields (v2 only).
#          observed_by_user_id goes through User.findByLoginOrID -- a login works too.
# Errors:  no/unknown user -> 422; empty observed-taxon set -> 500; sentinel [-1] -> {}.
# Pagination: NONE.
# HOST BUILD WARNING (checked 2026-07-31): the API on host.docker.internal:4000 predates
#          this branch. The v2 calls below 422 with a *response*-shaped error
#          ("uuid.0 must match format uuid" / "id.0 must be integer") because the request
#          falls through to /v2/observations/{uuid} or /v2/taxa/{id}. Restart the host API
#          on this branch to exercise them. The v1 calls are verified working.
set -x
BASE=${BASE:-http://host.docker.internal:4000}
USER=${USER_ID:-383144}

curl -s "$BASE/v1/taxa/lifelist_metadata?observed_by_user_id=$USER&locale=en"
curl -s "$BASE/v1/taxa/lifelist_metadata?observed_by_user_id=tonyrebelo"   # login works
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/v1/taxa/lifelist_metadata"  # -> 422

curl -s "$BASE/v2/taxa/lifelist_metadata?observed_by_user_id=$USER&locale=en&fields=all"
