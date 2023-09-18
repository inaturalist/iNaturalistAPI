FROM node:16

ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY package*.json ./

COPY config_example.js config.js

RUN npm install

COPY . .

EXPOSE 4000

CMD [ "node", "app.js" ]
