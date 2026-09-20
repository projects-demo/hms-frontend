#!/bin/sh
set -e

# Generate the real config.js from the API_BASE_URL env var Cloud Run provides,
# substituting into the built static files at container startup.
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
sed "s|__API_BASE_URL__|${API_BASE_URL}|g" /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Cloud Run injects PORT - nginx must listen on it.
PORT="${PORT:-8080}"
sed -i "s|listen 8080;|listen ${PORT};|g" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'