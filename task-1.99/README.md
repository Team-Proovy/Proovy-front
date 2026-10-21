# task 1.99 재현·인수 원자료 (코드 아님)

Front #319(#315 합침)의 재현·원인 판정·수정 전후 비교 근거. 환경: Linux(4코어·RAM 3.7GB, 다른 세션과 공유), 1.98 Docker local stack(offline Brain, proovy-brain origin/dev `ab9c421` 스냅샷, Server 기본 pin `b576af3`), Vite 7.3.0 dev server `:5199`, Playwright 1.60.0 Chromium(`channel: "chromium"`, 새 headless = 전체 Chrome). before = Front `d3e95d8`, after = 1.99 branch.

## 경로

```
브라우저 ─▶ Vite dev server :5199 (/api proxy, vite.trace.config.ts로 계측) ─▶ upstream-relay :29692 ─▶ Server :8080 (컨테이너)
```

- `harness/vite.trace.config.ts`: 저장소 vite.config.ts에 proxy 이벤트 기록만 덧붙인다(`proxy-trace.log`: 요청별 start·upstream.response·upstream.end·res.close·upstream.res.close complete).
- `harness/upstream-relay.mjs`: dev proxy ↔ Server 구간 중계. `cut?mode=reset`(RST) / `cut?mode=stall`(FIN·RST 없이 전달 중단 = half-open, Server가 닫아도 숨김).
- `harness/repro.mjs`: 같은 Note에서 A(질문→완료→다음 질문)·C(완료 뒤 새로고침)·B(진행 중 새로고침: `docker compose pause brain` 3초 → reload → restore `GET /events` 확인 → unpause) N회. CDP Network로 요청별 시작·header·끝·실패를 `requests.tsv`에, 500ms마다 `samples.tsv`에 기록한다.
  - `apiInflight`: 브라우저에서 아직 끝나지 않은 `/api` 요청 수(CDP)
  - `sseInflight`: 그중 run SSE(`POST /api/conversations`, `GET /api/ai-runs/*/events`)
  - `browserToVite`: 브라우저→Vite established TCP(HMR websocket 1개 포함)
  - `viteToServer`: host의 `dport=8080` established TCP(Vite→docker-proxy와 docker-proxy→컨테이너가 함께 세어져 실제의 약 2배)
  - `serverEstablished`: Server 컨테이너 `/proc/net/tcp`의 `:8080` ESTABLISHED
- `harness/cut.mjs`: 홈 첫 질문(Brain pause) → stream이 열리면 relay cut → unpause → terminal(AI 응답)까지 시간.

## 결과 요약

| 항목 | before (d3e95d8) | after (1.99) |
|---|---|---|
| A 질문→완료→다음 질문 ×5 | 실패 0 (`before/`) | 실패 0 (`after/A`) |
| C 완료 뒤 새로고침 ×5 | 실패 0 | 실패 0 (`after/C`) |
| B 진행 중 새로고침 | B1~B4 통과, B5는 잔액 부족 402(RUN4021, 하네스가 한 사용자로 11번째 질문) | ×5 통과(흐름마다 새 사용자) (`after/B`) |
| 문서 로드 실패 / 연결 끊김 안내 | 0 / 0 | 0 / 0 |
| 열린 run SSE(브라우저) 최대 | 1 | 1 |
| 흐름 종료 뒤 apiInflight·sse·browserToVite·viteToServer·serverEstablished | 0·0·1·0·0 | 0·0·1·0·0 |
| dev proxy ↔ Server reset(RST) | 회복 1.9s·6.3s (Node가 브라우저 응답을 끝내 eof → 재접속) | 회복 1.2s |
| dev proxy ↔ Server half-open(stall) | **100s·80s 안에 회복 못함** — "진행 중" 유지(#315 재현) | 회복 43.5s·42.4s(마지막 수신 45s 뒤 abort → 같은 cursor로 `GET /events` → terminal) |

- 증상 1(새로고침 문서 로드 실패)·증상 2(같은 Note 다음 질문 연결 끊김 반복)는 이 환경에서 before에서도 재현되지 않았다. 추가로 시도한 조건: 질문 간격 20s·hold 40s(`before/longhold-swfree`), 예전 fixture 모드의 MSW Service Worker가 남은 상태(`before/sw-registered`) — 모두 연결 누수·문서 로드 실패 없음. 이 두 실행의 B 실패는 Brain pause가 Server Brain stream idle timeout(30s)을 넘겨 run이 `provider_error`로 끝난 것이다(`before/server-run-failures.log`).
- `before/loaded-run`: 서버 load average 29일 때의 실행(A5 답변 미도착 = Brain stream TIMEOUT, C2 reload 30s timeout = 부하). 증상 판정에 쓰지 않는다.
- 판정 근거 위치: half-open 전 before `before/cut-stall.log`(재접속 요청 없음), after `after/cut-stall-{1,2}.log`(`51.04 FAILED /events` → `51.97 GET /events` 같은 `Last-Event-ID`).
- body 읽기만 감시하던 1차 수정은 stall에서 실패했다(`after/cut.out`의 stall `FAIL`). 재접속 `GET /events`가 응답 header를 받기 전에 끊겨 fetch가 header를 기다리는 구간이었다(Brain pause 중이라 Server가 보낼 frame이 없고, 첫 heartbeat 15s 전에 끊김). 그래서 header 대기도 같은 시간으로 감시하도록 고쳤고, `after/cut-stall-{1,2}.log`가 그 뒤 결과다.
