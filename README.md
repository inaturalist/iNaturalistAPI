# iNaturalistAPI

[![Build Status](https://github.com/inaturalist/iNaturalistAPI/workflows/iNaturalstAPI%20CI/badge.svg)](https://github.com/inaturalist/iNaturalistAPI/actions)

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

# Running Tests with Docker

You can run the tests with Docker Compose. 
All required services will be started by the `docker-compose.test.yml` compose file:

```
docker compose -f docker-compose.test.yml up -d
```

You can follow the tests execution in the logs:

```
docker logs -f api-test
```

The first time you run the compose file, a local docker image for the API service will be automatically built, from you local GIT checkout. But if later you do some code changes, or update your GIT checkout, you need to re-build the docker image with:

```
docker compose -f docker-compose.test.yml build
```

This compose build is using the `test` target of the Dockerfile.

# ESLint

Please run ESLint to check for syntax formatting errors. To run ESLint, run: `npm run eslint`. Please address any syntax errors before submitting pull requests. ESLint will also run automatically via Github Actions on submitted pull requests along with tests.

All test failures and syntax errors must be resolved before pull requests before will be merged.


# Updating Documentation

Edit `lib/views/swagger_v*.yml.ejs`
