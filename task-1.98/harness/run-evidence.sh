#!/usr/bin/env bash
set -uo pipefail
W=/home/chowon442/coding-workspace/.worktree/Proovy-front/worktree-task-1.98
cd $W/scripts/local-stack
printf 'BRAIN_DIR=%s\nSERVER_PORT=28098\n' /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/brain-89520f6 > .env
{ echo "$ git rev-parse HEAD"; git rev-parse HEAD; echo "$ cat .env"; cat .env; docker compose version; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/00-env.txt
{ echo "$ docker compose build"; time flock /tmp/proovy-1.98-docker.lock docker compose build; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/01-build.txt 2>&1
{ echo "$ docker compose up -d --wait"; time docker compose up -d --wait; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/02-up.txt 2>&1
{ echo "$ docker compose ps -a"; docker compose ps -a; echo; echo "$ docker compose ps --format '{{.Service}}: {{.Publishers}}'"; docker compose ps --format '{{.Service}}: {{.Publishers}}'; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/03-ps.txt 2>&1
{ echo "$ docker compose logs secrets brain-migrate provision"; docker compose logs --no-color secrets brain-migrate provision; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/04-init-logs.txt 2>&1
cd $W
VITE_KAKAO_CLIENT_ID=local-placeholder VITE_KAKAO_REDIRECT_URI=http://localhost:5198/oauth/kakao/callback VITE_NAVER_CLIENT_ID=local-placeholder VITE_NAVER_REDIRECT_URI=http://localhost:5198/oauth/naver/callback DEV_API_PROXY_TARGET=http://127.0.0.1:28098 setsid npx -y pnpm@10 run dev --port 5198 --strictPort > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/dev.log 2>&1 &
for i in $(seq 60); do curl -sf -o /dev/null http://localhost:5198/ && break; sleep 1; done
curl -s -o /dev/null http://localhost:5198/app/home; sleep 20
cd /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/harness
node -e 'import("./stack.mjs").then(m=>m.newToken(process.env.S))' > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/05-token-A.txt 2>&1
for sc in a b3 c3; do { echo "$ node $sc.mjs"; timeout 200 node $sc.mjs; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/06-harness-$sc.txt 2>&1; done
cd $W/scripts/local-stack
{ echo "$ docker compose logs server | grep -E 'run canceled|cancellation confirmed|brain stored run'"; docker compose logs --no-color server | grep -E 'run canceled|cancellation confirmed|brain stored run' | cut -c1-260; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/07-server-cancel-log.txt 2>&1
{ echo "# 개발 secret 6종의 값이 로그·이미지·저장소에 몇 번 나오는지(값 자체는 출력하지 않는다)"
  for f in jwt-secret shared-token pg-admin-password server-db-password brain-migration-password brain-runtime-password; do
    v=$(docker compose exec -T postgres cat /secrets/$f); [ -n "$v" ] || { echo "$f EMPTY"; continue; }
    c=$(docker compose logs --no-color 2>&1 | grep -c -- "$v")
    i=$(for im in proovy-local-tools proovy-local-server proovy-local-brain; do docker image inspect $im; docker history --no-trunc $im; done | grep -c -- "$v")
    r=$(git -C $W grep -c -- "$v" | wc -l)
    echo "$f len=${#v} logs=$c images=$i repo=$r"
  done; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/08-secret-grep.txt 2>&1
P=$(ss -Hltnp 'sport = :5198' | grep -oE 'pid=[0-9]+' | cut -d= -f2); [ -n "$P" ] && kill $P
{ echo "$ docker compose down -v"; docker compose down -v; echo; echo "# leftovers (containers volumes networks)";
  docker ps -a --filter label=com.docker.compose.project=proovy-local -q | wc -l
  docker volume ls --filter label=com.docker.compose.project=proovy-local -q | wc -l
  docker network ls --filter label=com.docker.compose.project=proovy-local -q | wc -l; } > /tmp/claude-1000/-home-chowon442-coding-workspace--worktree-Proovy-front-worktree-task-1-98/266a0cd4-70ab-4d06-88ae-eb9bf53ba14f/scratchpad/evidence/09-down.txt 2>&1
docker rmi proovy-local-tools proovy-local-server proovy-local-brain >/dev/null 2>&1; rm -f .env
echo EVIDENCE-DONE
