FROM node:current-alpine

WORKDIR /usr/src/app

COPY ./package.json .
RUN npm install --quiet

CMD npm start