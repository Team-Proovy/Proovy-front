# Proovy Frontend

Proovy는 **이공계 대학생을 위한 퍼스널 AI 튜터** 서비스로,

정확한 풀이 검증 · 수식 친화적인 입력 · 학습 루프 제공을 목표로 합니다.

본 저장소는 Proovy 서비스의 **Frontend(Web)** 코드베이스이며,

팀 단위 협업을 전제로 한 명확한 컨벤션과 구조를 따릅니다.

---

## 👥 Member

| 강민경                                      | 이다영                                 | 이승준                             | 지현구                                  |
| ------------------------------------------- | -------------------------------------- | ---------------------------------- | --------------------------------------- |
| [강민경](https://github.com/Mingyeong-Kang) | [이다영](https://github.com/dev-ldy03) | [이승준](https://github.com/L0521) | [지현구](https://github.com/stringnine) |

<br/>

---

## 1️⃣ 기술 스택 및 선정 이유

### Framework / Language

- **React** ^19.2.0
- **TypeScript** ~5.9.3

### React 선택 이유

Proovy는 채팅, 수식 입력, PDF 뷰어, 실시간 에디터 등 **UI 복잡도가 매우 높은 화면**들로 구성되어 있습니다.

- **컴포넌트 단위 설계**로 **채팅, 뷰어, 캔버스, 워크스페이스**를 **명확한 책임 단위로 분리** 가능합니다.
- 상태 변화가 빈번한 대화형 UI와 실시간 스트리밍(SSE) 기반의 메시지 업데이트에 최적화되어 있습니다.

### TypeScript 선택 이유

Proovy의 도메인 모델은 **채팅 메시지, 수식 메타데이터, API 응답** 등으로 **구조가 복잡**합니다.

- 타입 안정성으로 **런타임 에러를 사전에 방지**하고, 팀 협업 시 타입이 **자체 문서 역할** 수행합니다.
- IDE 자동완성 지원으로 **개발 생산성이 향상**됩니다.

---

### Styling

- **TailwindCSS v4**

### TailwindCSS 선택 이유

- 디자인 토큰을 유틸리티 클래스로 관리하여 **UI 일관성 유지**가 용이합니다.
- 빠른 UI 프로토타이핑이 가능하여 MVP 개발 속도를 크게 향상시킵니다.
- Prettier 플러그인과 함께 사용하여 **스타일 코드 정렬 자동화**가 가능합니다.

---

### Package / Tooling

- **pnpm**
- **Prettier**
- **ESLint**

### pnpm 선택 이유

- 모노레포 및 대규모 의존성 환경에서 **디스크 사용량과 설치 속도**가 효율적입니다.
- lockfile 기반으로 팀원 간 **완전히 동일한 의존성 환경**을 보장합니다.

### Prettier / ESLint 선택 이유

- 코드 스타일 논쟁을 제거하고, **리뷰 포인트를 로직에만 집중**하기 위함입니다.
- 커밋 전 포맷팅을 강제하여 코드 품질을 일정 수준 이상으로 유지합니다.

---

### 주요 의존성 및 라이브러리

### 상태 관리

- **@tanstack/react-query**: 서버 상태 관리 및 캐싱
- **zustand**: 클라이언트 상태 관리 (간결하고 가벼운 구조)

### 수식 입력 및 렌더링

- **mathlive**: 수학 수식 입력 컴포넌트
- **katex**: LaTeX 기반 수식 렌더링
- **remark-math**, **rehype-katex**: markdown 내 수식 지원

### PDF 및 문서 뷰어

- **pdfjs-dist**: PDF 렌더링 및 뷰어
- **react-markdown**: markdown 마크업 렌더링

### 캔버스 / 드로잉

- **tldraw**: 화이트보드 및 드로잉 기능

### API 및 HTTP

- **axios**: HTTP 클라이언트
- **msw**: Mock Service Worker (fixture 모드에서만 API 모킹)

### UI 컴포넌트

- **lucide-react**: 아이콘 라이브러리
- **clsx**, **tailwind-merge**: CSS 클래스 유틸리티

### 라우팅

- **react-router-dom**: 클라이언트 라우팅

---

## 2️⃣ 빌드 및 개발 스크립트

### 사용 가능한 스크립트

```bash
# 개발 서버 실행 (<http://localhost:5173>)
pnpm run dev

# 프로덕션 빌드
pnpm run build

# ESLint 검사
pnpm run lint

# Prettier 코드 포매팅
pnpm run format

# 빌드된 결과 미리보기
pnpm run preview
```

### Path Alias 사용

Vite 설정에서 `@` alias가 `src/` 디렉토리를 가리키도록 설정되어 있습니다.

```tsx
// ✅ 좋음: @ alias 사용
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { cn } from "@/shared/lib/utils";

// ❌ 나쁜 예: 상대 경로
import { useAuth } from "../../../features/auth/hooks/useAuth";
```

---

## 3️⃣ 초기 개발 환경 설정 (New Developer Setup)

### 1단계: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone <https://github.com/Team-Proovy/Proovy-front.git>
cd Proovy-front

# 의존성 설치 (pnpm 필요)
pnpm install

# pnpm이 없다면 설치
npm install -g pnpm
```

### 2단계: 환경 변수 설정

개발 서버는 `/api` 요청을 vite proxy로 보내므로 `VITE_API_BASE_URL`은 비워 둔다(빈 값이거나 없으면 같은 origin의 `/api`). 값을 넣으면 API client와 fixture mock이 모두 그 주소를 쓴다.

```bash
# .env.local (git에 올리지 않는다)
VITE_API_BASE_URL=
# 필수: 소셜 로그인 설정. 없으면 앱이 시작되지 않는다.
VITE_KAKAO_CLIENT_ID=...
VITE_KAKAO_REDIRECT_URI=...
VITE_NAVER_CLIENT_ID=...
VITE_NAVER_REDIRECT_URI=...
# 선택: proxy 대상 Server (기본 http://localhost:8080). VITE_ 접두사가 없어 브라우저에 노출되지 않는다.
# DEV_API_PROXY_TARGET=http://localhost:8080
# 선택: API 모드 server(기본) | fixture — 아래 "개발 API 모드" 참고
# VITE_API_MODE=server
```

### 3단계: IDE 설정 (VS Code)

권장 확장프로그램:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **TypeScript Vue Plugin (Volar)** (`Vue.volar`) - TypeScript 지원
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind 자동완성

자동 포매팅이 저장 시 활성화됩니다 (`.vscode/settings.json` 설정됨):

- `formatOnSave`: true
- 기본 포매터: Prettier
- ESLint 자동 수정 활성화

### 4단계: 개발 서버 실행

```bash
# 개발 서버 시작 (기본: 실제 Server 연결)
pnpm run dev

# 브라우저에서 <http://localhost:5173> 접속
```

### 개발 API 모드

개발 서버의 API 연결은 `VITE_API_MODE`로 명시적으로 고른다. 운영 build에는 MSW가 들어가지 않는다.

| 모드            | 실행                                 | 동작                                                                                                                                                                                                                                                            |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server` (기본) | `pnpm run dev`                       | MSW를 켜지 않는다. `/api`를 vite proxy로 실제 Server(`DEV_API_PROXY_TARGET`, 기본 `http://localhost:8080`)에 보낸다. 로컬 Server를 먼저 띄운다.                                                                                                                 |
| `fixture`       | `VITE_API_MODE=fixture pnpm run dev` | MSW가 응답한다. 대화(전송·SSE·대화 조회·정지)는 browser-run-v1 fixture handler(`src/features/run/session/mocks`), 그 밖의 화면(인증·사용자·노트·스토리지·크레딧·도구·검색)은 `src/mocks/handlers`의 개발 mock을 쓴다. mock이 없는 요청은 proxy로 그대로 나간다. |

- `server`·`fixture` 밖의 값은 `pnpm run dev` 시작 때 오류로 거부한다.
- fixture 모드에서는 인증도 mock이다. 로그인·토큰 갱신·로그아웃이 mock 토큰으로 응답한다.
- fixture 모드에서 대화로 새로 생긴 Note(noteId 9001부터)는 노트 목록·상세 mock에 없다. 그래서 제목이 기본값("노트 9001")으로 보이고 노트 목록에 나타나지 않는다. 그 Note의 이름 변경·삭제는 mock이 없어 proxy로 나가 실패한다.
- fixture run Server는 페이지 메모리에 있어 새로고침하면 진행 중이던 run이 사라진다.

### 로컬 Server·Brain stack (실제 연결)

`server` 모드로 실제 대화(Note 생성·Activity·검증 응답·정지·재접속)를 확인하려면 로컬 Server와 Brain을 함께 띄운다. `scripts/local-stack/compose.yaml`이 macOS·Windows·Linux 어디서든 `docker compose` 한 번으로 Postgres·Redis·Server(local profile)·Brain(proovy-brain 로컬 이미지)을 올린다. 운영 API·DB·GCS·OAuth는 쓰지 않는다.

필요한 것은 Docker Desktop(또는 Docker Engine + Compose v2.24 이상)·Node·pnpm, 그리고 proovy-brain checkout(1.97 merge `89520f6` 이후 commit)뿐이다. **proovy-brain은 비공개 저장소다** — Team-Proovy 접근 권한으로 clone한 로컬 checkout이 있어야 Brain 이미지를 빌드할 수 있다(compose는 git URL이 아니라 그 checkout에서 빌드한다). Java·Python·uv는 필요 없다 — Server jar와 Brain은 이미지 빌드 안에서 만든다.

- **Docker 메모리 4GB 이상**: Server·Brain·Postgres와 첫 빌드(Gradle)를 함께 돌린다. Docker Desktop은 Settings → Resources → Memory에서 4GB 이상으로 둔다.
- **Apple Silicon**: 모든 base 이미지가 arm64를 지원해 native로 빌드된다(Rosetta 불필요). 첫 빌드는 Gradle·Python 의존성을 내려받아 몇 분 걸린다.
- **Windows**: PowerShell에서 같은 명령을 쓴다. 스크립트는 `.gitattributes`로 LF를 유지한다.

```bash
cd scripts/local-stack
cp .env.example .env          # BRAIN_DIR(proovy-brain checkout 경로) 등. 기본은 ../../../proovy-brain
docker compose up -d --build --wait            # offline(기본, 유료 호출 없음). 모두 healthy/완료되면 돌아온다
docker compose exec postgres issue-token       # 검증용 사용자 + access token(1시간 유효)과 브라우저 Console용 한 줄 출력
```

Front는 저장소 루트에서 지금처럼 띄운다. Server는 `127.0.0.1:${SERVER_PORT:-8080}`에만 publish된다.

```bash
# 저장소 루트 .env.local (2단계, git 제외). 로컬 stack은 OAuth를 쓰지 않으므로 소셜 로그인 값은 placeholder여도 된다
VITE_KAKAO_CLIENT_ID=local-placeholder
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/oauth/kakao/callback
VITE_NAVER_CLIENT_ID=local-placeholder
VITE_NAVER_REDIRECT_URI=http://localhost:5173/oauth/naver/callback
# Node가 localhost를 ::1로 먼저 풀어도 연결되게 IPv4로 적는다
DEV_API_PROXY_TARGET=http://127.0.0.1:8080
```

```bash
pnpm run dev    # 브라우저는 http://localhost:5173
```

- 브라우저는 **`http://localhost:<port>`로 연다.** Server local profile의 CORS는 `http://localhost:*` Origin만 허용하므로 `127.0.0.1`로 열면 전송·정지(POST)가 403이다.
- Server에는 개발용 로그인이 없다. `issue-token`이 출력한 한 줄을 브라우저 Console에서 실행한다(localStorage `accessToken`과 `auth-storage`를 넣고 새로고침). token은 refresh가 없어 만료되면(401) 다시 발급한다. Free 플랜은 노트 2개까지라 홈 첫 질문이 막히면 새 사용자를 발급한다.
- 기동 순서: `secrets`(volume이 비어 있을 때 — 처음 또는 `down -v` 뒤 — 개발용 JWT secret·shared token·DB password를 생성하고, 있으면 그대로 쓴다. 같은 volume의 DB가 그 password로 만들어져 있다) → `postgres`·`redis` → `server`(Flyway) → `brain-migrate`(Brain `db bootstrap`·`db migrate`) → `provision`(Server `role-boundary.sql`) → `brain`. secret 값은 compose 파일·이미지에 없다.
- 이미지는 셋이다: `proovy-local-tools`(`secrets`가 빌드하고 `postgres`·`provision`이 같이 쓴다), `proovy-local-server`(`server`), `proovy-local-brain`(`brain`이 빌드하고 `brain-migrate`가 같이 쓴다). 같은 이미지를 두 서비스가 빌드하지 않으므로 Docker Desktop의 병렬 빌드(bake)·containerd image store에서도 `image ... already exists` 충돌이 나지 않는다. 같이 쓰는 서비스는 `pull_policy: never`라 registry에서 받지 않는다 — 처음에는 전체 `up --build` 또는 `docker compose build`로 이미지를 만든 뒤 개별 서비스를 실행한다. 이미지만 다시 빌드하려면 `docker compose build`(서비스를 고를 때는 `secrets`·`server`·`brain`).
- Brain DB 명령·runtime은 loopback 대상만 허용하므로 Brain 컨테이너는 Postgres 컨테이너의 network namespace를 공유해 `127.0.0.1:5432`로 붙는다. Server는 `http://postgres:8080`으로 Brain을 부른다. host에는 Server 포트 하나만 열린다.
- Server 소스는 기본으로 공개 Proovy-server 저장소의 pin한 commit(`.env.example`의 `SERVER_CONTEXT`)을 Docker가 직접 받아 빌드한다. 로컬 checkout을 쓰려면 `SERVER_CONTEXT`에 경로를 준다(Windows checkout은 `core.autocrlf`로 `gradlew`가 CRLF이면 빌드가 실패한다 — 기본 git URL을 쓰거나 LF로 받은 checkout을 쓴다). proovy-brain checkout을 바꿨다면 `--build`로 다시 빌드한다.
- DB는 `down -v` 전까지 volume에 남는다. Server·Brain commit을 바꾼 뒤 Flyway나 `brain-migrate`가 실패하면(migration 이력 불일치) `docker compose down -v`로 지우고 다시 띄운다.
- `postgres` 컨테이너만 재시작되면(`docker compose restart postgres`, OOM 등) 그 network namespace를 쓰는 Brain이 끊긴다. `docker compose up -d --wait`로 다시 맞춘다.
- 로컬 개발용이라 모든 서비스가 `secrets` volume 전체를 읽는다(Brain 컨테이너도 DB 관리자 password·JWT secret을 읽을 수 있다). DB role 경계는 Server·Brain 연결 role 사이의 경계이고, 컨테이너 사이의 secret 격리는 하지 않는다.
- 포트·요청 한도·run 마감은 `.env`로 바꾼다(`SERVER_PORT`, `RATE_LIMIT_MAX_REQUESTS`, `RUN_REQUEST_TIMEOUT`). `SERVER_PORT`를 바꾸면 `DEV_API_PROXY_TARGET`도 같이 바꾼다.
- `RUN_REQUEST_TIMEOUT`은 Server가 run 접수 때 고정하는 request deadline(`proovy.run.snapshot.request-timeout`)이다. 기본은 offline 3m(Server 기본과 같다)·live 10m이고, 허용 범위는 0 초과 30m 이하다. Server는 마감 뒤 stream 여유 3m를 더 기다린다. Brain run 상한이 15m라 그보다 길게 해도 효과가 없다. 로컬 stack 전용 값이며, 운영 값은 바꾸지 않고 별도 Server 이슈에서 다룬다.
- 상태·로그: `docker compose ps -a`, `docker compose logs server brain`.
- offline Brain은 한 질문을 1~3초 안에 끝낸다. 진행 중 화면·정지·진행 중 새로고침을 보려면 질문 전에 `docker compose pause brain`으로 Brain을 멈춰 두고, 확인한 뒤 `docker compose unpause brain`으로 이어 간다(Server는 run을 받아 두고 Brain 응답을 기다린다).
- Vite dev proxy는 Server 쪽 소켓이 끊겨도 브라우저 응답을 닫지 않는다. 연결 끊김 재접속은 브라우저↔dev server 구간을 끊어 확인한다.

정리:

```bash
docker compose down -v             # 컨테이너·network·volume(DB 데이터·secret) 삭제
docker compose down -v --rmi all   # 빌드·pull한 이미지까지 삭제. Gradle 빌드 cache는 docker builder prune
```

#### live 모드 (실제 모델)

> **비용 주의**: live 모드의 질문은 실제 OpenRouter 추론과 Daytona sandbox를 호출해 요금이 든다(질문 하나에 여러 모델 호출). 필요할 때만 켜고, 확인이 끝나면 offline으로 되돌린다.

1. proovy-brain `.env.local`에 키(`OPENROUTER_API_KEY`·`DAYTONA_API_KEY`)와 모델 설정을 둔다(proovy-brain README). compose `env_file`은 따옴표 없는 값과 큰따옴표 값 안의 `$`를 변수로 보간하므로 `$`가 들어간 값은 작은따옴표로 감싼다(`KEY='a$b'`). `DATABASE_URL`·`INTERNAL_API_SHARED_TOKEN`은 stack이 덮어쓴다.
2. `scripts/local-stack/.env`에 `BRAIN_ENV_FILE=<.env.local 절대 경로>`를 적는다(Linux는 `LOCAL_UID`·`LOCAL_GID`도 `id -u`·`id -g`로).
3. capability 스냅샷을 조회한다(1.97 `capabilities refresh`: OpenRouter 공개 models 목록 조회, 추론 비용 없음). 결과는 `BRAIN_CAPABILITIES_DIR`(기본 `scripts/local-stack/capabilities/`, git 제외)에 쓰인다. 기본 디렉터리는 저장소에 빈 디렉터리(`.gitkeep`)로 있다 — 다른 경로를 쓰면 먼저 `mkdir`로 만든다(Linux에서 Docker가 대신 만들면 root 소유라 조회 컨테이너가 쓰지 못한다). 출력에 `removed ...` 줄이 있으면 이전 스냅샷이 지워진 것이고 `capabilities.env`는 통째로 바뀐다. 모델 설정을 바꾸면 다시 조회한다.

   ```bash
   docker compose -f compose.yaml -f compose.live.yaml run --rm --build capabilities   # --build: 이미지가 없거나 checkout이 바뀌었으면 Brain 이미지를 먼저 빌드
   ```

4. live로 띄운다. offline stack이 떠 있어도 `up`은 one-shot 단계(`secrets`·`brain-migrate`·`provision`)를 다시 돌리고 그 완료를 기다린 뒤 Brain 컨테이너를 live로 바꾼다. Server도 run 마감(`RUN_REQUEST_TIMEOUT`, live 기본 10m — 실제 모델 검증은 Server 기본 3m를 넘겨 `timeout`으로 끝날 수 있다)이 바뀌어 다시 만들어진다. one-shot 단계가 실패하면 Brain이 뜨지 않으니 `docker compose ps -a`·`logs`로 확인한다. offline으로 돌아가려면 `docker compose up -d --wait`.

   ```bash
   docker compose -f compose.yaml -f compose.live.yaml up -d --build --wait
   ```

- 키는 실행 시 env로만 넘어가고 compose 파일·이미지·로그에 남지 않는다. 다만 `docker compose ... config`와 `docker inspect`는 env 값을 보여 주므로 그 출력을 공유하지 않는다.
- 스냅샷 없이 live로 띄우면 Brain이 기동에서 거부한다(`docker compose logs brain`).

#### testkit scenario 재현 (Linux 전용, 1.96 `local-stack.sh`)

특정 결과(미지원·미검증·혼합·추가 정보 요청)나 진행 중 hold를 재현하려면 Docker stack 대신 1.96 `scripts/local-stack/local-stack.sh`를 쓴다. proovy-brain testkit(control route)으로 Brain을 띄우므로 Linux·Java(Server bootJar)·uv가 필요하다. 두 stack을 동시에 띄우지 않는다(기본 Server 포트 8080이 겹친다).

```bash
SERVER_DIR=<Proovy-server bootJar 완료 소스> BRAIN_DIR=<uv sync된 proovy-brain> scripts/local-stack/local-stack.sh up
scripts/local-stack/local-stack.sh token   # 새 사용자 + access token 파일 경로 출력(1시간 유효)
DEV_API_PROXY_TARGET=http://127.0.0.1:8080 pnpm run dev --port 5196
scripts/local-stack/local-stack.sh down
```

- 포트·컨테이너 이름은 환경변수로 바꾼다(기본 Postgres 29632·Redis 29679·Server 8080·Brain 29680/29681, 접미사 `t196`, 스크립트 헤더 주석 참고).
- scenario·hold는 Brain testkit control route에 그 요청의 `requestId`로 먼저 등록한다(proovy-brain `testkit/README.md`). 1.96 인수 검증에 쓴 Playwright 하네스와 요청 기록은 PR #316의 `pr-assets/task-1.96` branch에 있다.

### 검증

```bash
# 타입 검사
pnpm run build

# 린트 검사
pnpm run lint

# 코드 포매팅
pnpm run format
```

---

## 4️⃣ 프로젝트 폴더 구조 (Feature-based Structure)

```bash
src/
├── app/                      # 앱 전역 설정
│   ├── providers/            # 전역 Provider (React Query)
│   ├── router/               # 라우터 설정
│   └── styles/               # 전역 스타일
│
├── features/                 # 핵심 비즈니스 기능
│   ├── auth/                 # 로그인 / 인증
│   ├── chat/                 # 채팅 / SSE
│   ├── editor/               # 캔버스 / 수식 입력 (tldraw, mathlive)
│   ├── assets/               # 자산 업로드 / 파일 관리
│   ├── notes/                # 노트 관리
│   ├── search/               # 검색 기능
│   ├── settings/             # 설정
│   ├── sidebar/              # 사이드바
│   ├── storage/              # 스토리지 관리
│   └── subscription/         # 구독 및 결제
│
├── shared/                   # 전역 공통 모듈
│   ├── api/                  # API 클라이언트 (axios)
│   ├── assets/               # 이미지 등 정적 자산
│   ├── components/           # 공용 컴포넌트
│   ├── hooks/                # 공용 훅
│   ├── layout/               # 레이아웃 컴포넌트
│   ├── lib/                  # 유틸리티 함수
│   └── utils/                # 헬퍼 함수
│
├── pages/                    # 특정 기능이 포함되지 않는 페이지
│   ├── HomePage.tsx
│   ├── LandingPage.tsx
│
├── mocks/                    # fixture 모드 MSW (VITE_API_MODE=fixture)
│   ├── browser.ts
│   ├── handlers.ts
│   └── handlers/
│
└── main.tsx                  # 앱 진입점
```

---

## 5️⃣ Git Workflow & Convention

### Branch Strategy

- `main`: 실제 배포용
- `dev`: 개발 통합 브랜치
- `feat/*`: 기능 개발 브랜치
  - 기능 구현용 브랜치
  - 반드시 `dev`에서 분기하고 `dev`로 머지

### 이슈 종류

- `[Feature]`: 새로운 기능 추가
- `[Bug]`: 버그 발생
- `[Fix]`: 버그 수정
- `[Refactor]`: 코드 구조 개선
- `[Documentation]`: 문서 작성/수정
- `[Chore]`: 프로젝트 설정 및 기타 작업
- `[Enhancement]`: 기능 개선 요청
  1. **Issue 발행**
     - 이슈 하나(브랜치 하나)에서 하나의 기능만 개발
     - **Issue 템플릿 (**`.github/ISSUE_TEMPLATE/feature-request.md`**) 사용**
     - 이슈 제목 형식: `[이슈 종류(대문자로 시작)] 이슈_제목`
       - 예: `[Feat] example API 구현`
       - 예: `[Fix] dev 브랜치 충돌 해결`
     - Assignees / Labels 설정
  2. **로컬 최신화**
     - `git fetch`
     - `git pull`

### **브랜치 네이밍 규칙**

- 기본 규칙: `feat/이슈번호-기능명`
- 실제 사용 패턴(이슈 라벨 반영): `issue_label/issue_number-detail`
  - 예: `feat/12-init-project`
  - 예: `fix/3-add-login`
  - 예: `refactor/22-cart-page`

### Commit Message Convention

- 커밋 전에 **프리티어 적용**하기 → `pnpm run format`
  - **`.prettierc`**
- 커밋 작성 시 Body에 커밋 관련 설명을 자세하게 적기
- **커밋 메시지**: `이슈종류: “커밋 관련 설명” (#이슈번호)`

```jsx
예시)
feat: 로그인 구현 (#9)
fix: 카드 페이지 수정 (#10)
refactor: 아이콘 리팩토링 (#13)
```

### Pull Request Convention

- **PR 제목 규칙**: **타입(#이슈번호): pr내용**

```jsx
예시)
Feat(#9): 로그인 구현
Fix(#10): 카드 페이지 수정
Refactor(#13): 아이콘 리팩토링
```

- **PR은 대충 쓰지 말고 팀원이 리뷰하기 쉽도록 예쁘고 자세하게 작성하기**
- 테스트 결과를 **스크린샷**으로 PR에 포함하기 **(머지 이전에 개인적으로 테스트를 꼭 하기)**
- Pull Request 작성
  - PR 템플릿 사용 → `.github/PULL_REQUEST_TEMPLATE.md`
- `dev` **브랜치로의 머지는 2명 이상의 Approve가 필요하다.**

---

## 6️⃣ Code Convention

**1️⃣ 파일 생성 규칙 (File Naming)**

| **파일 종류**         | **규칙 (Case)**        | **예시 (Example)** | **비고** |
| --------------------- | ---------------------- | ------------------ | -------- |
| **페이지 & 컴포넌트** | **PascalCase**         | `LoginPage.tsx`    |
| `SidebarItem.tsx`     | 대문자로 시작 (`.tsx`) |
| **훅(Hook)**          | **camelCase**          | `useAuth.ts`       |          |
| **그 외 모든 파일**   | **snake_case**         | `auth_api.ts`      |

`date_utils.ts`
`global_style.css` | 소문자 + 언더바 (`_`) |

**2️⃣ 코드 작성 규칙 (Variable & Function)**

| **종류**                    | **규칙 (Case)** | **예시 (Example)**                       |
| --------------------------- | --------------- | ---------------------------------------- |
| **변수 (Variable)**         | **camelCase**   | `const userInfo = ...`                   |
| `const isLoggedIn = true`   |
| **함수 (Function)**         | **camelCase**   | `const getUserData = () => {}`           |
| `function handleClick() {}` |
| **컴포넌트 함수**           | **PascalCase**  | `export default function LoginPage() {}` |

**📏 변수명 네이밍 규칙 (Naming Convention)**

| **데이터 종류 (Type)**              | **규칙 (Rule)**                              | **좋은 예시 (Good ✅)**     | **나쁜 예시 / 비고 (Bad ❌)** |
| ----------------------------------- | -------------------------------------------- | --------------------------- | ----------------------------- |
| **배열 (Array)**                    | **복수형** (`-s`)                            |
| 또는 **`List`** 접미사              | `const users = []`                           |
| `const mediaList = []`              | `const user = []` (단수형 금지)              |
| `const medias` (어색한 복수형 지양) |
| **객체 / 단일 값**                  | **단수형**                                   | `const currentUser = {...}` |
| `const selectedId = 1`              | `const users = {...}` (객체인데 복수형 금지) |
| **불리언 (Boolean)**                | **상태 접두사**                              |
| (`is`, `has`, `should`)             | `const isLoading = true`                     |
| `const hasError = false`            | `const loading = true` (동사 없음)           |
| `const check = false` (모호함)      |
| **함수 (Function)**                 | **동사 + 명사**                              | `getUserData()`             |
| `handleClick()`                     | `userData()` (명사만 사용 금지)              |
| `process()` (너무 포괄적임)         |

---

## 7️⃣ 개발 전 필수 체크리스트

### 기능 개발 시작

- [ ] **Issue 생성**: 작업 내용을 명확히 기술하고 Assignee/Label 설정
- [ ] **브랜치 생성**: `dev` 브랜치 최신화 후 `feat/이슈번호-기능명` 브랜치 생성
- [ ] **코드 컨벤션 준수**: 파일명, 변수명, 함수명이 모두 가이드 따름
- [ ] **타입 정의**: 모든 API 응답, Props에 TypeScript 타입 정의 완료

### 코드 작성 중

- [ ] **포매팅**: 개발 중에도 자주 `pnpm run format` 실행
- [ ] **린트**: 린트 에러 없는 상태 유지 (`pnpm run lint`)
- [ ] **타입 체크**: 타입 에러 없음 (`pnpm run build` 성공)
- [ ] **로딩/에러 상태**: 비동기 작업 시 `isLoading`, `error` 상태 표시

### 커밋 및 테스트

- [ ] **포매팅**: `pnpm run format` 실행
- [ ] **린트**: `pnpm run lint` 검사 통과
- [ ] **빌드**: `pnpm run build` 성공
- [ ] **기능 테스트**: 해당 기능이 의도대로 작동하는지 확인
- [ ] **스크린샷**: 주요 UI 변경사항 스크린샷 준비

### PR 생성 및 머지

- [ ] **PR 제목**: `타입(#이슈번호): 설명` 형식 준수
- [ ] **체크리스트**: PR 템플릿의 모든 항목 체크
- [ ] **리뷰 요청**: 최소 2명 이상의 리뷰어 지정
- [ ] **Approve 확보**: 2명 이상 Approve 후 머지

---

## 🔧 Troubleshooting

개발 중 발생한 문제와 해결 방법은 아래 링크를 참고하세요:

👉 **[Proovy FE 트러블슈팅](https://sugar-bed-70f.notion.site/FE-2e60b8a3409e80a99470e80a4d164189?source=copy_link)**

주요 내용:

- 환경 설정 오류
- 의존성 설치 문제
- 개발 서버 실행 오류
- 타입/린트 오류 해결
- API 연동 관련 문제
