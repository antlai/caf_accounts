# VERSION 0.1
# DOCKER-VERSION  1.7.0
# AUTHOR:         Antonio Lain <antlai@cafjs.com>
# DESCRIPTION:    Cloud Assistants accounts management
# TO_BUILD:       docker build -rm -t registry.cafjs.com:5000/root-accounts .
# TO_RUN:         docker run -p <app_port>:3000 -e DOCKER_APP_INTERNAL_PORT=3000 -e PORT0=<app_port> -e HOST=<host_ip> -e REDIS_PORT_6379_TCP_PORT=<redis_port>   registry.cafjs.com:5000/root-accounts
#                    or use docker-compose up -d (for local testing)
#                    or, if redis is already locally running:
#                  docker run -p <app_port>:3000 -e DOCKER_APP_INTERNAL_PORT=3000 -e PORT0=<app_port>  --link redis_name:redis registry.cafjs.com:5000/root-accounts


FROM node:0.10

EXPOSE 3000

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN  . /usr/src/app/http_proxy_build; npm install

CMD [ "npm", "start" ]
