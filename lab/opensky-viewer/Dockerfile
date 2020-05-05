FROM node:lts-stretch-slim

WORKDIR /usr/src/app

RUN set -eux ;\
    apt-get -qq update ;\
    DEBIAN_FRONTEND=noninteractive apt-get -y install \
      git ;\
    chown node:node /usr/src/app

USER node

RUN set -eux ;\
    git clone --branch master --single-branch --depth 1 \
      https://github.com/jsanz/opensky-viewer.git .

RUN npm run build

EXPOSE 3000

CMD npm run start
