#!/bin/sh
# Generates the two files that depend on this deployment's environment, before
# nginx starts. Run automatically by the nginx image's entrypoint.
#
# ponytail: assembling a CSP by string concatenation in shell. It is here rather
# than in nginx.conf because connect-src needs the backend's ws:// origin, which
# envsubst cannot derive. If this grows much past the directives below, put a
# small program in front of the static files instead.
set -eu

API_BASE_URL="${API_BASE_URL:-http://localhost:6137}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-}"
# Reached from inside the network (container name in Compose), not from the
# browser — it is only used to proxy the manifest.
INTERNAL_API_BASE_URL="${INTERNAL_API_BASE_URL:-$API_BASE_URL}"

# scheme://host[:port] from a URL, dropping any path.
origin_of() {
    printf '%s' "$1" | sed -n 's|^\([a-zA-Z][a-zA-Z0-9+.-]*://[^/]*\).*$|\1|p'
}

# The same origin as a WebSocket URL.
socket_origin_of() {
    origin_of "$1" | sed -e 's|^http://|ws://|' -e 's|^https://|wss://|'
}

API_ORIGIN="$(origin_of "$API_BASE_URL")"
PUBLIC_ORIGIN="$(origin_of "$PUBLIC_BASE_URL")"
SOCKET_ORIGIN="$(socket_origin_of "$API_BASE_URL")"

# The browser talks to the backend directly, so its origins have to be allowed
# for API calls, media and the WebSocket.
BACKENDS="$API_ORIGIN"
if [ -n "$PUBLIC_ORIGIN" ] && [ "$PUBLIC_ORIGIN" != "$API_ORIGIN" ]; then
    BACKENDS="$BACKENDS $PUBLIC_ORIGIN"
fi

# Third-party sources specific features need:
#   cdn.jsdelivr.net          - Twemoji sprite sheets
#   open.spotify.com          - Spotify embeds in link previews
#   youtube-nocookie.com      - YouTube embeds in link previews
#   platform.x.com            - X (Twitter) embed script
#   platform.twitter.com      - X (Twitter) embed script (legacy)
#   syndication.twitter.com   - X (Twitter) embed data / iframe
#   cdn.syndication.twimg.com - X (Twitter) embed data
#   pbs.twimg.com             - X (Twitter) profile / media images
#   abs.twimg.com             - X (Twitter) assets
#   video.twimg.com           - X (Twitter) videos
TWEMOJI="https://cdn.jsdelivr.net"
SPOTIFY="https://open.spotify.com"
YOUTUBE="https://www.youtube-nocookie.com"
TWITTER_SCRIPT="https://platform.x.com https://platform.twitter.com https://syndication.twitter.com"
TWITTER_CONNECT="https://cdn.syndication.twimg.com https://syndication.twitter.com"
TWITTER_IMG="https://pbs.twimg.com https://abs.twimg.com https://cdn.syndication.twimg.com"
TWITTER_MEDIA="https://video.twimg.com"
TWITTER_FRAME="https://platform.twitter.com https://syndication.twitter.com"

# Each directive can be overridden wholesale from the environment; the defaults
# are what the app actually needs.
CSP="default-src ${CSP_DEFAULT_SRC:-'self'}"
CSP="$CSP; script-src ${CSP_SCRIPT_SRC:-'self' $TWITTER_SCRIPT}"
CSP="$CSP; style-src ${CSP_STYLE_SRC:-'self' 'unsafe-inline'}"
# Backend origins are appended unconditionally: the browser talks directly to
# the backend for API calls, media and the WebSocket, so omitting them breaks
# the app even when a deployment overrides individual CSP directives.
CSP="$CSP; img-src ${CSP_IMG_SRC:-'self' data: blob: $TWEMOJI $TWITTER_IMG} $BACKENDS"
CSP="$CSP; font-src ${CSP_FONT_SRC:-'self' data:}"
CSP="$CSP; connect-src ${CSP_CONNECT_SRC:-'self' $SPOTIFY $YOUTUBE $TWITTER_CONNECT} $BACKENDS $SOCKET_ORIGIN"
CSP="$CSP; media-src ${CSP_MEDIA_SRC:-'self' blob: $TWITTER_MEDIA} $BACKENDS"
CSP="$CSP; object-src ${CSP_OBJECT_SRC:-'none'}"
CSP="$CSP; frame-src ${CSP_FRAME_SRC:-'self' $SPOTIFY $YOUTUBE $TWITTER_FRAME}"
CSP="$CSP; base-uri ${CSP_BASE_URI:-'self'}"
CSP="$CSP; form-action ${CSP_FORM_ACTION:-'self'}"
CSP="$CSP; frame-ancestors ${CSP_FRAME_ANCESTORS:-'none'}"

mkdir -p /etc/nginx/ciel
printf 'add_header Content-Security-Policy "%s" always;\n' "$CSP" > /etc/nginx/ciel/csp.conf

# Written rather than templated because only the origin of the variable is
# wanted, and envsubst cannot strip a path.
cat > /etc/nginx/ciel/manifest-proxy.conf <<PROXY_CONF
proxy_pass $(origin_of "$INTERNAL_API_BASE_URL")/pwa/manifest.json;
proxy_set_header Host \$host;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
PROXY_CONF

# The API base URL cannot be baked into the bundle: the same image is deployed
# against different backends by changing this variable.
printf '{"apiBaseUrl":"%s"}\n' "$API_BASE_URL" > /usr/share/nginx/html/runtime-config.json

echo "ciel: runtime config written for ${API_BASE_URL}"
