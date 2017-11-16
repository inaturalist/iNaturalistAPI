# iNaturalistAPI

[![Build Status](https://travis-ci.org/inaturalist/iNaturalistAPI.svg?branch=master)](https://travis-ci.org/inaturalist/iNaturalistAPI)
[![Coverage Status](https://coveralls.io/repos/github/inaturalist/iNaturalistAPI/badge.svg?branch=master)](https://coveralls.io/github/inaturalist/iNaturalistAPI?branch=master)

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

Run all: `npm test`
Filter by pattern: `NODE_ENV=test ./node_modules/mocha/bin/_mocha --recursive --fgrep observations`

# Updating Documentation

Edit `lib/views/swagger_v*.yml.ejs`
