#!/usr/bin/env bash
# AnnouncementsController.search (lib/controllers/v1/announcements_controller.js)
#   v1: GET /v1/announcements
#   v2: GET /v2/announcements   (openapi/paths/v2/announcements.js, x-default-ttl: -1)
# Proxies to the Rails app: GET /announcements/active (inaturalistjs announcements.search),
#   passing through query params and the User-Agent header (Rails targets some
#   announcements by app version parsed from the UA).
# Params (openapi/schema/request/announcements_search.js, unknown(false) so v2 rejects others):
#   placement  users/dashboard#sidebar | users/dashboard | welcome/index | mobile/home | mobile
#   client     inat-ios | inat-android | seek | inatrn
#   locale     e.g. en, ka
#   fields     v2 only in practice; use fields=all or the response is sparse
# Auth: optional user JWT (Rails filters dismissed/targeted announcements per user).
# Pagination: NONE — controller returns everything as page 1 (per_page = result count).
# Cache: this branch (OPS-415, b3dde138) sets Cache-Control: private, no-cache, no-store,
#   must-revalidate + Expires: -1 + Pragma: no-cache via x-default-ttl: -1
#   (see test/integration/v2/announcements.js:39). Verify the host build actually
#   returns these headers before trusting cached responses.
set -x
BASE=${BASE:-http://host.docker.internal:4000}

# minimal working call — check the no-cache headers with -D -
curl -s -D - "$BASE/v2/announcements?fields=all"

# param passthrough variants
curl -s "$BASE/v2/announcements?fields=all&client=inat-ios"
curl -s "$BASE/v2/announcements?fields=all&locale=ka"
curl -s "$BASE/v2/announcements?fields=all&placement=mobile"
curl -s -H "User-Agent: iNaturalist/708 CFNetwork/1410.0.3 Darwin/22.6.0" "$BASE/v2/announcements?fields=all"

# v1 flavor
curl -s -D - "$BASE/v1/announcements"
