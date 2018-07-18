FROM mtro/docker-rc-base:latest

USER root

COPY ./. /app/source/

RUN chown -R meteor /app

USER meteor

RUN set -x \
 && cd /app/source \
 && meteor --version \
 && export PYTHON=/usr/bin/python2.7 \
 && meteor npm i && meteor npm i --only=dev \
 && meteor build --directory /app/build/ \
 && cd /app \
 && rm -rf /app/source \
 && mv /app/build/bundle /app/server/rc \
 && cd /app/server/rc/programs/server \
 && npm install \
 && npm cache clear --force \

USER root

chown -R rocketchat:rocketchat /app

USER rocketchat

WORKDIR /app/server/rc


