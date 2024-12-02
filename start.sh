#!/usr/bin/env sh

cat <<EOF > /usr/share/nginx/html/js/config.js
window.config = {
  AUTH0_DOMAIN: "${AUTH0_DOMAIN}",
  AUTH0_CLIENT_ID: "${AUTH0_CLIENT_ID}",
  IAM_AUDIENCE: "${IAM_AUDIENCE}",
  NO_LOGOUT_TIMER: "${NO_LOGOUT_TIMER}"
};
EOF

exec nginx -g 'daemon off;'
