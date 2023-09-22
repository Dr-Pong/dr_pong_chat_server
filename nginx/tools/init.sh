#!/bin/sh

if [ ! -e /etc/letsencrypt/live/drpong.co/fullchain.pem ];then
  echo "no certification."
  nginx -s quit
  nginx
  mkdir -p /var/www/certbot
  certbot --webroot certonly -w /var/www/certbot --agree-tos --email studionocheong@gmail.com -d chat.drpong.co --test-cert
  cp /drpong.conf /etc/nginx/conf.d/default.conf
  nginx -s quit
else
    cp /drpong.conf /etc/nginx/conf.d/default.conf
    certbot renew
fi
echo '0 18 1 * * certbot renew --renew-hook="sudo systemctl restart nginx"' | crontab - # --dry-run for test
nginx -g "daemon off;"