#!/usr/bin/env bash
# 흐름마다 새 사용자 token으로 repro.mjs를 돌린다(Free 잔액: 한 사용자로 10질문을 넘기면 RUN4021).
# 사용(저장소 루트): scripts/sse-lifecycle/run-flows.sh <결과 디렉터리> [흐름 A,C,B,T] [N]
#   env: COMPOSE_PROJECT(기본 proovy-local, 2.18 맥북은 proovy-stack) BASE BROWSER_CHANNEL GAP_MS HOLD_MS HAR NETLOG HEADLESS
#        PLAYWRIGHT_MODULE PROXY_TRACE_LOG(vite.trace.config.ts와 같은 파일이면 흐름별로 잘라 복사한다)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
STACK=$HERE/../local-stack
OUT=${1:?결과 디렉터리}
FLOWS=${2:-A,C,B}
N=${3:-5}
PROJECT=${COMPOSE_PROJECT:-proovy-local}
mkdir -p "$OUT"
for flow in ${FLOWS//,/ }; do
  [ -n "${PROXY_TRACE_LOG:-}" ] && : > "$PROXY_TRACE_LOG"
  # token은 화면·로그에 내지 않는다
  TOKEN=$(cd "$STACK" && docker compose -p "$PROJECT" exec -T postgres issue-token 2>/dev/null | sed -n 2p)
  OUT=$OUT/$flow TOKEN=$TOKEN COMPOSE_DIR=$STACK COMPOSE_PROJECT=$PROJECT N=$N FLOWS=$flow \
    node "$HERE/repro.mjs" > "$OUT/repro-$flow.out" 2>&1 || true
  [ -n "${PROXY_TRACE_LOG:-}" ] && cp "$PROXY_TRACE_LOG" "$OUT/$flow/proxy-trace.log"
  (cd "$STACK" && docker compose -p "$PROJECT" logs --since 30m server > "$OUT/$flow/server.log" 2>&1) || true
  echo "$flow: $(head -1 "$OUT/$flow/summary.txt" 2>/dev/null || echo 'summary 없음')"
done
