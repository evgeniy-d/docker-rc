FROM mtro/docker-rc-base:latest

USER meteor

RUN set -x \
 && mkdir -p /source \
 && mkdir -p /server \
 && mkdir -p /app

COPY ./project /source

RUN set -x \
 && cd /source \
 && meteor build --server SERVER_NAME --directory /server \
 && mv /server/bundle/ /app/rc \
 && cd /app/rc/programs/server \
 && npm install \
 && npm cache clear --force \
 && chown -R rocketchat:rocketchat /app

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/rc

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads \
    SERVER_NAME=https://chat.oiler.ua

EXPOSE 3000:3000

CMD ["node", "main.js"]

