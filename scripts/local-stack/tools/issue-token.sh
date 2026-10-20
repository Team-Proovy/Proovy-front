#!/bin/sh
# 검증용 사용자(일일 크레딧 100)를 만들고 Server JwtTokenProvider와 같은 형식(HS256, sub=userId, type=access)의
# access token을 발급한다(1시간 유효, refresh 없음 — 만료되면 다시 발급한다). Server에는 개발용 로그인이 없고
# 로컬 OAuth는 쓰지 않는다. postgres 컨테이너 안에서 돌아 OS·host 도구와 무관하다:
#   docker compose exec postgres issue-token
# 시각은 Server(hibernate.jdbc.time_zone Asia/Seoul)와 같은 기준으로 넣는다.
set -eu
q() { psql -qtAX -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$@"; }

key="local-$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')"
id=$(q -d proovy -v key="$key" <<'SQL'
INSERT INTO users (nickname, provider, provider_user_id, email, created_at, updated_at)
VALUES ('local', 'KAKAO', :'key', :'key' || '@example.test',
        now() AT TIME ZONE 'Asia/Seoul', now() AT TIME ZONE 'Asia/Seoul')
RETURNING user_id;
SQL
)
q -d proovy -v id="$id" <<'SQL'
INSERT INTO credit_balance (user_id, daily_free_credit, daily_free_limit, daily_expires_at, free_credit, paid_credit,
                            created_at, updated_at)
VALUES (:id, 100, 100, (now() AT TIME ZONE 'Asia/Seoul') + interval '1 day', 0, 0,
        now() AT TIME ZONE 'Asia/Seoul', now() AT TIME ZONE 'Asia/Seoul');
SQL
token=$(q -d postgres -v id="$id" -v secret="$(cat /secrets/jwt-secret)" <<'SQL'
CREATE FUNCTION pg_temp.b64url(bytea) RETURNS text LANGUAGE sql AS
  $$ SELECT rtrim(translate(replace(encode($1, 'base64'), E'\n', ''), '+/', '-_'), '=') $$;
WITH claims AS (SELECT extract(epoch FROM now())::bigint AS iat),
     signing AS (
       SELECT pg_temp.b64url(convert_to('{"alg":"HS256"}', 'UTF8')) || '.' ||
              pg_temp.b64url(convert_to(json_build_object('sub', :'id', 'type', 'access',
                                                          'iat', iat, 'exp', iat + 3600)::text, 'UTF8')) AS input
       FROM claims)
SELECT input || '.' || pg_temp.b64url(hmac(input, :'secret', 'sha256')) FROM signing;
SQL
)

cat <<EOF
[local-stack] user $id — access token (1시간 유효):
$token

브라우저(http://localhost:<Front 포트>) 개발자 도구 Console에 붙여 넣고 실행한다:
localStorage.setItem("accessToken", "$token"); localStorage.setItem("auth-storage", JSON.stringify({state: {user: {userId: 0, nickname: "local"}, isAuthenticated: true}, version: 0})); location.reload();
EOF
