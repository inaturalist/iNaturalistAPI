---
name: postman-controller-requests
description: Create Postman requests (and optional curl scratch files) for endpoints backed by controller methods in the iNaturalistAPI repo. Use when asked to add endpoints to the Postman "API" collection, build requests from lib/controllers/**, or produce curl examples for a controller method.
---

# Postman requests from iNaturalistAPI controller methods

Turn `lib/controllers/{v1,v2}/*_controller.js` methods into Postman requests in the
**API** collection, grouped into `v1` / `v2` folders and parameterized with `{{base_url}}`.

## 1. Resolve controller method → routes

Every method can be reachable at both v1 and v2, one, or neither.

```bash
# v1 — the whole route table is one file; dfault( method, path, handler, options )
grep -n "ProjectsController.show" lib/inaturalist_api.js

# v2 — one file per path, path mirrors the directory
grep -rln "ProjectsController\|projectsController" openapi/paths/v2
```

- v2 path = file path: `openapi/paths/v2/users/{id}/projects.js` → `GET /v2/users/{id}/projects`.
- v2 often wraps v1 and **renames** the method — check `lib/controllers/v2/*_controller.js`
  first. Examples: v2 places `search` is v1 `autocomplete`; v2 places `show` resolves
  UUIDs to IDs via Postgres, then delegates to v1 `show`.
- v1 route options matter: `validateMultiIDParam` (rejects non `[0-9,]` ids),
  `allowIDSlugs` (also permits `[a-zá_-]`, i.e. slugs/UUIDs in the path).
- Never assume a v2 route is missing — confirm with a curl that returns 404.

## 2. Extract the real parameter set

Read the method body, not just the OpenAPI doc. Both disagree in places.

```bash
grep -n "req\.query\.\|req\.params\." lib/controllers/v1/projects_controller.js
```

- Follow shared criteria builders (e.g. `ProjectsController.searchCriteria`) — most
  `projects` params live there, not in `search`/`autocomplete`.
- v2's *documented* params are the Joi schema in `openapi/schema/request/<name>.js`,
  plus the inline `transform( Joi... )` parameters in the path file (path params, `fields`).
- Flag mismatches instead of silently picking one: e.g. the controller honors
  `project_type` on `users#projects` but `users_projects.js` doesn't document it.
- Pagination — record default/max and whether it actually pages:
  - `InaturalistAPI.setRequestPaginationData( req, { default, max } )` sets `page` + `per_page`;
    `setPerPage` sets only `per_page`.
  - Paging is real only if the ES body uses `from`; `size`-only endpoints ignore `page`,
    and an endpoint with neither (places#containing) silently returns ES's default 10.
- Note 422s worth documenting: `ids.length > per_page` → "Too many IDs";
  missing `lat`/`lng`; unknown user.

## 3. Pick real IDs and verify before writing anything

Servers run on the **host**, not in this container: `http://host.docker.internal:4000`
(Node API), `:3000` (Rails).

```bash
curl -s "http://host.docker.internal:4000/v1/projects?per_page=10&fields=id,slug,project_type"
curl -s -o /dev/null -w "%{http_code}\n" "http://host.docker.internal:4000/v2/<path>"
```

The host server may be running an **older build than the current branch** — check a
behavior the branch changed (e.g. a 422 message) before documenting status codes, and say
which build a verified result came from.

Optional scratch step: write the curl variants to `.claude/tmp/curl/NN-<resource>-<method>.sh`
(one file per controller method, `set -x`, `BASE=${BASE:-...}` overridable, a header comment
naming the method, its routes, and its pagination defaults). Useful as the source of truth
for the Postman requests, and it satisfies the "large output goes to a file" convention.

## 4. Postman conventions for this repo

- Workspace **iNaturalist** (`0f2dfd9d-0a22-43a7-b6e9-dac6263792f9`), collection **API**
  (`6097267-29702051-730b-4ec2-a61b-f37f80492bbf`). Re-confirm with
  `searchPostmanElements(entityType: "collections", q: "API", ownership: "organization")`.
- `{{base_url}}` is an **origin with no version segment** (existing usage:
  `{{base_url}}/oauth/token`), so write `{{base_url}}/v1/...` and `{{base_url}}/v2/...`.
  It is defined both as a collection variable and in the `Local` / `Staging 2`
  environments (which also define `api_token`).
- **Auth: leave request-level auth unset so requests inherit the collection's.** Do not
  copy the hardcoded JWT out of `GET Observations` — it expires. `{{api_token}}` is the
  fallback if a request genuinely needs a token.
- Shape each request like `GET Observations`: `GET`, `Accept: application/json`,
  a `query` array (not just a raw string), and a `description`.
- Naming: `GET <Resource> <Action>` (e.g. `GET Projects Autocomplete`) inside a `v1` or
  `v2` folder.
- One request per controller method. Put **every** supported param in `queryParams`:
  enable the minimal working set, add the rest with `enabled: false` and a one-line
  `description` each. v2 requests need `fields` (`fields=all` or an explicit list) or the
  response comes back sparse.

## 5. Postman MCP mechanics (read before writing)

1. Fetch `postman://instructions` from the postman MCP server first.
2. `getEnabledTools` — the server is often in **minimal** mode, which has **no**
   `createCollectionFolder`, `getCollectionRequest`, `getCollectionFolder`,
   `deleteCollection`, or `patchCollection`. Plan around what's actually enabled.
3. `getCollection(model: "full")` exceeds the tool output limit for this collection and
   gets written to a file — read it with `jq`, and copy it to the scratchpad as a backup:
   `jq -c '.collection.item[N]' <file>`.
4. **Creating folders in minimal mode requires `putCollection`, which replaces the whole
   collection.** Ask the user before doing it. Then:
   - echo every existing item verbatim, including `id` and `uid` (omitting ids makes
     Postman delete and recreate items with new ids),
   - append the new folders as `{ id: <generated uuid v4>, name: "v1", item: [] }`
     (the schema requires `id` on top-level items),
   - re-fetch and `jq`-diff against the backup to prove nothing changed, and restore from
     the backup if it did.
5. Add the requests with `createCollectionRequest({ collectionId, folderId, ... })` — it
   supports per-param `description` and `enabled`, which the nested `putCollection` item
   schema does not.

## Gotchas

- The collection contains saved cookies, an `authenticity_token`, OAuth secrets, and JWTs.
  A full `putCollection` re-transmits all of it; don't paste any of it into new requests,
  files, or commits.
- `getCollection` without `model: "full"` returns only `itemRefs` (name + id) — enough to
  find a request, not enough to reproduce one.
- Several existing requests hardcode `http://localhost:4000` or `http://host.docker.internal:4000`;
  new ones should use `{{base_url}}` regardless.
