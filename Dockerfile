FROM debian:stretch-slim

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    PATH=/opt/node/bin:/opt/ruby/bin:$PATH

RUN apt-get update && apt-get -y dist-upgrade && \
    apt-get install -y --no-install-recommends \
      autoconf \
      bison \
      build-essential \
      ca-certificates \
      curl \
      dumb-init \
      git \
      graphviz \
      libffi-dev \
      libgdbm-dev \
      libncursesw5-dev \
      libreadline6-dev \
      libssl-dev \
      libyaml-dev \
      locales \
      xz-utils \
      zlib1g-dev && \
    echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen && \
    update-locale LANG=en_US.UTF-8 \
                  LANGUAGE=en_US:en \
                  LC_ALL=en_US.UTF-8 && \
    apt-get clean && \
    useradd -m blog

RUN curl -O --fail https://nodejs.org/dist/v10.15.3/node-v10.15.3-linux-x64.tar.xz && \
    mkdir -p /opt/node && \
    tar -C /opt/node --strip-components=1 -xf node-v10.15.3-linux-x64.tar.xz && \
    rm node-v10.15.3-linux-x64.tar.xz

RUN git clone https://github.com/rbenv/ruby-build.git /usr/src/ruby-build && \
    cd /usr/src/ruby-build && \
    PREFIX=/opt/ruby ./install.sh && \
    ruby-build 2.6.3 /opt/ruby

USER blog
VOLUME [ "/home/blog/app" ]
WORKDIR /home/blog/app

ENV NPM_PACKAGES=/home/blog/npm \
    NODE_PATH=/home/blog/npm/lib/node_modules:/home/blog/yarn \
    GEM_HOME=/home/blog/gems \
    PATH=/home/blog/.cargo/bin:/home/blog/npm/bin:/home/blog/yarn/.bin:/home/blog/gems/bin:$PATH

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    cargo install svgbob_cli

COPY package.json yarn.lock /home/blog/app/

RUN echo "prefix=/home/blog/npm" > /home/blog/.npmrc && \
    npm install -g yarn && \
    yarn install --modules-folder /home/blog/yarn

COPY Gemfile Gemfile.lock /home/blog/app/

RUN bundle install --system

EXPOSE 4000
ENTRYPOINT [ "/usr/bin/dumb-init" ]
CMD [ "/bin/bash" ]
