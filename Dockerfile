# Platform should be forced to amd64
# because node-mapnik is not available in arm64
FROM --platform=linux/amd64 node:16 as base

ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY package*.json ./

COPY config_example.js config.js

RUN npm install

FROM base as test

ENV NODE_ENV=test

RUN apt-get update -qq && apt-get install -y postgresql-client-11

COPY . .

CMD [ "npm", "run", "coverage" ]

FROM base as development

ENV NODE_ENV=development

COPY . .

EXPOSE 4000

CMD [ "node", "app.js" ]
