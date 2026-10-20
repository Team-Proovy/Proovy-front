# task 1.96 인수 검증 자료 (코드 아님)

Front PR #316의 실제 연결 인수 검증 원자료. 기준: Front f8a6e30, Server b576af3, Brain 1be0945 testkit(offline seat).

## network/ — 시나리오별 브라우저 요청 기록

- `A.tsv`~`F.tsv`: Playwright가 기록한 브라우저 요청 중 `/api/` 전부(시각·method·status·path·Last-Event-ID). body·Authorization·cookie는 기록하지 않았다.
- 브라우저 origin: A는 `http://localhost:5196`(Vite dev server). B~F는 `http://localhost:5197` — B의 SSE 단절을 만들려고 브라우저와 Vite 사이에 둔 TCP 중계(`harness/cutproxy.mjs`)이고, 그 뒤는 같은 Vite dev server(→ Server :8080)다.
- 금지 호출 검사(6개 파일 전체): `POST /api/notes`, `/api/credits/use`, v2(`/api/conversations/{id}` 중 `/messages`가 아닌 것), Brain 포트(2968x), 운영 도메인 — 0건.

## harness/ — Playwright 시나리오

- Playwright 1.60.0(chromium-1223), Node 22. `common.mjs`는 `$S/stack/control-token`(local-stack.sh STATE_DIR)을 읽어 Brain testkit control route에 scenario·hold를 등록한다. 브라우저 요청 자체는 Server(dev proxy)로만 간다.
- 실행 예: `S=<dir, stack=STATE_DIR> BASE=http://localhost:5197 node b.mjs <user token 파일>`. 시나리오마다 새 사용자(`local-stack.sh token`)를 쓴다.
- 일회성 검증 도구다(제품 코드·CI 대상 아님).
