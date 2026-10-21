#!/usr/bin/env bash
# 실제 로컬 Server·Brain에 Front를 연결하는 로컬 stack (task 1.96).
# 일반 대화 확인은 OS 무관 Docker stack(같은 디렉터리 compose.yaml, task 1.98)을 쓴다. 이 스크립트는 Brain testkit
# scenario·hold 재현용 Linux 전용 경로로 남긴다. 두 stack을 동시에 띄우지 않는다.
#
# 격리 Postgres·Redis 컨테이너 → Server(local profile, bootJar) → proovy-brain testkit supervisor(실제 Brain API·graph·
# store·SSE, 모델은 offline seat) → role 경계 적용 → 검증용 사용자·access token 발급. Front dev server는 따로 띄운다:
#   DEV_API_PROXY_TARGET=http://127.0.0.1:$SERVER_PORT pnpm run dev --port 5196
# 운영 API·운영 DB·GCS·OAuth를 쓰지 않는다. 모든 token·password는 실행마다 새로 만드는 개발 전용 값이다.
#
# 사용:
#   SERVER_DIR=<Proovy-server 소스(./gradlew bootJar 완료)> BRAIN_DIR=<uv 환경이 준비된 proovy-brain checkout> \
#     scripts/local-stack/local-stack.sh up
#   scripts/local-stack/local-stack.sh token     # 새 검증용 사용자 + access token (STATE_DIR/user-<id>.token)
#   scripts/local-stack/local-stack.sh status
#   scripts/local-stack/local-stack.sh down      # 컨테이너·프로세스·STATE_DIR 정리
#
# 환경변수 (기본값) — 다른 세션의 고정 자원(proovy-postgres:15432·proovy-redis:6379)과 겹치지 않게 고른다
#   SUFFIX (t196, [a-z0-9_]만)  PG_PORT (29632)  REDIS_PORT (29679)  SERVER_PORT (8080)
#   SUPERVISOR_PORT (29681)  BRAIN_API_PORT (29680)
#   STATE_DIR (${TMPDIR:-/tmp}/proovy-front-local-stack-$SUFFIX)   token·pid·로그·env
#   RATE_LIMIT_MAX_REQUESTS (20)   Server 요청 한도(1분). 한도 안내를 재현하려면 낮춘다
# up이 쓴 값은 STATE_DIR/env에 남고 token·status·down은 그 값을 읽는다. SUFFIX나 STATE_DIR를 바꿨다면
# 다른 명령에도 같은 SUFFIX(또는 STATE_DIR)를 준다.
set -Eeuo pipefail  # -E: up의 ERR trap이 함수 안 실패에도 걸린다

SUFFIX="${SUFFIX:-t196}"
STATE_DIR="${STATE_DIR:-${TMPDIR:-/tmp}/proovy-front-local-stack-$SUFFIX}"
if [[ "${1:-}" != up && -f "$STATE_DIR/env" ]]; then
  # shellcheck source=/dev/null
  source "$STATE_DIR/env"
fi
if [[ ! "$SUFFIX" =~ ^[a-z0-9_]+$ ]]; then
  echo "[local-stack] SUFFIX must match ^[a-z0-9_]+$ (container·database 이름에 쓴다): $SUFFIX" >&2
  exit 2
fi
PG_CONTAINER="proovy-postgres-$SUFFIX"
REDIS_CONTAINER="proovy-redis-$SUFFIX"
PG_PORT="${PG_PORT:-29632}"
REDIS_PORT="${REDIS_PORT:-29679}"
SERVER_PORT="${SERVER_PORT:-8080}"
SUPERVISOR_PORT="${SUPERVISOR_PORT:-29681}"
BRAIN_API_PORT="${BRAIN_API_PORT:-29680}"
RATE_LIMIT_MAX_REQUESTS="${RATE_LIMIT_MAX_REQUESTS:-20}"
PG_USER="${SUFFIX}_admin"
PG_PASSWORD="${SUFFIX}-admin-dev-only"
DB_NAME="proovy_$SUFFIX"
SERVER_ROLE=proovy_server
SERVER_DB_PASSWORD="${SUFFIX}-server-dev-only"
SEOUL_NOW="(now() AT TIME ZONE 'Asia/Seoul')"

log() { echo "[local-stack] $*"; }

wait_for() {  # wait_for <what> <seconds> <command...>
  local what=$1 seconds=$2
  shift 2
  for _ in $(seq 1 "$seconds"); do
    "$@" >/dev/null 2>&1 && return 0
    sleep 1
  done
  log "$what did not become ready in ${seconds}s" >&2
  return 1
}

psql_admin() {  # psql_admin <database> [psql 옵션...] — stdin SQL
  local database=$1
  shift
  docker exec -i "$PG_CONTAINER" psql -q -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$database" "$@"
}

random_hex() { od -An -N"$1" -tx1 /dev/urandom | tr -d ' \n'; }

state() { cat "$STATE_DIR/$1"; }

port_in_use() { ss -Hltn "sport = :$1" | grep -q .; }

# wait_server <seconds> — Server가 기동을 마칠 때까지. 프로세스가 먼저 죽으면 바로 실패한다
wait_server() {
  for _ in $(seq 1 "$1"); do
    grep -q 'Started .* in' "$STATE_DIR/server.log" && return 0
    if ! kill -0 "$(state server.pid)" 2>/dev/null; then
      log "server exited during startup — $STATE_DIR/server.log:" >&2
      tail -n 20 "$STATE_DIR/server.log" >&2
      return 1
    fi
    sleep 1
  done
  log "server did not become ready in ${1}s" >&2
  return 1
}

up() {
  : "${SERVER_DIR:?SERVER_DIR must point at a Proovy-server source tree with build/libs/app.jar}"
  local server_jar="$SERVER_DIR/build/libs/app.jar"
  local role_boundary="$SERVER_DIR/src/main/resources/db/provisioning/role-boundary.sql"
  : "${BRAIN_DIR:?BRAIN_DIR must point at a proovy-brain checkout (uv sync --locked)}"
  if [[ -e "$STATE_DIR" ]]; then
    log "$STATE_DIR already exists — run 'down' first" >&2
    exit 1
  fi
  # 자원을 만들기 전에 입력·포트를 확인한다
  local missing port
  for missing in "$server_jar" "$role_boundary"; do
    [[ -f "$missing" ]] || { log "not found: $missing" >&2; exit 1; }
  done
  for port in "$PG_PORT" "$REDIS_PORT" "$SERVER_PORT" "$SUPERVISOR_PORT" "$BRAIN_API_PORT"; do
    if port_in_use "$port"; then
      log "port $port is already in use — choose another (see header)" >&2
      exit 1
    fi
  done
  if docker ps -a --format '{{.Names}}' | grep -qx -e "$PG_CONTAINER" -e "$REDIS_CONTAINER"; then
    log "container $PG_CONTAINER or $REDIS_CONTAINER already exists — run 'down' first" >&2
    exit 1
  fi
  mkdir -p "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  # 중간에 실패하면 만든 자원을 모두 정리하고 로그를 남긴다(정리 전에 로그를 보여 준다)
  trap 'up_failed' ERR
  cat >"$STATE_DIR/env" <<ENV
SUFFIX=$SUFFIX
PG_PORT=$PG_PORT
REDIS_PORT=$REDIS_PORT
SERVER_PORT=$SERVER_PORT
SUPERVISOR_PORT=$SUPERVISOR_PORT
BRAIN_API_PORT=$BRAIN_API_PORT
ENV
  random_hex 32 >"$STATE_DIR/jwt-secret"
  echo "local-shared-$(random_hex 12)" >"$STATE_DIR/shared-token"
  echo "local-control-$(random_hex 12)" >"$STATE_DIR/control-token"

  log "postgres $PG_CONTAINER 127.0.0.1:$PG_PORT, redis $REDIS_CONTAINER 127.0.0.1:$REDIS_PORT (tmpfs)"
  docker run -d --name "$PG_CONTAINER" --tmpfs /var/lib/postgresql/data:rw,size=600m --memory 384m \
    -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PASSWORD" -e POSTGRES_DB=postgres \
    -p "127.0.0.1:$PG_PORT:5432" postgres:15-alpine >/dev/null
  docker run -d --name "$REDIS_CONTAINER" --memory 64m -p "127.0.0.1:$REDIS_PORT:6379" redis:7-alpine >/dev/null
  # 초기화용 임시 서버는 unix socket만 열어 둔다 — TCP로 확인해야 초기화가 끝난 서버다
  wait_for postgres 60 docker exec "$PG_CONTAINER" pg_isready -h 127.0.0.1 -U "$PG_USER" -d postgres

  # Server 연동 테스트(ServerBrainIntegrationTest)와 같은 형태: 한 database에 제품 baseline(proovy_server가 Flyway 실행)과
  # Brain schema(Brain bootstrap)를 두고 role 경계를 적용한다.
  psql_admin postgres <<SQL
CREATE ROLE $SERVER_ROLE LOGIN PASSWORD '$SERVER_DB_PASSWORD';
CREATE DATABASE $DB_NAME;
SQL
  psql_admin "$DB_NAME" <<SQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;
GRANT USAGE, CREATE ON SCHEMA public TO $SERVER_ROLE;
SQL

  log "brain testkit supervisor 127.0.0.1:$SUPERVISOR_PORT (api $BRAIN_API_PORT), brain=$(git -C "$BRAIN_DIR" rev-parse HEAD)"
  PG_USER="$PG_USER" PG_PASSWORD="$PG_PASSWORD" PG_PORT="$PG_PORT" CONTROL_TOKEN="$(state control-token)" \
    SHARED_TOKEN="$(state shared-token)" SUPERVISOR_PORT="$SUPERVISOR_PORT" BRAIN_API_PORT="$BRAIN_API_PORT" \
    setsid bash -c '
      cd "$0"
      exec env -i PATH="$PATH" HOME="$HOME" \
        TESTKIT_PG_ADMIN_URL="postgresql://$PG_USER:$PG_PASSWORD@127.0.0.1:$PG_PORT/postgres" \
        TESTKIT_CONTROL_TOKEN="$CONTROL_TOKEN" TESTKIT_SHARED_TOKEN="$SHARED_TOKEN" \
        uv run --locked python -m testkit.integration supervise --port "$SUPERVISOR_PORT" --api-port "$BRAIN_API_PORT"
    ' "$BRAIN_DIR" >"$STATE_DIR/supervisor.log" 2>&1 &
  echo $! >"$STATE_DIR/supervisor.pid"   # setsid → 프로세스 그룹 ID

  log "server 127.0.0.1:$SERVER_PORT ($server_jar)"
  # GCS_ENDPOINT는 닫힌 loopback 주소다 — 텍스트 경로는 GCS를 쓰지 않고, 실수로 호출해도 실제 GCS로 나가지 않는다.
  # OAuth·OpenRouter 값은 bean 기동용 placeholder다(로컬 검증은 발급한 access token으로 로그인한다).
  setsid env -i PATH="$PATH" HOME="$HOME" \
    SPRING_PROFILES_ACTIVE=local SERVER_ADDRESS=127.0.0.1 SERVER_PORT="$SERVER_PORT" \
    DB_HOST=127.0.0.1 DB_PORT="$PG_PORT" DB_NAME="$DB_NAME" DB_USERNAME="$SERVER_ROLE" DB_PASSWORD="$SERVER_DB_PASSWORD" \
    REDIS_HOST=127.0.0.1 REDIS_PORT="$REDIS_PORT" \
    JWT_SECRET="$(state jwt-secret)" \
    KAKAO_CLIENT_ID=local-placeholder KAKAO_CLIENT_SECRET=local-placeholder \
    NAVER_CLIENT_ID=local-placeholder NAVER_CLIENT_SECRET=local-placeholder \
    GCS_PROJECT_ID=local-placeholder GCS_ENDPOINT=http://127.0.0.1:9 \
    OPENROUTER_API_KEY=local-placeholder \
    BRAIN_BASE_URL="http://127.0.0.1:$BRAIN_API_PORT" BRAIN_AUTH_MODE=shared-token BRAIN_SHARED_TOKEN="$(state shared-token)" \
    RUN_COORDINATOR_ENABLED=true PROOVY_RUN_ADMISSION_RATE_LIMIT_MAX_REQUESTS="$RATE_LIMIT_MAX_REQUESTS" \
    SPRING_JPA_SHOW_SQL=false \
    java -Xmx384m -XX:+UseSerialGC -jar "$server_jar" >"$STATE_DIR/server.log" 2>&1 &
  echo $! >"$STATE_DIR/server.pid"

  local control=(-H "X-Testkit-Control-Token: $(state control-token)")
  wait_for supervisor 60 curl -sf "${control[@]}" "http://127.0.0.1:$SUPERVISOR_PORT/brain/status"
  # Server Flyway가 제품 baseline을 끝낸 뒤 Brain schema를 같은 database에 만든다
  wait_server 180
  # supervisor의 child readiness 대기는 60초 고정이다 — Server run-local.sh처럼 import·bytecode를 미리 데운다
  log "warming brain imports"
  (cd "$BRAIN_DIR" && env -i PATH="$PATH" HOME="$HOME" uv run --locked python -c \
    'import proovy_brain.apps.api, proovy_brain.features.solve_execution.text_run, testkit.integration.app')
  log "starting brain child on $DB_NAME"
  curl -sS --fail-with-body -m 120 -X POST "${control[@]}" -H "Content-Type: application/json" \
    -d "{\"database\": \"$DB_NAME\", \"lease_ttl_seconds\": 5}" \
    "http://127.0.0.1:$SUPERVISOR_PORT/brain/start" >"$STATE_DIR/brain-start.json"
  psql_admin "$DB_NAME" <"$role_boundary"
  trap - ERR
  # Server는 127.0.0.1에만 bind한다(외부 interface 비노출). proxy target도 IPv4로 적어 localhost→::1 해석을 피한다
  log "ready — front: DEV_API_PROXY_TARGET=http://127.0.0.1:$SERVER_PORT pnpm run dev --port 5196 (브라우저는 http://localhost:5196)"
  log "token: $0 token"
}

up_failed() {
  trap - ERR
  log "up failed — logs:" >&2
  local file
  for file in "$STATE_DIR"/*.log "$STATE_DIR"/brain-start.json; do
    [[ -f "$file" ]] && { echo "--- $file" >&2; tail -n 20 "$file" >&2; }
  done
  log "cleaning up partial stack" >&2
  down
  exit 1
}

# token — 검증용 사용자(일일 크레딧 100)를 만들고 Server JwtTokenProvider와 같은 형식(HS256, sub=userId, type=access)의
# access token을 발급한다(1시간 유효, refresh 없음 — 만료되면 token을 다시 발급한다). Server에는 개발용 로그인이 없고,
# 로컬 OAuth는 쓰지 않는다. 시각은 Server(hibernate.jdbc.time_zone Asia/Seoul)와 같은 기준으로 넣는다.
token() {
  local key id
  key="local-$(random_hex 8)"
  id=$(psql_admin "$DB_NAME" -tA <<SQL
INSERT INTO users (nickname, provider, provider_user_id, email, created_at, updated_at)
VALUES ('local-$SUFFIX', 'KAKAO', '$key', '$key@example.test', $SEOUL_NOW, $SEOUL_NOW) RETURNING user_id;
SQL
  )
  psql_admin "$DB_NAME" <<SQL
INSERT INTO credit_balance (user_id, daily_free_credit, daily_free_limit, daily_expires_at, free_credit, paid_credit,
                            created_at, updated_at)
VALUES ($id, 100, 100, $SEOUL_NOW + interval '1 day', 0, 0, $SEOUL_NOW, $SEOUL_NOW);
SQL
  JWT_SECRET="$(state jwt-secret)" USER_ID="$id" python3 -c '
import base64, hashlib, hmac, json, os, time
b64 = lambda raw: base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
now = int(time.time())
head = b64(json.dumps({"alg": "HS256"}).encode())
body = b64(json.dumps({"sub": os.environ["USER_ID"], "type": "access", "iat": now, "exp": now + 3600}).encode())
sig = hmac.new(os.environ["JWT_SECRET"].encode(), f"{head}.{body}".encode(), hashlib.sha256).digest()
print(f"{head}.{body}.{b64(sig)}")
' >"$STATE_DIR/user-$id.token"
  log "user $id → $STATE_DIR/user-$id.token"
}

status() {
  docker ps --filter "name=-$SUFFIX\$" --format '{{.Names}} {{.Status}}'
  for name in server supervisor; do
    if [[ -f "$STATE_DIR/$name.pid" ]] && kill -0 "$(state "$name.pid")" 2>/dev/null; then
      log "$name pid $(state "$name.pid") running"
    else
      log "$name not running"
    fi
  done
  if [[ -f "$STATE_DIR/control-token" ]]; then
    curl -s -H "X-Testkit-Control-Token: $(state control-token)" "http://127.0.0.1:$SUPERVISOR_PORT/brain/status" || true
    echo
  fi
}

down() {
  if [[ -f "$STATE_DIR/control-token" ]]; then
    curl -s -m 20 -X POST -H "X-Testkit-Control-Token: $(state control-token)" -H "Content-Type: application/json" \
      -d '{"signal": "kill"}' "http://127.0.0.1:$SUPERVISOR_PORT/brain/stop" >/dev/null 2>&1 || true
  fi
  for name in server supervisor; do
    if [[ -f "$STATE_DIR/$name.pid" ]]; then
      kill -- "-$(state "$name.pid")" 2>/dev/null || kill "$(state "$name.pid")" 2>/dev/null || true
    fi
  done
  pkill -f "testkit.integration serve --host 127.0.0.1 --port $BRAIN_API_PORT( |\$)" 2>/dev/null || true
  docker rm -f "$PG_CONTAINER" "$REDIS_CONTAINER" >/dev/null 2>&1 || true
  rm -rf "${STATE_DIR:?}"
  log "cleaned up"
}

case "${1:-}" in
  up) up ;;
  token) token ;;
  status) status ;;
  down) down ;;
  *)
    echo "usage: $0 up|token|status|down" >&2
    exit 2
    ;;
esac
