#!/usr/bin/env bash
# 흐름마다 새 사용자 token으로 repro.mjs를 돌린다(Free 잔액: 한 사용자로 10질문을 넘기면 RUN4021).
# 사용(저장소 루트): scripts/sse-lifecycle/run-flows.sh <결과 디렉터리> [흐름 A,C,B,T] [N]
#   env: COMPOSE_PROJECT(기본 proovy-local, 2.18 맥북은 proovy-stack) BASE BROWSER_CHANNEL GAP_MS HOLD_MS HAR NETLOG HEADLESS
#        PLAYWRIGHT_MODULE PROXY_TRACE_LOG(vite.trace.config.ts와 같은 파일이면 흐름 구간만 잘라 복사한다. 원본은 지우지 않는다)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
STACK=$HERE/../local-stack
OUT=${1:?결과 디렉터리}
FLOWS=${2:-A,C,B}
N=${3:-5}
PROJECT=${COMPOSE_PROJECT:-proovy-local}
# compose 명령은 STACK에서 돌므로 결과 경로를 먼저 절대 경로로 바꾼다
mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)
for flow in ${FLOWS//,/ }; do
  mkdir -p "$OUT/$flow"
  n=$N
  # T는 반복마다 2질문(실패 run + 다음 질문)이다. 첫 질문 1 + 2n <= 10
  if [ "$flow" = T ] && [ "$n" -gt 4 ]; then
    echo "T: N=$n은 Free 잔액 한도(10질문)를 넘으므로 4로 줄인다"
    n=4
  fi
  trace_from=0
  [ -n "${PROXY_TRACE_LOG:-}" ] && [ -f "$PROXY_TRACE_LOG" ] && trace_from=$(wc -c < "$PROXY_TRACE_LOG")
  since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  # token은 화면·로그에 내지 않는다
  TOKEN=$(cd "$STACK" && docker compose -p "$PROJECT" exec -T postgres issue-token 2>/dev/null | sed -n 2p) || TOKEN=
  if [ -z "$TOKEN" ]; then
    echo "$flow: token 발급 실패(COMPOSE_PROJECT=$PROJECT stack이 떠 있는지 확인). 중단한다" >&2
    exit 1
  fi
  OUT=$OUT/$flow TOKEN=$TOKEN COMPOSE_DIR=$STACK COMPOSE_PROJECT=$PROJECT N=$n FLOWS=$flow \
    node "$HERE/repro.mjs" > "$OUT/repro-$flow.out" 2>&1 || true
  if [ -n "${PROXY_TRACE_LOG:-}" ]; then
    tail -c +$((trace_from + 1)) "$PROXY_TRACE_LOG" > "$OUT/$flow/proxy-trace.log" 2>/dev/null || true
  fi
  (cd "$STACK" && docker compose -p "$PROJECT" logs --since "$since" server > "$OUT/$flow/server.log" 2>&1) || true
  echo "$flow: $(head -1 "$OUT/$flow/summary.txt" 2>/dev/null || echo "summary 없음 — $OUT/repro-$flow.out 확인")"
done
