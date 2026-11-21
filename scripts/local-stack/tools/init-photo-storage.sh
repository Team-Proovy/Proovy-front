#!/bin/sh
set -eu

KEY_PATH="${1:-/secrets/gcs-local-signer.pem}"
GCS_URL="${2:-http://gcs:4443}"
BUCKET="${3:-proovy-local-assets}"

case "$BUCKET" in
  ""|*/*|*..*|*[!a-z0-9._-]*)
    echo "Invalid LOCAL_GCS_BUCKET: $BUCKET" >&2
    exit 1
    ;;
esac

if [ ! -s "$KEY_PATH" ]; then
  umask 077
  tmp="${KEY_PATH}.tmp.$$"
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$tmp"
  # 컨테이너 UID 차이 없이 local stack 내부 secrets volume에서 server가 읽을 수 있게 한다.
  chmod 0444 "$tmp"
  mv "$tmp" "$KEY_PATH"
fi

attempt=0
until curl -fsS "${GCS_URL}/storage/v1/b" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Timed out waiting for GCS emulator at ${GCS_URL}" >&2
    exit 1
  fi
  sleep 1
done

status=$(curl -sS -o /dev/null -w '%{http_code}' "${GCS_URL}/storage/v1/b/${BUCKET}")
if [ "$status" = "404" ]; then
  curl -fsS -X POST -H "Content-Type: application/json" \
    -d "{\"name\":\"${BUCKET}\"}" \
    "${GCS_URL}/storage/v1/b" >/dev/null
elif [ "$status" != "200" ]; then
  echo "Unexpected HTTP status ${status} while verifying bucket ${BUCKET}" >&2
  exit 1
fi
