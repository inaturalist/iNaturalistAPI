# Platform should be forced to amd64
# because node-mapnik is not available in arm64
FROM --platform=linux/amd64 node:16 as base

RUN apt-get update -qq && apt-get install -y postgresql-client-11

ENV NODE_ENV=development

RUN useradd -ms /bin/bash inaturalist
USER inaturalist

# Set the working directory in the container
WORKDIR /home/inaturalist/api

# Copy the dependencies file to the working directory
COPY --chown=inaturalist:inaturalist package*.json .
COPY --chown=inaturalist:inaturalist config.docker.js config.js

# Install dependencies
RUN npm install

# Copy app and libs
COPY --chown=inaturalist:inaturalist lib lib
COPY --chown=inaturalist:inaturalist openapi openapi
COPY --chown=inaturalist:inaturalist public public
COPY --chown=inaturalist:inaturalist schema schema
COPY --chown=inaturalist:inaturalist swagger-ui swagger-ui
COPY --chown=inaturalist:inaturalist app.js .

# Create directories for the log and static content
RUN mkdir /home/inaturalist/api/log
RUN mkdir /home/inaturalist/api/cache
RUN mkdir -p /home/inaturalist/api/public/uploads

ARG GIT_BRANCH
ARG GIT_COMMIT
ARG IMAGE_TAG
ARG BUILD_DATE

ENV GIT_BRANCH=${GIT_BRANCH}
ENV GIT_COMMIT=${GIT_COMMIT}
ENV IMAGE_TAG=${IMAGE_TAG}
ENV BUILD_DATE=${BUILD_DATE}

RUN echo "GIT_BRANCH=${GIT_BRANCH}" > /home/inaturalist/api/build_info
RUN echo "GIT_COMMIT=${GIT_COMMIT}" >> /home/inaturalist/api/build_info
RUN echo "IMAGE_TAG=${IMAGE_TAG}" >> /home/inaturalist/api/build_info
RUN echo "BUILD_DATE=${BUILD_DATE}" >> /home/inaturalist/api/build_info

FROM base as test

ENV NODE_ENV=test

COPY --chown=inaturalist:inaturalist test test

CMD [ "npm", "run", "coverage" ]

FROM base as development

EXPOSE 4000

CMD [ "node", "app.js" ]
