#!/bin/sh
# Postgres 첫 초기화(빈 volume)에서 한 번 돈다. Server 연동 테스트·1.96 local-stack.sh와 같은 형태:
# 한 database(proovy)에 제품 schema(proovy_server가 Flyway 실행)와 Brain schema(Brain bootstrap)를 둔다.
set -eu
psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres -v pw="$(cat /secrets/server-db-password)" <<'SQL'
CREATE ROLE proovy_server LOGIN PASSWORD :'pw';
CREATE DATABASE proovy;
-- 검증용 token 서명(issue-token의 hmac)에만 쓴다. 제품 database가 아니라 관리용 postgres database에 둔다.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d proovy <<'SQL'
CREATE EXTENSION IF NOT EXISTS pg_trgm;
GRANT USAGE, CREATE ON SCHEMA public TO proovy_server;
SQL
