// Placeholder file, never used as-is. The container's entrypoint script
// replaces __API_BASE_URL__ with the real value at startup and writes the
// result to /usr/share/nginx/html/config.js (or wherever the static root is),
// which index.html loads before the app bundle. This is what lets one Docker
// image be deployed to any environment just by changing an env var - no rebuild.
window.__HMS_CONFIG__ = {
  API_BASE_URL: "__API_BASE_URL__"
};