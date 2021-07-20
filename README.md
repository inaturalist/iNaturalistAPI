# iNaturalistAPI

[![Build Status](https://github.com/inaturalist/iNaturalistAPI/workflows/iNaturalstAPI%20CI/badge.svg)](https://github.com/inaturalist/iNaturalistAPI/actions)
[![Coverage Status](https://coveralls.io/repos/github/inaturalist/iNaturalistAPI/badge.svg?branch=main)](https://coveralls.io/github/inaturalist/iNaturalistAPI?branch=main)

Our API is documented using the [Swagger](http://swagger.io/)/[OpenAPI](https://github.com/OAI/OpenAPI-Specification) 2.0 [specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md). Check out the [Swagger UI](https://github.com/swagger-api/swagger-ui) documentation viewer at https://api.inaturalist.org/docs.

#### https://api.inaturalist.org

# Setup

```bash
npm install
# Fill in vals to connect to Rails, Postgres, and elasticsearch
cp config_example.js config.js
# Run the node app on port 4000
node app.js
```

# Running Tests

If [running iNaturalist services from Docker](https://github.com/inaturalist/inaturalist/blob/main/CONTRIBUTING.md#using-docker), make sure to run `make services` from the main app first (note that Elasticsearch may take a few seconds to start).

Run all: `npm test`
Filter by pattern: `NODE_ENV=test ./node_modules/mocha/bin/_mocha --recursive --fgrep observations`

You can also add `.only` to a `describe` or `it` call to only run that test when you run `npm test`, e.g. `it.only( "should only run this test" )`.

# Updating Documentation

Edit `lib/views/swagger_v*.yml.ejs`
