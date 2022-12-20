FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

USER node

ENTRYPOINT [ "node", "src/index.js" ]
