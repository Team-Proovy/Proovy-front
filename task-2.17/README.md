# task 2.17 macOS 재현 원자료 (코드 아님)

Front 2.17(1.99 이월) 증상 1(새로고침 문서 로드 실패)·증상 2(같은 Note 다음 질문 재연결 실패)를 macOS에서 자동 재현하려 한 기록. **재현되지 않았다.** 판정과 도구 사용법은 Front `scripts/sse-lifecycle/README.md`.

환경: 맥북 Apple Silicon, macOS 26.0.1, Docker Desktop 28.3.2, 1.98 compose stack offline(`-p proovy-stack`), Front `77a9ef8`, Vite 7.3.0 `:5173`(dev proxy 추적), Node 24.5.0. HAR·Chrome net-log는 token이 들어 있어 올리지 않았다.

| 디렉터리 | 브라우저 | 흐름·조건 | 결과 |
|---|---|---|---|
| `runs/before-pwchromium-AC` | Playwright Chromium 148 | A×5·C×5, 간격 3s | 실패 0 |
| `runs/before-pwchromium-B` | Playwright Chromium 148 | B×5 | 실패 0 |
| `runs/before-chrome-ACB` | Google Chrome 157 | A×5·C×5·B×5 | B5만 실패: 한 사용자 11번째 질문 RUN4021(`server.log`) |
| `runs/gap70-chrome-AC` | Google Chrome 157 | A×3·C×3, 간격 70s, proxy 대상 127.0.0.1:8080 | 실패 0 |
| `runs/failed-then-next-chrome` | Google Chrome 157 | T×2(provider_error 뒤 다음 질문) | 실패 0 |
| `runs/repo-tool-ACBT` | Google Chrome 157 | 저장소 `run-flows.sh`로 A·C·B·T ×2(흐름별 새 사용자) | 실패 0 |
| `runs/linux-review1-ACBT` | Playwright Chromium(Linux 서버, Docker Engine) | 리뷰 1회차 반영 도구(`c0a2d95`)로 A·C·B·T ×2. T 첫 run 실패를 Server 로그로 확인, `viteToServer`는 loopback만 | 실패 0 |
| `keepalive-8080.log` | — | host → Docker Desktop publish keep-alive, Server idle close(60s) 전달 | FIN 전달됨 |

파일: `requests.tsv`(CDP 요청별 시작·header·끝·status·connectionId), `samples.tsv`(500ms: apiInflight·sseInflight·browserToVite·viteToServer·dockerSide·serverEstablished), `proxy-trace.log`(dev proxy 이벤트), `events.log`·`summary.txt`, `server.log`.
