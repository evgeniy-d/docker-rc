FROM mtro/docker-rc-base:latest

USER root

COPY ./server_build /app/build/

RUN chown -R rocketchat /app

RUN set -x \
 && cd /app/build/bundle/programs/server \
 && npm install \
 && npm cache clear --force

USER rocketchat

WORKDIR /app/build/bundle

CMD ["node", "main.js"]
