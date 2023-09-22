FROM nginx:1.25.1-alpine

RUN apk add --update python3 py3-pip certbot dumb-init

COPY conf/certbot.conf /etc/nginx/conf.d/default.conf
COPY conf/drpong.conf /drpong.conf
COPY tools/init.sh ./init.sh
RUN chmod +x ./init.sh

ENTRYPOINT ["/usr/bin/dumb-init","--"]
CMD ["sh", "./init.sh"]