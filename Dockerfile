FROM node:18-bookworm AS astro

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
      build-essential \
      dumb-init \
      gosu \
      libpixman-1-dev \
      libcairo2-dev \
      libpango1.0-dev \
      pkg-config

COPY astro-entrypoint.sh /usr/local/bin/astro-entrypoint.sh

ENTRYPOINT [ "/usr/bin/dumb-init", "/usr/local/bin/astro-entrypoint.sh" ]

########################################################################

FROM scratch AS dependencies

COPY package.json /package.json
COPY package-lock.json /package-lock.json
COPY node_modules/ /node_modules/

########################################################################

FROM joseluisq/static-web-server:2 AS site

COPY dist/ /var/www/

ENV SERVER_ROOT=/var/www
