FROM node:16

RUN apt-get update -qq && apt-get install -y postgresql-client

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# EXPOSE 4000

CMD [ "npm", "test" ]
