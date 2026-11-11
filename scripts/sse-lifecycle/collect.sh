#!/usr/bin/env bash
# 사람이 화면 있는 브라우저(평소 Chrome·iPad Safari)로 재현하는 동안 연결 수를 1초마다 기록한다(macOS·Linux).
# 사용(저장소 루트): scripts/sse-lifecycle/collect.sh <결과 디렉터리>   끝낼 때 Ctrl-C
#   env: VITE_PORT(기본 5173) UPSTREAM_PORT(8080) COMPOSE_PROJECT(proovy-local) PROXY_TRACE_LOG
# 기록: samples.tsv(browserToVite ESTABLISHED·그 밖 상태, viteToServer, dockerSide, Server 컨테이너 ESTABLISHED),
#       끝낼 때 server.log·compose-ps.txt·sockets-end.txt, proxy-trace.log(설정했으면)
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
STACK=$HERE/../local-stack
OUT=${1:?결과 디렉터리}
VP=${VITE_PORT:-5173}
UP=${UPSTREAM_PORT:-8080}
PROJECT=${COMPOSE_PROJECT:-proovy-local}
mkdir -p "$OUT"
[ -n "${PROXY_TRACE_LOG:-}" ] && : > "$PROXY_TRACE_LOG"
# "local peer state" 줄
sockets() {
  if [ "$(uname)" = Darwin ]; then
    lsof -nP -iTCP 2>/dev/null | sed -nE 's/.* ([^ ]+)->([^ ]+) \(([A-Z_0-9]+)\)$/\1 \2 \3/p'
  else
    ss -Htan 2>/dev/null | awk '{print $4, $5, $1}'
  fi
}
finish() {
  [ -n "${PROXY_TRACE_LOG:-}" ] && cp "$PROXY_TRACE_LOG" "$OUT/proxy-trace.log"
  (cd "$STACK" && docker compose -p "$PROJECT" ps -a > "$OUT/compose-ps.txt" 2>&1
   docker compose -p "$PROJECT" logs --since 60m server > "$OUT/server.log" 2>&1)
  sockets | grep -E ":($VP|$UP) " > "$OUT/sockets-end.txt"
  echo "저장됨: $OUT"
  exit 0
}
trap finish INT TERM
printf "time\tbrowserToVite\tbrowserToViteOther\tviteToServer\tdockerSide\tserverEstablished\n" > "$OUT/samples.tsv"
echo "기록 중: $OUT (Ctrl-C로 끝냄)"
while true; do
  S=$(sockets)
  bv=$(echo "$S" | awk -v p=":$VP" 'index($1,p)==length($1)-length(p)+1 && ($3=="ESTABLISHED"||$3=="ESTAB")' | wc -l)
  bvo=$(echo "$S" | awk -v p=":$VP" 'index($1,p)==length($1)-length(p)+1 && $3!="ESTABLISHED" && $3!="ESTAB" && $3!="LISTEN"' | wc -l)
  vs=$(echo "$S" | awk -v p=":$UP" 'index($2,p)==length($2)-length(p)+1 && ($3=="ESTABLISHED"||$3=="ESTAB")' | wc -l)
  ds=$(echo "$S" | awk -v p=":$UP" 'index($1,p)==length($1)-length(p)+1 && ($3=="ESTABLISHED"||$3=="ESTAB")' | wc -l)
  sc=$(docker exec "$PROJECT-server-1" sh -c "cat /proc/net/tcp /proc/net/tcp6" 2>/dev/null | awk '$2 ~ /:1F90$/ && $4 == "01"' | wc -l)
  printf "%s\t%s\t%s\t%s\t%s\t%s\n" "$(date +%H:%M:%S)" $bv $bvo $vs $ds $sc >> "$OUT/samples.tsv"
  sleep 1
done
