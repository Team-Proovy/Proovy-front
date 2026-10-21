#!/usr/bin/env bash
# 사용: suite.sh <label>  — cut reset·stall, 세 흐름 N회(흐름마다 새 사용자: Free 잔액 한도). 결과는 runs/<label>/
set -u
SP=/tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-99/8d058a29-8275-4115-b200-37b1dd6b9a6c/scratchpad
STACK=/home/chowon442/coding-workspace/.worktree/Proovy-front/worktree-task-1.99/scripts/local-stack
OUT=$SP/runs/$1
mkdir -p "$OUT"
cd "$SP/harness"
until curl -sf -o /dev/null http://localhost:5199/; do sleep 2; done
token() { (cd "$STACK" && docker compose exec -T postgres issue-token 2>/dev/null | sed -n 2p); }
export COMPOSE_DIR=$STACK BASE=http://localhost:5199
for mode in ${CUT_MODES-reset stall}; do
  OUT=$OUT TOKEN=$(token) MODE=$mode WAIT_MS=${CUT_WAIT_MS:-80000} node cut.mjs 2>&1 | tee -a "$OUT/cut.out"
done
for flow in A C B; do
  : > "$SP/proxy-trace.log"
  OUT=$OUT/$flow TOKEN=$(token) N=${N:-5} FLOWS=$flow HOLD_MS=3000 GAP_MS=3000 CHANNEL=chromium node repro.mjs > "$OUT/repro-$flow.out" 2>&1
  cp "$SP/proxy-trace.log" "$OUT/$flow/proxy-trace.log"
  tail -1 "$OUT/repro-$flow.out"
done
