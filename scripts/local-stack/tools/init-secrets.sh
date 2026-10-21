#!/bin/sh
# 로컬 stack의 개발 전용 secret(JWT·Brain shared token·DB password)을 /secrets volume에 만든다.
# 이미 있으면 그대로 둔다 — 같은 volume의 DB가 그 password로 만들어져 있다. `docker compose down -v`가 지운다.
set -eu
umask 022
for name in jwt-secret shared-token pg-admin-password server-db-password brain-migration-password \
  brain-runtime-password; do
  file="/secrets/$name"
  if [ ! -s "$file" ]; then
    # hex만 쓴다 — DB URL에 그대로 넣어도 escape가 필요 없다
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' >"$file"
  fi
  # Server(app)·Brain(10001)·Postgres(70)가 서로 다른 uid로 읽는다. volume은 이 stack 컨테이너에만 붙는다
  chmod 444 "$file"
done
echo "[local-stack] secrets ready"
