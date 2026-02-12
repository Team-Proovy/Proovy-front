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
- **msw**: Mock Service Worker (개발 환경에서 API 모킹)

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

```bash
# .env 파일 생성
cp .env.example .env  # (또는 수동으로 .env 생성)

# .env 파일에 다음 내용 추가
echo "VITE_API_BASE_URL=http://localhost:3000" >> .env
echo "VITE_ENV=development" >> .env
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
# 개발 서버 시작
pnpm run dev

# 브라우저에서 <http://localhost:5173> 접속
```

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
│   ├── providers/            # 전역 Provider (React Query, MSW)
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
├── mocks/                    # Mock Service Worker (MSW)
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
