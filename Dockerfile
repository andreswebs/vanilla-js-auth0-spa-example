FROM ghcr.io/nginxinc/nginx-unprivileged:1.27-alpine3.20-slim
ARG TZ="UTC"
ENV TZ="${TZ}"

USER root

COPY --chown=nginx public/ /usr/share/nginx/html
COPY --chown=nginx default.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx start.sh /var/opt/start.sh

RUN chmod u+x /var/opt/start.sh

USER nginx

EXPOSE 3000

CMD [ "/var/opt/start.sh" ]
