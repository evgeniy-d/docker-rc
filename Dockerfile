FROM mtro/docker-rc-base:latest

USER root

COPY ./server_build /app/build/

RUN set -x \
 && cd /app/build/bundle/programs/server \
 && npm install --save \
 && npm cache clear --force

RUN chown -R rocketchat:rocketchat /app

USER rocketchat

WORKDIR /app/build/bundle

CMD ["node", "main.js"]
