# run SSE 연결 수명 진단 도구 (1.99·2.17)

대화 화면의 run SSE(`POST /api/conversations`, `GET /api/ai-runs/{runId}/events`) 연결 수명을 재현·기록하는 도구다. 제품 코드가 아니며 build·test 대상이 아니다. 1.98 Docker local stack(`scripts/local-stack/compose.yaml`)과 함께 쓴다.

## 2.17 판정 (2026-11-11, macOS)

1.99에서 이월한 두 증상(10-21 macOS 사용자 테스트)은 macOS에서 **자동으로 재현되지 않았다**. 근거 없이 제품 코드는 고치지 않았다. 2.18 live 인수 때 이 도구로 다시 본다.

- 증상 1: 대화 화면 새로고침 → 브라우저 "사이트에 연결할 수 없음"(문서 요청 실패)
- 증상 2: 응답을 받은 뒤 같은 Note 다음 질문 → "연결이 끊김" 안내 반복, 재연결 실패

환경: 맥북 Apple Silicon, macOS 26.0.1, Docker Desktop 28.3.2, offline stack(`-p proovy-stack`), Front `77a9ef8`(1.99 watchdog 포함), Vite 7.3.0 `:5173`(`vite.trace.config.ts`), Node 24.5.0.

| 실행          | 브라우저                  | 조건                                                                          | 실패                                                              |
| ------------- | ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A×5, C×5      | Playwright Chromium 148   | 간격 3s                                                                       | 0                                                                 |
| B×5           | Playwright Chromium 148   | Brain pause 뒤 새로고침                                                       | 0                                                                 |
| A×5, C×5, B×5 | Google Chrome 157(설치본) | 간격 3s                                                                       | B5만. 한 사용자로 11번째 질문이라 잔액 402(RUN4021) = 하네스 한도 |
| A×3, C×3      | Google Chrome 157         | 간격 70s(Server keep-alive 60s 초과), proxy 대상 `127.0.0.1:8080`(10-21 설정) | 0                                                                 |
| T×2           | Google Chrome 157         | 실패 run(provider_error) 뒤 같은 Note 다음 질문                               | 0                                                                 |

| 가설(1.99)                                           | 판정                  | 근거                                                                                                                                                              |
| ---------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1 정리 안 된 SSE가 host당 6연결을 채움              | 기각(재현 조건 안)    | 브라우저에서 열린 run SSE는 최대 1. 흐름이 끝나면 Vite→Server·Docker 쪽·Server 컨테이너 ESTABLISHED가 모두 0. 브라우저→Vite는 HMR websocket 포함 1~2              |
| H2 새로고침 때 이전 stream과 restore가 겹침          | 기각                  | 진행 중 새로고침에서 restore `GET /events`는 새 페이지에서 한 번. 쌓이는 연결 없음                                                                                |
| H3 다음 질문에서 세션 상태가 꼬임                    | 기각                  | 매 질문이 새 `POST`이고 재접속 요청 0. 실패 run 뒤 다음 질문도 정상                                                                                               |
| H4 Server가 두 번째 run SSE를 끝내지 못함            | 기각                  | proxy trace의 모든 run SSE가 terminal 직후 `upstream.end`·`complete=true`                                                                                         |
| Docker Desktop 포트 전달이 소켓 종료를 전달하지 않음 | 기각(idle keep-alive) | `keepalive-probe.mjs`: Server가 60s 유휴 keep-alive를 닫자 host의 Node 소켓이 곧바로 FIN을 받고 Docker Desktop backend 소켓도 사라짐. 다음 요청은 새 소켓으로 200 |

Linux(1.99, `pr-assets/task-1.99`)에서도 재현되지 않았다. 따라서 원인이 Front 코드 쪽이라는 근거도, Docker Desktop 쪽이라는 근거도 없다.

원자료(HAR·net-log 제외: token 포함): [`pr-assets/task-2.17`](https://github.com/Team-Proovy/Proovy-front/tree/pr-assets/task-2.17/task-2.17).

### 10-21 사용자 테스트와 아직 다른 조건

- **live 모드**: 실제 모델이라 run이 몇 분씩 이어졌고, Server request timeout을 15m로 바꿨으며, 한 run이 `code=timeout`으로 끝났다(1.100). offline Brain은 1~3초에 끝나고 30초 넘게 붙잡을 수 없다(Server Brain stream idle timeout).
- 그날 macOS에서는 dev proxy ↔ Server half-open(#315)도 관찰됐다. 긴 run 도중 FIN·RST 없이 끊기는 조건(맥 절전·깨어남, Docker Desktop VM 일시정지, 네트워크 전환 등)이 있었을 수 있다.
- **평소 Chrome 프로필**(확장, 예전 fixture 모드 MSW Service Worker, 여러 탭·DevTools)을 화면에서 썼다. 자동 실행은 새 프로필 headless였다.
- Front는 1.98 브랜치(`1b856ed` 무렵, watchdog 이전)였다.
- Vite는 기본으로 `localhost` 하나(macOS에서는 `[::1]:5173`)에만 listen한다. `127.0.0.1:5173`으로 열면 연결이 거부되므로, 증상을 기록할 때는 주소창의 host도 함께 남긴다.

## 2.18에서 다시 볼 방법

1. live stack과 추적 Vite를 띄운다(저장소 루트).
   ```bash
   PROXY_TRACE_LOG=$PWD/proxy-trace.log pnpm exec vite --config scripts/sse-lifecycle/vite.trace.config.ts
   ```
2. 사람이 화면에서 쓰는 동안 연결 수를 기록한다: `scripts/sse-lifecycle/collect.sh <결과 디렉터리>`(같은 `PROXY_TRACE_LOG`를 주면 trace도 복사한다). 평소 Chrome에서는 `chrome://net-export`(socket pool 상태)와 DevTools Network(Preserve log) HAR을 함께 남긴다.
3. 같은 Note에서 다음 질문, 진행 중 새로고침, 완료 뒤 새로고침을 반복한다. 증상이 나오면 시각, 오류 코드(`ERR_...`), 주소창 host, 열린 탭 수, `chrome://serviceworker-internals`의 worker 유무를 적는다.
4. 판정 기준
   - `browserToVite`가 6 이상으로 쌓이고 HAR에서 `GET /events`가 45s마다 `stalled`로 끊기면 H1이다(1.99 watchdog 메모).
   - `viteToServer`·`dockerSide`가 남아 있는데 `serverEstablished`가 0이면 Docker 포트 전달이 종료를 전달하지 않은 것이다.
   - 브라우저 쪽만 남으면 Front·dev proxy 쪽이다.

자동 흐름은 `run-flows.sh`로 돌린다. offline에서 비용은 0이다. 2.17 PR에서 맥북으로 확인한 명령은 다음과 같다(A·C·B·T ×2 실패 0).

```bash
COMPOSE_PROJECT=proovy-stack BROWSER_CHANNEL=chrome GAP_MS=2000 \
  PLAYWRIGHT_MODULE=$HOME/Projects/Proovy-front/node_modules/playwright/index.mjs \
  PROXY_TRACE_LOG=$PWD/proxy-trace.log \
  scripts/sse-lifecycle/run-flows.sh ../sse-runs A,C,B,T 2
```

- `.env.local`이 없는 checkout은 `VITE_KAKAO_CLIENT_ID`·`VITE_KAKAO_REDIRECT_URI`가 비어 화면이 빈 페이지가 된다. dev server를 띄울 때 env로 placeholder를 준다(`VITE_KAKAO_CLIENT_ID=local-placeholder VITE_KAKAO_REDIRECT_URI=http://localhost:5173/oauth/kakao`).
- 결과 디렉터리는 저장소 밖에 둔다.

## 도구

| 파일                   | 하는 일                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repro.mjs`            | Playwright로 같은 Note 흐름 A(다음 질문)·C(완료 뒤 새로고침)·B(진행 중 새로고침)·T(실패 run 뒤 다음 질문)를 N회 돌린다. CDP 요청 기록(`requests.tsv`), 500ms 연결 수(`samples.tsv`), 화면 안내(`events.log`), 실패(`summary.txt`)를 남긴다. 선택: `HAR=1`, `NETLOG=1`(Chrome net-log), `BROWSER_CHANNEL=chrome`(설치된 Chrome), `HEADLESS=0` |
| `run-flows.sh`         | 흐름마다 새 사용자 token을 받아 `repro.mjs`를 돌리고 Server 로그·proxy trace를 흐름별로 모은다. token은 출력하지 않는다                                                                                                                                                                                                                      |
| `collect.sh`           | 사람이 재현하는 동안 1초마다 소켓 수를 기록하고, 끝낼 때 Server 로그·compose 상태·남은 소켓을 저장한다(macOS `lsof`, Linux `ss`)                                                                                                                                                                                                             |
| `vite.trace.config.ts` | 저장소 `vite.config.ts`에 dev proxy 이벤트 기록만 덧붙인다                                                                                                                                                                                                                                                                                   |
| `upstream-relay.mjs`   | dev proxy ↔ Server 사이 TCP 중계. reset(RST)·stall(half-open)·`STALE=1`(FIN 미전달)로 단절을 흉내 낸다                                                                                                                                                                                                                                       |
| `keepalive-probe.mjs`  | host → Docker publish 포트의 keep-alive 소켓이 Server의 idle close(FIN)를 받는지 본다(macOS)                                                                                                                                                                                                                                                 |

- Playwright는 이 저장소의 의존성이 아니다. 이미 설치된 패키지를 `PLAYWRIGHT_MODULE=<…/node_modules/playwright/index.mjs>`로 가리킨다. 브라우저를 새로 설치하지 않는다.
- 맥북 stack은 `COMPOSE_PROJECT=proovy-stack`을 준다. 기본값은 compose 파일 이름 `proovy-local`이다.
- Free 잔액 때문에 한 사용자로 10질문을 넘기면 RUN4021이 난다. `run-flows.sh`는 흐름마다 새 사용자를 쓴다.
- HAR에는 `Authorization` header가 들어 있다. HAR·net-log는 공유하거나 commit하지 않는다.
- `docker compose config`·`docker inspect` 출력은 남기지 않는다.
