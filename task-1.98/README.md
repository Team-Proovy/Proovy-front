# task 1.98 Linux offline 인수 검증 자료 (코드 아님)

Front PR #318의 Docker 로컬 stack 인수 원자료. 2026-10-20(UTC) 이 서버(Linux x86_64, Docker Compose 2.40.3)에서 `harness/run-evidence.sh` 한 번으로 만들었다. 유료 호출 없음(Brain offline seat).

- 기준: Front `a4dc0b5`(stack 파일; 이후 `cec40eb`는 README·주석·`.gitkeep`만 바꿈), Server `b576af3`(git context), Brain `89520f6`(`git archive` 사본을 `BRAIN_DIR`로). Server 포트 `SERVER_PORT=28098`, Front dev server 5198.

## evidence/

| 파일 | 내용 |
| --- | --- |
| `00-env.txt` | HEAD, stack `.env`, compose 버전 |
| `01-build.txt` | `docker compose build` (BuildKit cache 사용 — 첫 cold build는 5m40s였다) |
| `02-up.txt` | `docker compose up -d --wait` (73.7s) |
| `03-ps.txt` | `docker compose ps -a` — one-shot 3개 Exited (0), 상주 4개 healthy. publish는 `server 127.0.0.1:28098->8080`뿐 |
| `04-init-logs.txt` | secrets·brain-migrate(0001~0005)·provision(role boundary) 로그 |
| `05-token-A.txt` | `issue-token` 첫 줄(사용자 id). token 원문은 기록하지 않았다 |
| `06-harness-a.txt` | 첫 질문 → Activity → 완료, 완료 뒤 새로고침 |
| `06-harness-b3.txt` | Brain pause 상태 진행 중 새로고침 복원 → unpause 후 완료 |
| `06-harness-c3.txt` | 정지: 중단 중 → `POST /cancel` 200 → 중단됨, 새로고침 뒤 유지 |
| `07-server-cancel-log.txt` | Server `run canceled`·`cancellation confirmed (brain_terminal)` |
| `08-secret-grep.txt` | 개발 secret 6종 값의 출현 수 — 컨테이너 로그·이미지 inspect/history·저장소 모두 0(값은 출력하지 않음) |
| `09-down.txt` | `docker compose down -v`와 잔여 컨테이너·volume·network 0 |

## harness/

- Playwright 1.60.0(chromium-1223), Node 22. 브라우저 요청 기록은 `/api/` 경로·method·status·Last-Event-ID만 남긴다(body·Authorization 없음).
- 시나리오마다 `docker compose exec -T postgres issue-token`으로 새 사용자(Free 플랜 노트 2개 제한).
- offline Brain은 run을 1~3초에 끝내므로 진행 중·정지 시나리오(b3·c3)는 질문 전 `docker compose pause brain`으로 붙잡고 확인 뒤 `unpause`한다.
- 일회성 검증 도구다(제품 코드·CI 대상 아님). 경로는 이 서버 scratch 기준이다.

## shots/

시나리오별 화면(A·B3·C3).
